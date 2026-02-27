'use server';

import { db } from '@/lib/db';
import { orders as ordersSchema, tables as tablesSchema, orderItems as orderItemsSchema } from '@/db/schema';
import { eq, inArray, desc, and } from 'drizzle-orm';

export interface OrderData {
    id: string;
    orderNumber: number;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    totalAmount: number;
    tableId: string;
    tableNumber: string;
    createdAt: Date;
    paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA' | null;
}

export async function createOrderAction(data: {
    branchId: string;
    tableId: string;
    items: { productId: string; quantity: number; priceAtTime: number; customizations?: any }[];
    totalAmount: number;
    paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA';
    note?: string;
}) {
    try {
        // Calculate the next order number for this branch
        const [latestOrder] = await db.select({ orderNumber: ordersSchema.orderNumber })
            .from(ordersSchema)
            .where(eq(ordersSchema.branchId, data.branchId))
            .orderBy(desc(ordersSchema.orderNumber))
            .limit(1);
            
        const nextOrderNumber = latestOrder && latestOrder.orderNumber ? latestOrder.orderNumber + 1 : 1;

        const [insertedOrder] = await db.insert(ordersSchema).values({
            branchId: data.branchId,
            tableId: data.tableId,
            orderNumber: nextOrderNumber,
            status: 'PENDING',
            totalAmount: data.totalAmount.toString(),
            paymentMethod: data.paymentMethod,
            note: data.note,
        }).returning();

        if (data.items.length > 0) {
            await db.insert(orderItemsSchema).values(
                data.items.map(item => ({
                    orderId: insertedOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtTime: item.priceAtTime.toString(),
                    customizations: item.customizations ? JSON.stringify(item.customizations) : null,
                }))
            );
        }

        return { success: true, order: insertedOrder };
    } catch (error: any) {
        console.error('createOrderAction error details:', {
            message: error.message,
            stack: error.stack,
            detail: error.detail,
            hint: error.hint
        });
        return { success: false, error: 'Failed to create order' };
    }
}

export async function getActiveOrdersAction(branchId: string) {
    try {
        const activeOrders = await db.query.orders.findMany({
            where: and(
                eq(ordersSchema.branchId, branchId),
                inArray(ordersSchema.status, ['PENDING', 'PREPARING', 'READY'])
            ),
            with: {
                table: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(ordersSchema.createdAt)]
        });

        // Fallback: If note is missing due to stale schema in db.query, fetch it manually
        const enrichedOrders = await Promise.all(activeOrders.map(async (o: any) => {
            if (o.note === undefined) {
                try {
                    const [raw] = await db.select({ note: ordersSchema.note }).from(ordersSchema).where(eq(ordersSchema.id, o.id));
                    return { ...o, note: raw?.note || null };
                } catch (e) {
                    return o;
                }
            }
            return o;
        }));

        console.log('Fetched active orders count:', enrichedOrders.length);

        return {
            success: true,
            orders: enrichedOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status as 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED',
                totalAmount: parseFloat(o.totalAmount as string),
                tableId: o.tableId,
                tableNumber: o.table?.tableNumber || 'Unknown Table',
                createdAt: o.createdAt,
                paymentMethod: o.paymentMethod,
                note: o.note,
                items: o.items.map((item: any) => ({
                    productId: item.productId,
                    name: item.product?.name || 'Unknown Product',
                    quantity: item.quantity,
                    price: parseFloat(item.priceAtTime as string),
                    options: item.customizations ? JSON.parse(item.customizations) : undefined
                }))
            }))
        };
    } catch (error) {
        console.error('getActiveOrdersAction error:', error);
        return { success: false, error: 'Failed to fetch active orders' };
    }
}

export async function getPastOrdersAction(branchId: string, limit = 100) {
    try {
        const pastOrders = await db.query.orders.findMany({
            where: and(
                eq(ordersSchema.branchId, branchId),
                inArray(ordersSchema.status, ['COMPLETED', 'CANCELLED'])
            ),
            with: {
                table: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            orderBy: [desc(ordersSchema.createdAt)],
            limit,
        });

        return {
            success: true,
            orders: pastOrders.map((o: any) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status as 'COMPLETED' | 'CANCELLED',
                totalAmount: parseFloat(o.totalAmount as string),
                tableId: o.tableId,
                tableNumber: o.table?.tableNumber || 'Unknown Table',
                createdAt: o.createdAt,
                completedAt: o.completedAt,
                paymentMethod: o.paymentMethod,
                note: o.note,
                items: o.items.map((item: any) => ({
                    productId: item.productId,
                    name: item.product?.name || 'Unknown Product',
                    quantity: item.quantity,
                    price: parseFloat(item.priceAtTime as string),
                    options: item.customizations ? JSON.parse(item.customizations) : undefined
                }))
            }))
        };
    } catch (error) {
        console.error('getPastOrdersAction error:', error);
        return { success: false, error: 'Failed to fetch activity log' };
    }
}

import { deductInventoryForOrder } from './inventory';

export async function updateOrderStatusAction(orderId: string, status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED') {
    try {
        if (status === 'PREPARING') {
            const deductionResult = await deductInventoryForOrder(orderId);
            if (!deductionResult.success) {
                console.error('Inventory deduction failed:', deductionResult.error);
                // Optionally return error or proceed with warning.
                // For now, we proceed but log it, or we could block.
                // Let's block to ensure data consistency.
                return { success: false, error: 'Failed to deduct inventory: ' + deductionResult.error };
            }
        }

        await db.update(ordersSchema)
            .set({
                status,
                acceptedAt: status === 'PREPARING' ? new Date() : undefined,
                readyAt: status === 'READY' ? new Date() : undefined,
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
            })
            .where(eq(ordersSchema.id, orderId));
        return { success: true };
    } catch (error) {
        console.error('updateOrderStatusAction error:', error);
        return { success: false, error: 'Failed to update order status' };
    }
}

export async function getOrdersStatusAction(orderIds: string[]) {
    try {
        if (orderIds.length === 0) return { success: true, orders: [] };

        const result = await db
            .select({
                id: ordersSchema.id,
                status: ordersSchema.status,
            })
            .from(ordersSchema)
            .where(inArray(ordersSchema.id, orderIds));

        return {
            success: true,
            orders: result
        };
    } catch (error) {
        console.error('getOrdersStatusAction error:', error);
        return { success: false, error: 'Failed to fetch order statuses' };
    }
}

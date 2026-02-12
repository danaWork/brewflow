'use server';

import { db } from '@/lib/db';
import { orders as ordersSchema, tables as tablesSchema, orderItems as orderItemsSchema } from '@/db/schema';
import { eq, inArray, desc, and } from 'drizzle-orm';

export interface OrderData {
    id: string;
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
    items: { productId: string; quantity: number; priceAtTime: number }[];
    totalAmount: number;
    paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA';
}) {
    try {
        const [insertedOrder] = await db.insert(ordersSchema).values({
            branchId: data.branchId,
            tableId: data.tableId,
            status: 'PENDING',
            totalAmount: data.totalAmount.toString(),
            paymentMethod: data.paymentMethod,
        }).returning();

        if (data.items.length > 0) {
            await db.insert(orderItemsSchema).values(
                data.items.map(item => ({
                    orderId: insertedOrder.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtTime: item.priceAtTime.toString(),
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
        const activeOrders = await db
            .select({
                id: ordersSchema.id,
                status: ordersSchema.status,
                totalAmount: ordersSchema.totalAmount,
                tableId: ordersSchema.tableId,
                tableNumber: tablesSchema.tableNumber,
                createdAt: ordersSchema.createdAt,
                paymentMethod: ordersSchema.paymentMethod,
            })
            .from(ordersSchema)
            .leftJoin(tablesSchema, eq(ordersSchema.tableId, tablesSchema.id))
            .where(
                and(
                    eq(ordersSchema.branchId, branchId),
                    inArray(ordersSchema.status, ['PENDING', 'PREPARING', 'READY'])
                )
            )
            .orderBy(desc(ordersSchema.createdAt));

        return {
            success: true,
            orders: activeOrders.map(o => ({
                ...o,
                totalAmount: parseFloat(o.totalAmount as string)
            }))
        };
    } catch (error) {
        console.error('getActiveOrdersAction error:', error);
        return { success: false, error: 'Failed to fetch active orders' };
    }
}

export async function updateOrderStatusAction(orderId: string, status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED') {
    try {
        await db.update(ordersSchema)
            .set({
                status,
                acceptedAt: status === 'PREPARING' ? new Date() : undefined,
                readyAt: status === 'READY' ? new Date() : undefined,
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

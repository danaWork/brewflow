'use server';

import { db } from '@/lib/db';
import { orders as ordersSchema, tables as tablesSchema, orderItems as orderItemsSchema } from '@/db/schema';
import { eq, inArray, desc, and, gte, lte, or, sql, ilike } from 'drizzle-orm';
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

function getStartOfOperationalDay(): Date {
    const now = new Date();
    // Manila is UTC+8
    const MANILA_OFFSET = 8 * 60 * 60 * 1000;
    const manilaTime = new Date(now.getTime() + MANILA_OFFSET);
    
    let year = manilaTime.getUTCFullYear();
    let month = manilaTime.getUTCMonth();
    let date = manilaTime.getUTCDate();
    let hour = manilaTime.getUTCHours();
    
    // The operational day starts at 6:00 AM Manila time.
    // If it's before 6:00 AM, we are still on the previous day's operational day.
    if (hour < 6) {
        date = date - 1;
    }
    
    // Construct nominal Manila 6:00 AM in UTC
    const startOfOpDayManila = new Date(Date.UTC(year, month, date, 6, 0, 0, 0));
    
    // Convert back to absolute UTC by subtracting the offset
    return new Date(startOfOpDayManila.getTime() - MANILA_OFFSET);
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
        const startOfOperationalDay = getStartOfOperationalDay();

        // Calculate the next order number for this branch for today
        const [latestOrder] = await db.select({ orderNumber: ordersSchema.orderNumber })
            .from(ordersSchema)
            .where(
                and(
                    eq(ordersSchema.branchId, data.branchId),
                    gte(ordersSchema.createdAt, startOfOperationalDay)
                )
            )
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

export async function getPastOrdersAction(
    branchId: string, 
    options?: {
        page?: number;
        limit?: number;
        dateFilter?: string; // YYYY-MM-DD
        searchQuery?: string;
    }
) {
    try {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const offset = (page - 1) * limit;

        const conditions = [
            eq(ordersSchema.branchId, branchId),
            inArray(ordersSchema.status, ['COMPLETED', 'CANCELLED'])
        ];

        if (options?.dateFilter) {
            // Options date filter comes in like "2026-02-27"
            // The user wanted standard calendar days based on Manila time
            // So we construct a boundary from midnight Manila to midnight next day Manila
            const [yearStr, monthStr, dayStr] = options.dateFilter.split('-');
            if (yearStr && monthStr && dayStr) {
                const year = parseInt(yearStr, 10);
                const month = parseInt(monthStr, 10) - 1;
                const day = parseInt(dayStr, 10);

                const MANILA_OFFSET = 8 * 60 * 60 * 1000;
                
                const startOfDayManila = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
                const endOfDayManila = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

                const startOfDayUTC = new Date(startOfDayManila.getTime() - MANILA_OFFSET);
                const endOfDayUTC = new Date(endOfDayManila.getTime() - MANILA_OFFSET);

                conditions.push(gte(ordersSchema.createdAt, startOfDayUTC));
                conditions.push(lte(ordersSchema.createdAt, endOfDayUTC));
            }
        }

        if (options?.searchQuery) {
            const query = `%${options.searchQuery}%`;
            
            // First, find all tables matching the search query
            const matchingTables = await db
                .select({ id: tablesSchema.id })
                .from(tablesSchema)
                .where(sql`${tablesSchema.tableNumber} ILIKE ${query}`);
            
            const tableIds = matchingTables.map(t => t.id);
            
            if (tableIds.length > 0) {
                // @ts-expect-error Drizzle AST strictness
                conditions.push(or(
                    ilike(sql`${ordersSchema.orderNumber}::text`, query),
                    inArray(ordersSchema.tableId, tableIds)
                ));
            } else {
                conditions.push(ilike(sql`${ordersSchema.orderNumber}::text`, query));
            }
        }

        const pastOrders = await db.query.orders.findMany({
            where: and(...conditions),
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
            offset,
        });

        // Get total count
        const [{ count }] = await db.select({ count: sql`count(*)`.mapWith(Number) })
            .from(ordersSchema)
            .where(and(...conditions));

        return {
            success: true,
            totalCount: count,
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

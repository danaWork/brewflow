'use server';

import { db } from '@/lib/db';
import { orders as ordersSchema, tables as tablesSchema } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export interface OrderData {
    id: string;
    orderNumber: number;
    status: string;
    items: any;
    total: number;
    tableId: string | null;
    tableName: string;
    createdAt: Date;
    specialInstructions: string | null;
    paymentMethod: string;
}

export async function createOrderAction(data: {
    tableId: string | null;
    items: any;
    total: number;
    paymentMethod: string;
    specialInstructions?: string;
}) {
    try {
        const [inserted] = await db.insert(ordersSchema).values({
            tableId: data.tableId,
            status: 'payment',
            total: data.total.toString(),
            items: data.items,
            specialInstructions: data.specialInstructions,
            paymentMethod: data.paymentMethod,
        }).returning();

        return { success: true, order: inserted };
    } catch (error) {
        console.error('createOrderAction error:', error);
        return { success: false, error: 'Failed to create order' };
    }
}

export async function getActiveOrdersAction() {
    try {
        const activeOrders = await db
            .select({
                id: ordersSchema.id,
                orderNumber: ordersSchema.orderNumber,
                status: ordersSchema.status,
                items: ordersSchema.items,
                total: ordersSchema.total,
                tableId: ordersSchema.tableId,
                tableName: tablesSchema.name,
                createdAt: ordersSchema.createdAt,
                specialInstructions: ordersSchema.specialInstructions,
                paymentMethod: ordersSchema.paymentMethod,
            })
            .from(ordersSchema)
            .leftJoin(tablesSchema, eq(ordersSchema.tableId, tablesSchema.id))
            .where(inArray(ordersSchema.status, ['payment', 'preparing', 'ready']))
            .orderBy(desc(ordersSchema.createdAt));

        return { success: true, orders: activeOrders };
    } catch (error) {
        console.error('getActiveOrdersAction error:', error);
        return { success: false, error: 'Failed to fetch active orders' };
    }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
    try {
        await db.update(ordersSchema)
            .set({ status })
            .where(eq(ordersSchema.id, orderId));
        return { success: true };
    } catch (error) {
        console.error('updateOrderStatusAction error:', error);
        return { success: false, error: 'Failed to update order status' };
    }
}

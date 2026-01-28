'use server';

import { db } from '@/lib/db';
import { orders, tables } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Order, OrderStatus } from '@/context/OrderContext';

// Helper to confirm order structure matches what we store
// We store items as JSONB, so we cast it when retrieving

export async function createOrder(items: any[], total: number, tableId: string, paymentMethod: string, specialInstructions?: string) {
  try {
    // 1. Verify table exists (optional, but good practice)
    // We assume tableId passed from frontend is the QR code or ID
    const table = await db.query.tables.findFirst({
        where: eq(tables.qrCode, tableId)
    });

    // If table doesn't exist, maybe create a temp one or default?
    // For now we'll just use a fallback or fail.
    // Let's Insert if not exists or just link to the first table if not found (fallback)
    let dbTableId = table?.id;
    if (!dbTableId) {
        // Fallback: try to find ANY table
        const firstTable = await db.query.tables.findFirst();
        if (firstTable) dbTableId = firstTable.id;
        else throw new Error("No tables configured in system");
    }

    // 2. Insert Order
    const [newOrder] = await db.insert(orders).values({
        tableId: dbTableId,
        status: 'payment', // Default start status
        total: total.toString(), // Store as string for decimal type
        items: items, // JSONB
        specialInstructions: specialInstructions,
        paymentMethod: paymentMethod,
    }).returning();

    // 3. Revalidate Owner Dashboard
    revalidatePath('/owner');

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to place order" };
  }
}

export async function getOrder(orderId: string) {
    try {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                table: true
            }
        });

        if (!order) return null;

        // Transform to Order interface
        return {
            id: order.id,
            status: order.status as OrderStatus,
            items: order.items as any[],
            total: parseFloat(order.total),
            table: order.table?.name || 'Unknown Table',
            timestamp: order.createdAt,
            specialInstructions: order.specialInstructions,
            paymentMethod: order.paymentMethod || 'Cash'
        };
    } catch (e) {
        console.error("Error fetching order", e);
        return null;
    }
}

export async function getActiveOrders() {
    try {
        const activeDefaults: OrderStatus[] = ['payment', 'preparing', 'ready'];
        
        const activeOrders = await db.query.orders.findMany({
            where: inArray(orders.status, activeDefaults),
            orderBy: [desc(orders.createdAt)],
            with: {
                table: true
            }
        });

        return activeOrders.map(o => ({
            id: o.id,
            status: o.status as OrderStatus,
            items: o.items as any[],
            total: parseFloat(o.total),
            table: o.table?.name || 'Unknown',
            timestamp: o.createdAt,
            specialInstructions: o.specialInstructions,
            paymentMethod: o.paymentMethod || 'Cash'
        }));
    } catch (e) {
        console.error("Error fetching active orders", e);
        return [];
    }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        await db.update(orders)
            .set({ status: newStatus })
            .where(eq(orders.id, orderId));

        revalidatePath('/owner');
        revalidatePath(`/customer/order`); // In case we had a specific page for order status
        
        return { success: true };
    } catch (e) {
        console.error("Failed to update status", e);
        return { success: false };
    }
}

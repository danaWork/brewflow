'use server';

import { db } from '@/lib/db';
import { notifications, products, branchProductAvailability, productIngredients, inventoryItems, branches } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getUserSession } from './auth';

export async function syncStockNotifications(branchId: string) {
    if (!branchId) return { success: false, error: 'Branch ID required' };
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        return await syncStockNotificationsInternal(branchId);
    } catch (error) {
        console.error('Error syncing stock notifications:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function syncStockNotificationsInternal(branchId: string) {
    // 1. Get all products with their availability and ingredients for this branch
    const [branch] = await db.select({ companyId: branches.companyId }).from(branches).where(eq(branches.id, branchId)).limit(1);
    if (!branch) return { success: false, error: 'Branch not found' };

    const productsData = await db.query.products.findMany({
        with: {
            category: true,
            branchAvailability: {
                where: eq(branchProductAvailability.branchId, branchId)
            },
            productIngredients: {
                with: {
                    inventoryItem: true
                }
            }
        }
    });

    const branchProducts = productsData.filter(p => (p.category as any)?.companyId === branch.companyId);
    const outOfStockProductIds = new Set<string>();

    // 2. Calculate isInStock
    for (const p of branchProducts) {
        const availability = p.branchAvailability[0];
        let isInStock = availability?.isInStock !== false;

        if (isInStock && p.productIngredients.length > 0) {
            const branchIngredients = p.productIngredients.filter(
                pi => pi.inventoryItem && pi.inventoryItem.branchId === branchId
            );

            for (const pi of branchIngredients) {
                const required = parseFloat(pi.quantityRequired);
                const available = parseFloat(pi.inventoryItem.quantity);
                const threshold = pi.inventoryItem.lowStockThreshold ? parseFloat(pi.inventoryItem.lowStockThreshold) : 0;
                
                if (available < required || available <= threshold) {
                    isInStock = false;
                    break;
                }
            }
        }

        if (!isInStock) {
            outOfStockProductIds.add(p.id);
        }
    }

    // 3. Sync with notifications table
    const currentNotifications = await db.select()
        .from(notifications)
        .where(
            and(
                eq(notifications.branchId, branchId),
                eq(notifications.type, 'OUT_OF_STOCK')
            )
        );

    const currentNotifiedProductIds = new Set(currentNotifications.map(n => n.productId));

    // Create new notifications for out of stock products that don't have one
    const toCreate = Array.from(outOfStockProductIds).filter(id => !currentNotifiedProductIds.has(id));
    if (toCreate.length > 0) {
        const productsToName = new Map(branchProducts.map(p => [p.id, p.name]));
        await db.insert(notifications).values(
            toCreate.map(productId => ({
                branchId,
                productId,
                type: 'OUT_OF_STOCK',
                message: `${productsToName.get(productId) || 'A product'} is out of stock.`,
                isRead: false
            }))
        );
    }

    // Delete notifications for products that are back in stock
    const toDeleteIds = currentNotifications
        .filter(n => n.productId && !outOfStockProductIds.has(n.productId))
        .map(n => n.id);

    if (toDeleteIds.length > 0) {
        for (const id of toDeleteIds) {
            await db.delete(notifications).where(eq(notifications.id, id));
        }
    }

    return { success: true };
}

export async function getUnreadNotifications(branchId: string) {
    if (!branchId) return { success: false, notifications: [] };
    try {
        const session = await getUserSession();
        if (!session) return { success: false, notifications: [] };

        const unread = await db.select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.branchId, branchId),
                    eq(notifications.isRead, false)
                )
            );
            
        unread.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return { success: true, notifications: unread };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, notifications: [] };
    }
}

export async function markNotificationRead(id: string) {
    try {
        await db.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, id));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function clearAllNotifications(branchId: string) {
    try {
        await db.update(notifications)
            .set({ isRead: true })
            .where(
                 and(
                     eq(notifications.branchId, branchId),
                     eq(notifications.isRead, false)
                 )
             );
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

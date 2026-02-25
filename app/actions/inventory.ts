'use server';

import { db } from '@/lib/db';
import { branchProductAvailability, products, branches } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { getUserSession } from './auth';

export async function updateProductPrice(
    branchId: string,
    productId: string,
    newPrice: number
) {
    if (!branchId || !productId) return { success: false, error: 'Invalid branch or product ID' };

    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get product details for logging
        const [product] = await db
            .select({ name: products.name, basePrice: products.basePrice })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Check if price override exists
        const existing = await db
            .select()
            .from(branchProductAvailability)
            .where(
                and(
                    eq(branchProductAvailability.branchId, branchId),
                    eq(branchProductAvailability.productId, productId)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Update existing
            await db
                .update(branchProductAvailability)
                .set({ branchPriceOverride: newPrice.toString() })
                .where(
                    and(
                        eq(branchProductAvailability.branchId, branchId),
                        eq(branchProductAvailability.productId, productId)
                    )
                );
        } else {
            // Insert new
            await db.insert(branchProductAvailability).values({
                branchId,
                productId,
                branchPriceOverride: newPrice.toString(),
                isInStock: true,
            });
        }

        // Log activity
        await logActivity(
            branchId,
            session.userId,
            'Price Updated',
            {
                productName: product.name,
                oldPrice: existing[0]?.branchPriceOverride || product.basePrice,
                newPrice: newPrice,
            }
        );

        revalidatePath('/owner/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error updating product price:', error);
        return { success: false, error: 'Failed to update price' };
    }
}

export async function updateProductStock(
    branchId: string,
    productId: string,
    isInStock: boolean
) {
    if (!branchId || !productId) return { success: false, error: 'Invalid branch or product ID' };

    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // Get product details for logging
        const [product] = await db
            .select({ name: products.name })
            .from(products)
            .where(eq(products.id, productId))
            .limit(1);

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        // Check if availability record exists
        const existing = await db
            .select()
            .from(branchProductAvailability)
            .where(
                and(
                    eq(branchProductAvailability.branchId, branchId),
                    eq(branchProductAvailability.productId, productId)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Update existing
            await db
                .update(branchProductAvailability)
                .set({ isInStock })
                .where(
                    and(
                        eq(branchProductAvailability.branchId, branchId),
                        eq(branchProductAvailability.productId, productId)
                    )
                );
        } else {
            // Insert new
            await db.insert(branchProductAvailability).values({
                branchId,
                productId,
                isInStock,
            });
        }

        // Log activity
        await logActivity(
            branchId,
            session.userId,
            isInStock ? 'Product Restocked' : 'Product Out of Stock',
            {
                productName: product.name,
                status: isInStock ? 'In Stock' : 'Out of Stock',
            }
        );

        revalidatePath('/owner/inventory');
        return { success: true };
    } catch (error) {
        console.error('Error updating product stock:', error);
        return { success: false, error: 'Failed to update stock' };
    }
}

// Inventory Item Actions
import { inventoryItems } from '@/db/schema';
import { desc, lte } from 'drizzle-orm';

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;

export async function getInventoryItemsAction(branchId: string) {
    try {
        if (!branchId) return { success: true, items: [] };

        const items = await db.query.inventoryItems.findMany({
            where: eq(inventoryItems.branchId, branchId),
            orderBy: [desc(inventoryItems.updatedAt)]
        });
        return { success: true, items };
    } catch (error) {
        console.error('getInventoryItemsAction error:', error);
        return { success: false, error: 'Failed to fetch inventory items' };
    }
}

export async function addInventoryItemAction(data: NewInventoryItem) {
    try {
        const [newItem] = await db.insert(inventoryItems).values(data).returning();
        return { success: true, item: newItem };
    } catch (error) {
        console.error('addInventoryItemAction error:', error);
        return { success: false, error: 'Failed to add inventory item' };
    }
}

export async function updateInventoryItemAction(id: string, data: Partial<NewInventoryItem>) {
    try {
        const [updatedItem] = await db.update(inventoryItems)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(inventoryItems.id, id))
            .returning();
        return { success: true, item: updatedItem };
    } catch (error) {
        console.error('updateInventoryItemAction error:', error);
        return { success: false, error: 'Failed to update inventory item' };
    }
}

export async function deleteInventoryItemAction(id: string) {
    try {
        await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
        return { success: true };
    } catch (error) {
        console.error('deleteInventoryItemAction error:', error);
        return { success: false, error: 'Failed to delete inventory item' };
    }
}

export async function getLowStockItemsAction(branchId: string) {
    try {
        if (!branchId) return { success: true, items: [] };

        const items = await db.select().from(inventoryItems)
            .where(and(
                eq(inventoryItems.branchId, branchId),
                lte(inventoryItems.quantity, inventoryItems.lowStockThreshold) 
            ));
        
        return { success: true, items };
    } catch (error) {
        console.error('getLowStockItemsAction error:', error);
        return { success: false, error: 'Failed to fetch low stock items' };
    }
}

// Ingredient Linking & Logic

// Ingredient Linking & Logic

import { productIngredients, orderItems, orders } from '@/db/schema';
import { sql, inArray } from 'drizzle-orm';

export async function linkProductToIngredientsAction(branchId: string, productId: string, ingredients: { inventoryItemId: string; quantityRequired: number }[]) {
    try {
        if (!branchId || !productId) return { success: false, error: 'Invalid branch or product ID' };

        await db.transaction(async (tx) => {
            // Find existing ingredients linked to this product AND this branch's inventory
            // We can't join in a delete statement easily in all dialects, so we select first.
            const existingBranchIngredients = await tx.select({ id: productIngredients.id })
                .from(productIngredients)
                .innerJoin(inventoryItems, eq(productIngredients.inventoryItemId, inventoryItems.id))
                .where(and(
                    eq(productIngredients.productId, productId),
                    eq(inventoryItems.branchId, branchId)
                ));
            
            const idsToDelete = existingBranchIngredients.map(i => i.id);

            if (idsToDelete.length > 0) {
                await tx.delete(productIngredients).where(inArray(productIngredients.id, idsToDelete));
            }
            
            // Insert new
            if (ingredients.length > 0) {
                await tx.insert(productIngredients).values(
                    ingredients.map(ing => ({
                        productId,
                        inventoryItemId: ing.inventoryItemId, // We assume the passed item IDs belong to this branch (caller responsibility/verified by UI context)
                        quantityRequired: ing.quantityRequired.toString()
                    }))
                );
            }
        });
        return { success: true };
    } catch (error) {
        console.error('linkProductToIngredientsAction error:', error);
        return { success: false, error: 'Failed to update product ingredients' };
    }
}

export async function getProductIngredientsAction(branchId: string, productId: string) {
    try {
        if (!branchId || !productId) return { success: true, ingredients: [] };

        const ingredients = await db.select({
            inventoryItemId: productIngredients.inventoryItemId,
            quantityRequired: productIngredients.quantityRequired,
            inventoryItem: inventoryItems
        })
        .from(productIngredients)
        .innerJoin(inventoryItems, eq(productIngredients.inventoryItemId, inventoryItems.id))
        .where(and(
            eq(productIngredients.productId, productId),
            eq(inventoryItems.branchId, branchId)
        ));

        // Format to match expected shape
        const formatted = ingredients.map(i => ({
            inventoryItemId: i.inventoryItemId,
            quantityRequired: parseFloat(i.quantityRequired),
            inventoryItem: i.inventoryItem
        }));

        return { success: true, ingredients: formatted };
    } catch (error) {
        console.error('getProductIngredientsAction error:', error);
        return { success: false, error: 'Failed to fetch product ingredients' };
    }
}

export async function deductInventoryForOrder(orderId: string) {
    try {
        // Fetch order to get branchId
        const [order] = await db.select({ branchId: orders.branchId }).from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order) return { success: false, error: 'Order not found' };

        // Fetch order items with ingredients filtered by branch
        // Drizzle deep query filtering on nested relation is tricky for "filter relation by x", 
        // easier to fetch all ingredients and filter in code, or use raw sql/manual joins.
        // Let's use the query builder but filter in memory as dataset is small per order.
        
        const items = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, orderId),
            with: {
                product: {
                    with: {
                        productIngredients: {
                            with: {
                                inventoryItem: true
                            }
                        }
                    }
                }
            }
        });

        await db.transaction(async (tx) => {
            for (const item of items) {
                const product = Array.isArray(item.product) ? item.product[0] : item.product;
                const productIngredients = product && typeof product === 'object' && 'productIngredients' in product
                    ? (product.productIngredients as Array<{ inventoryItem: { branchId: string }; quantityRequired: string; inventoryItemId: string }>)
                    : [];
                const ingredients = productIngredients.filter(
                    pi => pi.inventoryItem.branchId === order.branchId
                );

                for (const ing of ingredients) {
                    const deduction = parseFloat(ing.quantityRequired) * item.quantity;
                    
                    await tx.update(inventoryItems)
                        .set({ 
                            quantity: sql`${inventoryItems.quantity} - ${deduction}`,
                            updatedAt: new Date()
                        })
                        .where(eq(inventoryItems.id, ing.inventoryItemId));
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error('deductInventoryForOrder error:', error);
        return { success: false, error: 'Failed to deduct inventory' };
    }
}



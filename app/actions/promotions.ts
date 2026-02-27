'use server';

import { db } from '@/lib/db';
import { promotions, promotionItems, products, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logActivity } from '@/lib/activity';
import { getUserSession } from './auth';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { NeonQueryResultHKT } from 'drizzle-orm/neon-serverless';

type Schema = typeof import('@/db/schema');
type Transaction = PgTransaction<NeonQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;

export async function getProductsAction(branchId: string) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        const productsData = await db.query.products.findMany({
            with: {
                category: true,
                branchAvailability: {
                    where: (fields, { eq }) => eq(fields.branchId, branchId)
                },
                productIngredients: {
                    with: {
                        inventoryItem: true
                    }
                }
            },
            where: (fields, { exists }) => exists(
                db.select().from(categories)
                    .where(and(eq(categories.id, fields.categoryId), eq(categories.companyId, session.companyId)))
            )
        });

        const allProducts = productsData.map(p => {
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

            return {
                id: p.id,
                name: p.name,
                basePrice: p.basePrice,
                imageUrl: p.imageUrl,
                categoryName: p.category.name,
                categoryType: p.category.type,
                isInStock: isInStock,
            };
        });

        return { success: true, data: allProducts };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: 'Failed to fetch products' };
    }
}

export async function getPromotionsAction(branchId: string) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        const promotionsData = await db.query.promotions.findMany({
            where: eq(promotions.branchId, branchId),
            with: {
                items: {
                    with: {
                        product: {
                            with: {
                                branchAvailability: {
                                    where: (fields, { eq }) => eq(fields.branchId, branchId)
                                },
                                productIngredients: {
                                    with: {
                                        inventoryItem: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const allPromotions = promotionsData.map(promo => ({
            ...promo,
            items: promo.items.map(item => {
                const p = item.product;
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

                return {
                    ...item,
                    product: {
                        ...p,
                        isInStock
                    }
                };
            })
        }));

        return { success: true, data: allPromotions };
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return { success: false, error: 'Failed to fetch promotions' };
    }
}

export async function savePromotionAction(
    branchId: string,
    promotionData: {
        id?: string;
        name: string;
        type: 'PERFECT_PAIR' | 'CROSS_SELL';
        triggerType: 'PRODUCT' | 'CATEGORY_TYPE';
        triggerValue: string;
        discountType: 'PERCENTAGE' | 'FIXED';
        discountValue: number;
        productIds: string[];
    }
) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        const { id, productIds, ...data } = promotionData;

        let promotionId = id;

        await db.transaction(async (tx: Transaction) => {
            if (id) {
                // Update
                await tx.update(promotions)
                    .set({
                        ...data,
                        discountValue: data.discountValue.toString() as any,
                    })
                    .where(eq(promotions.id, id));

                // Delete old items
                await tx.delete(promotionItems).where(eq(promotionItems.promotionId, id));
            } else {
                // Create
                const [newPromo] = await tx.insert(promotions)
                    .values({
                        branchId,
                        ...data,
                        discountValue: data.discountValue.toString() as any,
                    })
                    .returning();
                promotionId = newPromo.id;
            }

            // Insert items
            if (productIds.length > 0) {
                await tx.insert(promotionItems).values(
                    productIds.map(productId => ({
                        promotionId: promotionId!,
                        productId,
                    }))
                );
            }
        });

        await logActivity(
            branchId,
            session.userId,
            id ? 'Promotion Updated' : 'Promotion Created',
            { promotionName: data.name, type: data.type }
        );

        return { success: true };
    } catch (error) {
        console.error('Error saving promotion:', error);
        return { success: false, error: 'Failed to save promotion' };
    }
}

export async function deletePromotionAction(branchId: string, promotionId: string) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        await db.transaction(async (tx: Transaction) => {
            await tx.delete(promotionItems).where(eq(promotionItems.promotionId, promotionId));
            await tx.delete(promotions).where(eq(promotions.id, promotionId));
        });

        await logActivity(
            branchId,
            session.userId,
            'Promotion Deleted',
            { promotionId }
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return { success: false, error: 'Failed to delete promotion' };
    }
}

export async function getPromotionsStockStatusAction(branchId: string) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };

        // 1. Get all promotions for the branch
        const promotionsData = await db.query.promotions.findMany({
            where: eq(promotions.branchId, branchId),
            with: {
                items: {
                    with: {
                        product: {
                            with: {
                                branchAvailability: {
                                    where: (fields, { eq }) => eq(fields.branchId, branchId)
                                },
                                productIngredients: {
                                    with: {
                                        inventoryItem: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // 2. Fetch all unique products that might be triggers (for PERFECT_PAIR)
        const triggerProductIds = promotionsData
            .filter(p => p.type === 'PERFECT_PAIR')
            .map(p => p.triggerValue);
        
        const triggerProducts = triggerProductIds.length > 0 ? await db.query.products.findMany({
            where: (fields, { inArray }) => inArray(fields.id, triggerProductIds),
            with: {
                branchAvailability: {
                    where: (fields, { eq }) => eq(fields.branchId, branchId)
                },
                productIngredients: {
                    with: {
                        inventoryItem: true
                    }
                }
            }
        }) : [];

        const triggerProductsMap = new Map(triggerProducts.map(p => {
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
            return [p.id, isInStock];
        }));

        // 3. Check if any promotion has an out of stock item
        const hasOutOfStock = promotionsData.some(promo => {
            // Check trigger for PERFECT_PAIR
            if (promo.type === 'PERFECT_PAIR') {
                const triggerInStock = triggerProductsMap.get(promo.triggerValue);
                if (triggerInStock === false) return true;
            }

            // Check all items in the promotion
            return promo.items.some(item => {
                const p = item.product;
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
                return !isInStock;
            });
        });

        return { success: true, hasOutOfStock };
    } catch (error) {
        console.error('Error checking promotion stock status:', error);
        return { success: false, error: 'Failed' };
    }
}

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

        const allProducts = await db.select({
            id: products.id,
            name: products.name,
            basePrice: products.basePrice,
            imageUrl: products.imageUrl,
            categoryName: categories.name,
            categoryType: categories.type,
        })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(eq(categories.companyId, session.companyId));

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

        const allPromotions = await db.query.promotions.findMany({
            where: eq(promotions.branchId, branchId),
            with: {
                items: {
                    with: {
                        product: true
                    }
                }
            }
        });

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

'use server';

import { db } from '@/lib/db';
import {
    categories as categoriesSchema,
    products as productsSchema,
    tables as tablesSchema,
    branches as branchesSchema,
    promotions as promotionsSchema,
    promotionItems as promotionItemsSchema
} from '@/db/schema';
import { eq, asc, desc, and, or, isNull } from 'drizzle-orm';
import { branchProductAvailability } from '@/db/schema';

export async function getMenuData(qrIdentifier: string) {
    if (process.env.DATABASE_URL?.includes('placeholder') || !process.env.DATABASE_URL) {
        return { success: false, error: "Database not configured" };
    }
    try {
        // Fetch Table by QR identifier or ID (only if valid UUID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrIdentifier);

        const conditions = [eq(tablesSchema.qrIdentifier, qrIdentifier)];
        if (isUuid) {
            conditions.push(eq(tablesSchema.id, qrIdentifier));
        }

        const [tableData] = await db
            .select({
                id: tablesSchema.id,
                tableNumber: tablesSchema.tableNumber,
                branchId: tablesSchema.branchId
            })
            .from(tablesSchema)
            .where(or(...conditions))
            .limit(1);

        if (!tableData) {
            return { success: false, error: "Table not found" };
        }

        const tableName = tableData.tableNumber;
        // Fetch Branch to get Company ID
        const [branchData] = await db
            .select({ companyId: branchesSchema.companyId })
            .from(branchesSchema)
            .where(eq(branchesSchema.id, tableData.branchId))
            .limit(1);

        if (!branchData) {
            return { success: false, error: "Branch not found" };
        }

        // Fetch categories with products and modifiers using relational queries
        const categoriesData = await db.query.categories.findMany({
            where: eq(categoriesSchema.companyId, branchData.companyId),
            with: {
                products: {
                    where: eq(productsSchema.isHidden, false),
                    with: {
                        modifierLinks: {
                            with: {
                                modifierGroup: {
                                    with: {
                                        options: true
                                    }
                                }
                            }
                        },
                        branchAvailability: {
                            where: eq(branchProductAvailability.branchId, tableData.branchId)
                        }
                    }
                }
            }
        });

        // Transform data
        const transformedCategories = categoriesData.map(c => ({
            id: c.id,
            name: c.name,
            type: (c.type || 'drink').toLowerCase(),
            companyId: c.companyId
        }));

        const transformedProducts: any[] = [];
        categoriesData.forEach(c => {
            c.products.forEach(p => {
                const availability = p.branchAvailability[0];
                if (availability?.isInStock === false) return;

                transformedProducts.push({
                    id: p.id,
                    name: p.name,
                    price: parseFloat((availability?.branchPriceOverride || p.basePrice).toString()),
                    image: p.imageUrl,
                    categoryId: p.categoryId,
                    categoryIdReal: c.id, 
                    description: '', // Added to match other side's shape if needed
                    isSignature: false,
                    isInStock: true,
                    categoryType: (c.type || 'drink').toLowerCase(), // Added to support promotions logic
                    modifiers: p.modifierLinks.map(ml => ({
                        id: ml.modifierGroup.id,
                        name: ml.modifierGroup.name,
                        options: ml.modifierGroup.options.map(o => ({
                            id: o.id,
                            name: o.name,
                            price: 0 // TODO: Add price to options later
                        }))
                    }))
                });
            });
        });

        // Fetch promotions and their items
        const promotionsData = await db
            .select({
                id: promotionsSchema.id,
                name: promotionsSchema.name,
                type: promotionsSchema.type,
                discountType: promotionsSchema.discountType,
                discountValue: promotionsSchema.discountValue,
                triggerType: promotionsSchema.triggerType,
                triggerValue: promotionsSchema.triggerValue,
            })
            .from(promotionsSchema)
            .where(eq(promotionsSchema.branchId, tableData.branchId));

        const promotionIds = promotionsData.map(p => p.id);
        const linkedItems = promotionIds.length > 0
            ? await db
                .select({
                    promotionId: promotionItemsSchema.promotionId,
                    productId: promotionItemsSchema.productId,
                })
                .from(promotionItemsSchema)
                .where(or(...promotionIds.map(id => eq(promotionItemsSchema.promotionId, id))))
            : [];

        const transformedPromotions = promotionsData.map(p => ({
            ...p,
            items: linkedItems.filter(li => li.promotionId === p.id)
        }));

        return {
            success: true,
            tableId: tableData.id,
            tableName,
            branchId: tableData.branchId,
            categories: transformedCategories,
            products: transformedProducts.map(p => ({...p, categoryId: p.categoryIdReal || p.categoryId})),
            promotions: transformedPromotions,
        };
    } catch (error) {
        console.error("Failed to fetch menu data:", error);
        return {
            success: false,
            error: "Failed to fetch menu data",
        };
    }
}

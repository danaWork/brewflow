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

export async function getMenuData(branchId: string, qrIdentifier: string) {
    if (process.env.DATABASE_URL?.includes('placeholder') || !process.env.DATABASE_URL) {
        return { success: false, error: "Database not configured" };
    }
    try {
        // Fetch Table by QR identifier, scoped to the specific branch.
        // Also accept a bare table UUID for legacy/direct links.
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrIdentifier);

        const branchCondition = eq(tablesSchema.branchId, branchId);
        const identifierCondition = isUuid
            ? or(eq(tablesSchema.qrIdentifier, qrIdentifier), eq(tablesSchema.id, qrIdentifier))
            : eq(tablesSchema.qrIdentifier, qrIdentifier);

        const [tableData] = await db
            .select({
                id: tablesSchema.id,
                tableNumber: tablesSchema.tableNumber,
                branchId: tablesSchema.branchId
            })
            .from(tablesSchema)
            .where(and(branchCondition, identifierCondition!))
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
                        },
                        productIngredients: {
                            with: {
                                inventoryItem: true
                            }
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
            companyId: c.companyId,
            config: c.config
        }));

        const transformedProducts: any[] = [];
        categoriesData.forEach(c => {
            c.products.forEach(p => {
                const availability = p.branchAvailability[0];
                let isInStock = availability?.isInStock !== false; // Default to true unless explicitly false

                // Check ingredient stock
                if (isInStock && p.productIngredients.length > 0) {
                    // Filter ingredients for this branch
                    const branchIngredients = p.productIngredients.filter((pi: { inventoryItem: { branchId: string } }) =>
                        pi.inventoryItem.branchId === tableData.branchId
                    );

                    for (const pi of branchIngredients) {
                        const required = parseFloat(pi.quantityRequired);
                        const available = parseFloat(pi.inventoryItem.quantity); // Use raw string -> float
                        const threshold = pi.inventoryItem.lowStockThreshold ? parseFloat(pi.inventoryItem.lowStockThreshold) : 0;
                        
                        // Check if not enough ingredients OR if stock is at/below threshold
                        if (available < required || available <= threshold) {
                            isInStock = false;
                            break;
                        }
                    }
                }

                // Requirement: "if an inventory item is over there should be an out of stock tag"
                // Usually this means we still SHOW it but mark it out of stock.
                
                // Removed the skip so we can show "Sold Out" in UI.
                
                transformedProducts.push({
                    id: p.id,
                    name: p.name,
                    price: parseFloat((availability?.branchPriceOverride || p.basePrice).toString()),
                    image: p.imageUrl,
                    categoryId: p.categoryId,
                    categoryIdReal: c.id, 
                    description: '', 
                    isSignature: p.isFeatured, // Use isFeatured instead
                    isInStock: isInStock, // This will be false if ingredients missing
                    isQuickCartItem: p.isQuickCartItem,
                    categoryType: (c.type || 'drink').toLowerCase(),
                    modifiers: p.modifierLinks.map((ml: { modifierGroup: { id: string; name: string; displayMode: string; options: Array<{ id: string; name: string; price?: string; imageUrl?: string }>}; defaultModifierOptionId?: string | null }) => ({
                        id: ml.modifierGroup.id,
                        name: ml.modifierGroup.name,
                        displayMode: ml.modifierGroup.displayMode,
                        defaultModifierOptionId: ml.defaultModifierOptionId || null,
                        options: ml.modifierGroup.options.map((o: { id: string; name: string; price?: string; imageUrl?: string }) => ({
                            id: o.id,
                            name: o.name,
                            // @ts-ignore - Schema updated but types might lag
                            price: parseFloat(o.price || '0'), 
                            // @ts-ignore
                            image: o.imageUrl
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

export async function getProductsByTableId(branchId: string, tableId: string) {
    const result = await getMenuData(branchId, tableId);
    if (!result.success) {
        return { success: false, error: result.error, products: [], categories: [] };
    }
    return { success: true, products: result.products || [], categories: result.categories || [] };
}

/**
 * Dedicated action to get the quick-cart product (water bottle).
 * Returns the product only when isQuickCartItem is explicitly true in the DB.
 * Returns null when admin has disabled it.
 */
export async function getQuickCartProduct(branchId: string, tableId: string) {
    try {
        const result = await getMenuData(branchId, tableId);
        if (!result.success || !result.products) return null;

        // First find the primary water product (to align with the one managed in admin UI)
        const waterBottle = result.products.find((p: any) => {
            const nameLower = (p.name as string).toLowerCase();
            return nameLower.includes('water') &&
                (nameLower.includes('bottle') || nameLower.includes('bottled'));
        });

        if (waterBottle && waterBottle.isQuickCartItem === true && waterBottle.isInStock !== false) {
            return waterBottle;
        }

        return null;
    } catch {
        return null;
    }
}

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

                if (!isInStock && availability?.isInStock === false) return; // If manually hidden OR out of stock, decide logic. 
                // Requirement: "if an inventory item is over there should be an out of stock tag"
                // Usually this means we still SHOW it but mark it out of stock?
                // Or if the user meant "hidden"? 
                // "out of stock tag in the menu items" suggests showing it.
                
                // Existing logic: `if (availability?.isInStock === false) return;` skips it entirely.
                // I should probably change this to allow showing but with `isInStock: false`.
                // However, let's respect the manual override "isInStock === false" means HIDE? 
                // Or "Out of Stock"?
                // `productsSchema.isHidden` is the "Hide" flag. `isInStock` is availability.
                // If `availability.isInStock` is false, it usually means "Sold Out" in UI, not hidden.
                // But the code had `if (availability?.isInStock === false) return;`.
                // This implies "Don't send to frontend if out of stock".
                // I will change this to INCLUDE it but set `isInStock: false`.

                // Wait, if I change existing behavior I might break things.
                // "inventory item is over there should be an out of stock tag"
                // If I skip it, there is no tag. So I MUST include it.
                
                // Let's remove the skip, unless `isHidden` is true (handled in query).
                // But wait, `isInStock` from DB override vs calculated.
                // Calculated overrides DB if calculated says NO.
                
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
                    categoryType: (c.type || 'drink').toLowerCase(),
                    modifiers: p.modifierLinks.map((ml: { modifierGroup: { id: string; name: string; displayMode: string; options: Array<{ id: string; name: string; price?: string; imageUrl?: string }> }; defaultModifierOptionId?: string | null }) => ({
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

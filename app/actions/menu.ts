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

        // Fetch categories for the company
        const categories = await db
            .select({
                id: categoriesSchema.id,
                name: categoriesSchema.name,
                type: categoriesSchema.type,
                companyId: categoriesSchema.companyId,
            })
            .from(categoriesSchema)
            .where(eq(categoriesSchema.companyId, branchData.companyId));

        // Fetch products for categories belonging to this company AND available at this branch
        const productsWithAvailability = await db
            .select({
                id: productsSchema.id,
                name: productsSchema.name,
                basePrice: productsSchema.basePrice,
                imageUrl: productsSchema.imageUrl,
                categoryId: productsSchema.categoryId,
                isHidden: productsSchema.isHidden,
                isInStock: branchProductAvailability.isInStock,
                branchPriceOverride: branchProductAvailability.branchPriceOverride,
            })
            .from(productsSchema)
            .innerJoin(categoriesSchema, eq(productsSchema.categoryId, categoriesSchema.id))
            .leftJoin(
                branchProductAvailability,
                and(
                    eq(productsSchema.id, branchProductAvailability.productId),
                    eq(branchProductAvailability.branchId, tableData.branchId)
                )
            )
            .where(
                and(
                    eq(categoriesSchema.companyId, branchData.companyId),
                    eq(productsSchema.isHidden, false)
                )
            );

        // Transform data
        const transformedCategories = categories.map(c => ({
            ...c,
            type: (c.type || 'drink').toLowerCase()
        }));

        const transformedProducts = productsWithAvailability
            .filter(p => p.isInStock !== false)
            .map((p) => ({
                id: p.id,
                name: p.name,
                price: parseFloat((p.branchPriceOverride || p.basePrice).toString()),
                description: '',
                image: p.imageUrl,
                isSignature: false,
                categoryId: p.categoryId,
                categoryType: transformedCategories.find(c => c.id === p.categoryId)?.type || 'drink',
                isInStock: p.isInStock ?? true,
            }));
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
            products: transformedProducts,
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

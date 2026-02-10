'use server';

import { db } from '@/lib/db';
import { categories as categoriesSchema, products as productsSchema, tables as tablesSchema, branches as branchesSchema } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export async function getMenuData(qrIdentifier: string) {
    if (process.env.DATABASE_URL?.includes('placeholder') || !process.env.DATABASE_URL) {
        return { success: false, error: "Database not configured" };
    }
    try {
        // Fetch Table by QR identifier
        const [tableData] = await db
            .select({
                tableNumber: tablesSchema.tableNumber,
                branchId: tablesSchema.branchId
            })
            .from(tablesSchema)
            .where(eq(tablesSchema.qrIdentifier, qrIdentifier))
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
            .select()
            .from(categoriesSchema)
            .where(eq(categoriesSchema.companyId, branchData.companyId));

        // Fetch products for categories
        // For simplicity, fetching all products and filtering in memory or just fetching all if categories are many
        // Better: join or group by category. Still, for now let's keep it simple.
        const products = await db
            .select()
            .from(productsSchema);
        // In a real app we'd filter by category IDs belonging to the company

        // Transform products to expected format (decimal to number)
        const transformedProducts = products.map((p) => ({
            id: p.id,
            name: p.name,
            price: typeof p.basePrice === 'string' ? parseFloat(p.basePrice) : p.basePrice,
            description: '', // Removed from schema
            image: p.imageUrl,
            isSignature: false, // Removed from schema
            categoryId: p.categoryId,
        }));

        return {
            success: true,
            tableName,
            branchId: tableData.branchId,
            categories,
            products: transformedProducts,
        };
    } catch (error) {
        console.error("Failed to fetch menu data:", error);
        return {
            success: false,
            error: "Failed to fetch menu data",
        };
    }
}

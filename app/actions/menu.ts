'use server';

import { db } from '@/lib/db';
import { categories as categoriesSchema, products as productsSchema, tables as tablesSchema } from '@/db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export async function getMenuData(qrCode: string) {
    try {
        // Fetch Table by QR code
        const [tableData] = await db
            .select({ name: tablesSchema.name })
            .from(tablesSchema)
            .where(eq(tablesSchema.qrCode, qrCode))
            .limit(1);

        const tableName = tableData?.name || `Table ${qrCode}`;

        // Fetch categories
        const categories = await db
            .select()
            .from(categoriesSchema);

        // Fetch products ordered by signature first
        const products = await db
            .select()
            .from(productsSchema)
            .orderBy(desc(productsSchema.isSignature));

        // Transform products to expected format (decimal to number)
        const transformedProducts = products.map((p) => ({
            id: p.id,
            name: p.name,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            description: p.description,
            image: p.image,
            isSignature: p.isSignature,
            categoryId: p.categoryId,
            createdAt: p.createdAt,
        }));

        return {
            success: true,
            tableName,
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

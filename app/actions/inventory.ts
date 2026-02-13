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

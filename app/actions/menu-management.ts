'use server';

import { db } from '@/lib/db';
import { categories, products, modifierGroups, modifierOptions, productModifierLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserSession } from './auth';
import { revalidatePath } from 'next/cache';

export async function getMenuCategories() {
    const session = await getUserSession();
    if (!session?.companyId) return [];

    const result = await db.query.categories.findMany({
        where: eq(categories.companyId, session.companyId),
        with: {
            products: {
                with: {
                    modifierLinks: true,
                    productIngredients: true
                }
            },
        },
    });

    return result;
}

export async function createCategory(name: string, type: string = 'drink', config?: string) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.insert(categories).values({
        companyId: session.companyId,
        name,
        type,
        config,
    });

    revalidatePath('/owner/menu-categories');
}

export async function updateCategory(id: string, name: string, type: string, config?: string) {
    if (!id) throw new Error('Category ID is required');
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.update(categories)
        .set({ name, type, config })
        .where(and(eq(categories.id, id), eq(categories.companyId, session.companyId)));

    revalidatePath('/owner/menu-categories');
}

export async function deleteCategory(id: string) {
    if (!id) throw new Error('Category ID is required');
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.delete(categories)
        .where(and(eq(categories.id, id), eq(categories.companyId, session.companyId)));

    revalidatePath('/owner/menu-categories');
}

export async function createProduct(data: {
    categoryId: string;
    name: string;
    basePrice: string;
    imageUrl?: string;
    modifierGroupIds?: string[];
    isHidden?: boolean;
}) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    const [product] = await db.insert(products).values({
        categoryId: data.categoryId,
        name: data.name,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl,
        isHidden: data.isHidden || false,
    }).returning();

    if (data.modifierGroupIds && data.modifierGroupIds.length > 0) {
        await db.insert(productModifierLinks).values(
            data.modifierGroupIds.map(groupId => ({
                productId: product.id,
                modifierGroupId: groupId,
            }))
        );
    }

    revalidatePath('/owner/menu-categories');
    return product;
}

export async function updateProduct(id: string, data: {
    categoryId: string;
    name: string;
    basePrice: string;
    imageUrl?: string;
    modifierGroupIds?: string[];
    isHidden?: boolean;
}) {
    if (!id) throw new Error('Product ID is required');
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.update(products)
        .set({
            categoryId: data.categoryId,
            name: data.name,
            basePrice: data.basePrice,
            imageUrl: data.imageUrl,
            isHidden: data.isHidden ?? false,
        })
        .where(eq(products.id, id));

    if (data.modifierGroupIds) {
        // Simple approach: delete existing links and create new ones
        await db.delete(productModifierLinks).where(eq(productModifierLinks.productId, id));
        
        if (data.modifierGroupIds.length > 0) {
            await db.insert(productModifierLinks).values(
                data.modifierGroupIds.map(groupId => ({
                    productId: id,
                    modifierGroupId: groupId,
                }))
            );
        }
    }

    revalidatePath('/owner/menu-categories');
}

export async function deleteProduct(id: string) {
    if (!id) throw new Error('Product ID is required');
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.delete(productModifierLinks).where(eq(productModifierLinks.productId, id));
    await db.delete(products).where(eq(products.id, id));

    revalidatePath('/owner/menu-categories');
}

export async function getModifierGroups() {
    const session = await getUserSession();
    if (!session?.companyId) return [];

    return await db.query.modifierGroups.findMany({
        where: eq(modifierGroups.companyId, session.companyId),
        with: {
            options: true,
        }
    });
}

export async function getProductModifiers(productId: string) {
    const session = await getUserSession();
    if (!session?.companyId) return [];

    const links = await db.select({
        modifierGroupId: productModifierLinks.modifierGroupId
    })
    .from(productModifierLinks)
    .where(eq(productModifierLinks.productId, productId));

    return links.map(l => l.modifierGroupId);
}

export async function createModifierGroup(name: string, options: string[]) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    const [group] = await db.insert(modifierGroups).values({
        companyId: session.companyId,
        name,
    }).returning();

    if (options.length > 0) {
        await db.insert(modifierOptions).values(
            options.map(opt => ({
                modifierGroupId: group.id,
                name: opt,
            }))
        );
    }

    revalidatePath('/owner/menu-categories');
}

export async function deleteModifierGroup(id: string) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    await db.delete(modifierOptions).where(eq(modifierOptions.modifierGroupId, id));
    await db.delete(productModifierLinks).where(eq(productModifierLinks.modifierGroupId, id));
    await db.delete(modifierGroups).where(and(eq(modifierGroups.id, id), eq(modifierGroups.companyId, session.companyId)));

    revalidatePath('/owner/menu-categories');
}

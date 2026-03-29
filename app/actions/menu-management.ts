'use server';

import { db } from '@/lib/db';
import { categories, products, modifierGroups, modifierOptions, productModifierLinks, productIngredients, productModifierOptionIngredients, branchProductAvailability, promotionItems, notifications, orderItems } from '@/db/schema';
import type { SaleDiscountType } from '@/lib/product-sale-price';
import { eq, and, inArray, sql, asc, max } from 'drizzle-orm';
import { getUserSession } from './auth';
import { revalidatePath } from 'next/cache';

export async function getMenuCategories() {
    const session = await getUserSession();
    if (!session?.companyId) return [];

    const result = await db.query.categories.findMany({
        where: eq(categories.companyId, session.companyId),
        orderBy: [asc(categories.sortOrder)],
        with: {
            products: {
                orderBy: [asc(products.sortOrder)],
                with: {
                    modifierLinks: true,
                    productIngredients: true
                }
            },
        },
    });

    return result;
}

/** POS: categories with products including full modifier groups and options for add-item modal */
export async function getMenuCategoriesForPOS(branchId: string) {
    const session = await getUserSession();
    if (!session?.companyId) return [];

    const result = await db.query.categories.findMany({
        where: eq(categories.companyId, session.companyId),
        orderBy: [asc(categories.sortOrder)],
        with: {
            products: {
                orderBy: [asc(products.sortOrder)],
                with: {
                    branchAvailability: {
                        where: eq(branchProductAvailability.branchId, branchId),
                    },
                    modifierLinks: {
                        with: {
                            modifierGroup: {
                                with: { options: true }
                            }
                        }
                    },
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

    const [maxRow] = await db
        .select({ m: max(categories.sortOrder) })
        .from(categories)
        .where(eq(categories.companyId, session.companyId));
    const nextSort = (maxRow?.m ?? -1) + 1;

    await db.insert(categories).values({
        companyId: session.companyId,
        name,
        type,
        config,
        sortOrder: nextSort,
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
    if (!id) return { success: false, error: 'Category ID is required' };
    try {
        const session = await getUserSession();
        if (!session?.companyId) return { success: false, error: 'Unauthorized' };

        // Check if there are products in this category
        const [existingProduct] = await db.select({ id: products.id })
            .from(products)
            .where(eq(products.categoryId, id))
            .limit(1);

        if (existingProduct) {
            return { 
                success: false, 
                error: 'Cannot delete category because it contains products. Please delete or move the products first.' 
            };
        }

        await db.delete(categories)
            .where(and(eq(categories.id, id), eq(categories.companyId, session.companyId)));

        revalidatePath('/owner/menu-categories');
        return { success: true };
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

export async function updateCategoryOrder(orderedIds: string[]) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');
    if (!orderedIds.length) return;

    await db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
            await tx
                .update(categories)
                .set({ sortOrder: i })
                .where(
                    and(
                        eq(categories.id, orderedIds[i]!),
                        eq(categories.companyId, session.companyId!),
                    ),
                );
        }
    });

    revalidatePath('/owner/menu-categories');
}

export async function updateProductOrder(orderedIds: string[]) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');
    if (!orderedIds.length) return;

    const rows = await db
        .select({ id: products.id, categoryId: products.categoryId })
        .from(products)
        .where(inArray(products.id, orderedIds));

    if (rows.length !== orderedIds.length) {
        throw new Error('Invalid product list');
    }
    const categoryIds = new Set(rows.map((r) => r.categoryId));
    if (categoryIds.size !== 1) {
        throw new Error('Products must belong to a single category');
    }
    const categoryId = [...categoryIds][0]!;

    const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.companyId, session.companyId)));

    if (!cat) {
        throw new Error('Unauthorized');
    }

    await db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i++) {
            await tx
                .update(products)
                .set({ sortOrder: i })
                .where(and(eq(products.id, orderedIds[i]!), eq(products.categoryId, categoryId)));
        }
    });

    revalidatePath('/owner/menu-categories');
}

export async function createProduct(data: {
    categoryId: string;
    name: string;
    basePrice: string;
    imageUrl?: string;
    modifierGroupIds?: string[];
    modifierGroups?: { modifierGroupId: string; defaultModifierOptionId?: string }[];
    isHidden?: boolean;
    isFeatured?: boolean;
    isQuickCartItem?: boolean;
    saleDiscountType?: SaleDiscountType | null;
    saleDiscountValue?: string | null;
    saleLabel?: string | null;
}) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    const [maxProd] = await db
        .select({ m: max(products.sortOrder) })
        .from(products)
        .where(eq(products.categoryId, data.categoryId));
    const nextProductSort = (maxProd?.m ?? -1) + 1;

    const saleType =
        data.saleDiscountType && data.saleDiscountValue != null && String(data.saleDiscountValue).trim() !== ''
            ? data.saleDiscountType
            : null;
    const saleVal =
        saleType && data.saleDiscountValue != null && String(data.saleDiscountValue).trim() !== ''
            ? String(data.saleDiscountValue)
            : null;

    const [product] = await db.insert(products).values({
        categoryId: data.categoryId,
        name: data.name,
        basePrice: data.basePrice,
        imageUrl: data.imageUrl,
        isHidden: data.isHidden || false,
        isFeatured: data.isFeatured || false,
        isQuickCartItem: data.isQuickCartItem || false,
        sortOrder: nextProductSort,
        saleDiscountType: saleType,
        saleDiscountValue: saleVal,
        saleLabel: data.saleLabel?.trim() || null,
    }).returning();

    // Support both old format (modifierGroupIds) and new format (modifierGroups with defaults)
    if (data.modifierGroups && data.modifierGroups.length > 0) {
        await db.insert(productModifierLinks).values(
            data.modifierGroups.map(mg => ({
                productId: product.id,
                modifierGroupId: mg.modifierGroupId,
                defaultModifierOptionId: mg.defaultModifierOptionId || null,
            }))
        );
    } else if (data.modifierGroupIds && data.modifierGroupIds.length > 0) {
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
    modifierGroups?: { modifierGroupId: string; defaultModifierOptionId?: string }[];
    isHidden?: boolean;
    isFeatured?: boolean;
    isQuickCartItem?: boolean;
    saleDiscountType?: SaleDiscountType | null;
    saleDiscountValue?: string | null;
    saleLabel?: string | null;
}) {
    if (!id) throw new Error('Product ID is required');
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    const saleType =
        data.saleDiscountType && data.saleDiscountValue != null && String(data.saleDiscountValue).trim() !== ''
            ? data.saleDiscountType
            : null;
    const saleVal =
        saleType && data.saleDiscountValue != null && String(data.saleDiscountValue).trim() !== ''
            ? String(data.saleDiscountValue)
            : null;

    await db.update(products)
        .set({
            categoryId: data.categoryId,
            name: data.name,
            basePrice: data.basePrice,
            imageUrl: data.imageUrl,
            isHidden: data.isHidden ?? false,
            isFeatured: data.isFeatured ?? false,
            isQuickCartItem: data.isQuickCartItem ?? false,
            saleDiscountType: saleType,
            saleDiscountValue: saleVal,
            saleLabel: data.saleLabel?.trim() || null,
        })
        .where(eq(products.id, id));

    if (data.modifierGroups !== undefined) {
        // Simple approach: delete existing links and create new ones
        await db.delete(productModifierLinks).where(eq(productModifierLinks.productId, id));
        
        if (data.modifierGroups.length > 0) {
            await db.insert(productModifierLinks).values(
                data.modifierGroups.map(mg => ({
                    productId: id,
                    modifierGroupId: mg.modifierGroupId,
                    defaultModifierOptionId: mg.defaultModifierOptionId || null,
                }))
            );
        }
    } else if (data.modifierGroupIds !== undefined) {
        // Support old format for backward compatibility
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
    if (!id) return { success: false, error: 'Product ID is required' };
    const session = await getUserSession();
    if (!session?.companyId) return { success: false, error: 'Unauthorized' };

    try {
        // 1. Unlink from historical order items (SET NULL to preserve order history)
        await db.update(orderItems)
            .set({ productId: null })
            .where(eq(orderItems.productId, id));

        // 2. Delete all other FK-constrained child rows
        await db.delete(productModifierLinks).where(eq(productModifierLinks.productId, id));
        await db.delete(productIngredients).where(eq(productIngredients.productId, id));
        await db.delete(branchProductAvailability).where(eq(branchProductAvailability.productId, id));
        await db.delete(promotionItems).where(eq(promotionItems.productId, id));
        await db.delete(notifications).where(eq(notifications.productId, id));

        // 3. Finally delete the product
        await db.delete(products).where(eq(products.id, id));

        revalidatePath('/owner/menu-categories');
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Failed to delete product.' };
    }
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

export async function createModifierGroup(name: string, options: { name: string; price: number; imageUrl?: string }[], displayMode: 'list' | 'buttons' | 'cards' = 'list', defaultOptionIdentifier?: string | null) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    // Create group first without defaultOptionId (to avoid FK constraint issues)
    const inserted = await db.insert(modifierGroups).values({
        companyId: session.companyId,
        name,
        displayMode,
        defaultOptionId: null,
    }).returning();
    const group = Array.isArray(inserted) ? inserted[0] : undefined;
    if (!group) throw new Error('Failed to create modifier group');

    if (options.length > 0) {
        const insertedOptionsRaw = await db.insert(modifierOptions).values(
            options.map(opt => ({
                modifierGroupId: group.id,
                name: opt.name,
                price: opt.price.toString(),
                imageUrl: opt.imageUrl
            }))
        ).returning();
        const insertedOptions = Array.isArray(insertedOptionsRaw) ? insertedOptionsRaw : [];

        // If defaultOptionIdentifier was provided (as option name for new groups), find and set it
        if (defaultOptionIdentifier) {
            const defaultOption = insertedOptions.find(opt => opt.name === defaultOptionIdentifier);
            if (defaultOption) {
                await db.update(modifierGroups)
                    .set({ defaultOptionId: defaultOption.id })
                    .where(eq(modifierGroups.id, group.id));
            }
        }
    }

    revalidatePath('/owner/menu-categories');
}

export async function updateModifierGroup(
    id: string, 
    name: string, 
    options: { id?: string; name: string; price: number; imageUrl?: string }[], 
    displayMode: 'list' | 'buttons' | 'cards' = 'list',
    defaultOptionId?: string | null
) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    // 1. Update Group Details
    await db.update(modifierGroups)
        .set({ name, displayMode, defaultOptionId: defaultOptionId || null })
        .where(and(eq(modifierGroups.id, id), eq(modifierGroups.companyId, session.companyId)));

    // 2. Handle Options
    // Get existing options to know what to delete
    const existingOptions = await db.select().from(modifierOptions).where(eq(modifierOptions.modifierGroupId, id));
    const existingOptionIds = existingOptions.map(o => o.id);
    
    const incomingOptionIds = options.map(o => o.id).filter(Boolean) as string[];
    const optionsToDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));

    // Delete removed options
    if (optionsToDelete.length > 0) {
        try {
            await db.delete(productModifierOptionIngredients).where(
                inArray(productModifierOptionIngredients.modifierOptionId, optionsToDelete)
            );
            await db.delete(modifierOptions).where(inArray(modifierOptions.id, optionsToDelete));
        } catch (e: any) {
            if (e.message?.includes('violates foreign key constraint') || e.message?.includes('order_item_modifiers')) {
                throw new Error('Cannot delete some of these options because they have already been used in historical orders.');
            }
            throw e;
        }
    }

    // Upsert options
    for (const opt of options) {
        if (opt.id && existingOptionIds.includes(opt.id)) {
            // Update
            await db.update(modifierOptions)
                .set({ 
                    name: opt.name, 
                    price: opt.price.toString(), 
                    imageUrl: opt.imageUrl 
                })
                .where(eq(modifierOptions.id, opt.id));
        } else {
            // Insert
            await db.insert(modifierOptions).values({
                modifierGroupId: id,
                name: opt.name,
                price: opt.price.toString(),
                imageUrl: opt.imageUrl
            });
        }
    }

    revalidatePath('/owner/menu-categories');
}

export async function deleteModifierGroup(id: string) {
    const session = await getUserSession();
    if (!session?.companyId) throw new Error('Unauthorized');

    try {
        // 1. Break the circular reference: remove defaultOptionId so options can be deleted
        await db.update(modifierGroups)
            .set({ defaultOptionId: null })
            .where(eq(modifierGroups.id, id));

        // 2. Delete product links which also reference modifier options
        await db.delete(productModifierLinks).where(eq(productModifierLinks.modifierGroupId, id));

        const groupOptionIds = await db
            .select({ id: modifierOptions.id })
            .from(modifierOptions)
            .where(eq(modifierOptions.modifierGroupId, id));
        const optIds = groupOptionIds.map((o) => o.id);
        if (optIds.length > 0) {
            await db
                .delete(productModifierOptionIngredients)
                .where(inArray(productModifierOptionIngredients.modifierOptionId, optIds));
        }

        // 3. Delete the options themselves
        await db.delete(modifierOptions).where(eq(modifierOptions.modifierGroupId, id));

        // 4. Finally, delete the group
        await db.delete(modifierGroups).where(and(eq(modifierGroups.id, id), eq(modifierGroups.companyId, session.companyId)));
    } catch (e: any) {
        if (e.message?.includes('violates foreign key constraint') || e.message?.includes('order_item_modifiers')) {
            throw new Error('Cannot delete this modifier group because its options have already been used in historical orders.');
        }
        throw e;
    }

    revalidatePath('/owner/menu-categories');
}

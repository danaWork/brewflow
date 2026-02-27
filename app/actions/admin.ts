'use server';

import { db } from '@/lib/db';
import { companies, branches, orders, users, orderItems, orderItemModifiers, categories, products, activityLogs } from '@/db/schema';
import { count, eq, sql, desc, like, and, gte, lte, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/activity';
import { getUserSession } from './auth';

export async function getAdminOverviewStats() {
    try {
        const totalShopsResult = await db.select({ count: count() }).from(companies);
        const totalShops = totalShopsResult[0].count;

        const liveShopsResult = await db.select({ count: count(sql`DISTINCT ${branches.companyId}`) })
            .from(branches)
            .where(eq(branches.isActive, true));
        const liveShops = liveShopsResult[0].count;

        const activeNowResult = await db.select({ count: count(sql`DISTINCT ${branches.companyId}`) })
            .from(orders)
            .innerJoin(branches, eq(orders.branchId, branches.id))
            .where(sql`${orders.createdAt} >= NOW() - INTERVAL '30 minutes'`);
        const activeNow = activeNowResult[0].count;

        const totalOrdersResult = await db.select({ count: count() }).from(orders);
        const totalOrders = totalOrdersResult[0].count;

        return {
            totalShops,
            liveShops,
            activeNow,
            totalOrders
        };
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return { totalShops: 0, liveShops: 0, activeNow: 0, totalOrders: 0 };
    }
}

export async function getAllShops() {
    try {
        const shops = await db.select({
            id: companies.id,
            name: companies.name,
            totalOrders: count(orders.id),
            isActive: sql`BOOL_OR(${branches.isActive})`,
        })
            .from(companies)
            .leftJoin(branches, eq(companies.id, branches.companyId))
            .leftJoin(orders, eq(branches.id, orders.branchId))
            .groupBy(companies.id, companies.name);

        return shops.map(shop => ({
            ...shop,
            plan: 'Basic',
            totalOrders: Number(shop.totalOrders),
            isActive: Boolean(shop.isActive)
        }));
    } catch (error) {
        console.error('Error fetching shops:', error);
        return [];
    }
}

export async function toggleShopStatus(companyId: string, currentStatus: boolean) {
    try {
        const session = await getUserSession();

        // Get company name for logging
        const [company] = await db.select({ name: companies.name })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);

        await db.update(branches)
            .set({ isActive: !currentStatus })
            .where(eq(branches.companyId, companyId));

        // Log activity (null shopId for admin actions)
        if (session) {
            await logActivity(
                null,
                session.userId,
                currentStatus ? 'Shop Deactivated' : 'Shop Activated',
                {
                    shopName: company?.name || 'Unknown',
                    companyId,
                }
            );
        }

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error toggling shop status:', error);
        return { success: false };
    }
}

export async function deleteShop(companyId: string) {
    try {
        const session = await getUserSession();

        // Get company name before deletion
        const [company] = await db.select({ name: companies.name })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);

        await db.delete(companies).where(eq(companies.id, companyId));

        // Log activity
        if (session) {
            await logActivity(
                null,
                session.userId,
                'Shop Deleted',
                {
                    shopName: company?.name || 'Unknown',
                    companyId,
                }
            );
        }

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting shop:', error);
        return { success: false };
    }
}

export async function updateShop(companyId: string, newName: string) {
    try {
        const session = await getUserSession();
        if (!session || !newName.trim()) {
            return { success: false, error: 'Invalid input or unauthorized' };
        }

        // Get old company name for logging
        const [company] = await db.select({ name: companies.name })
            .from(companies)
            .where(eq(companies.id, companyId))
            .limit(1);

        if (!company) {
            return { success: false, error: 'Shop not found' };
        }

        // Update company name
        await db.update(companies)
            .set({ name: newName.trim() })
            .where(eq(companies.id, companyId));

        // Update branch name 
        // We assume the first branch or main branch should be updated. 
        // We'll just append " - Main" to match the creation logic
        await db.update(branches)
            .set({ branchName: `${newName.trim()} - Main` })
            .where(eq(branches.companyId, companyId));

        // Log activity
        await logActivity(
            null,
            session.userId,
            'Shop Updated',
            {
                oldName: company.name,
                newName: newName.trim(),
                companyId,
            }
        );

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error updating shop:', error);
        return { success: false, error: 'Failed to update shop' };
    }
}

export async function getAdminUsers() {
    try {
        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            role: users.role,
            notes: users.notes,
            shopName: companies.name,
            createdAt: users.createdAt,
        })
            .from(users)
            .leftJoin(companies, eq(users.companyId, companies.id))
            .where(eq(users.role, 'BRANCH_MANAGER'));

        return allUsers.map(u => ({
            ...u,
            username: u.email.split('@')[0],
            created: u.createdAt.toLocaleDateString(),
            createdAt: u.createdAt.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return [];
    }
}

import bcrypt from 'bcryptjs';

export async function createManagerAccount(email: string, passwordPlain: string, companyId: string, branchId: string | null) {
    try {
        let assignedBranchId = branchId;

        // If no branchId is provided, get the first branch of the company
        if (!assignedBranchId) {
            const [companyBranch] = await db.select({ id: branches.id })
                .from(branches)
                .where(eq(branches.companyId, companyId))
                .limit(1);
            
            if (companyBranch) {
                assignedBranchId = companyBranch.id;
            }
        }

        const passwordHash = bcrypt.hashSync(passwordPlain, 10);
        await db.insert(users).values({
            email,
            passwordHash,
            role: 'BRANCH_MANAGER',
            companyId,
            branchId: assignedBranchId,
        });
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error creating manager:', error);
        return { error: 'Failed to create manager' };
    }
}

export async function createShop(name: string, managerEmail: string, passwordPlain: string) {
    try {
        const session = await getUserSession();
        const passwordHash = bcrypt.hashSync(passwordPlain, 10);
        const [company] = await db.insert(companies).values({ name }).returning();
        const [branch] = await db.insert(branches).values({
            companyId: company.id,
            branchName: `${name} - Main`,
        }).returning();

        await db.insert(users).values({
            email: managerEmail,
            passwordHash,
            role: 'BRANCH_MANAGER',
            companyId: company.id,
            branchId: branch.id,
        });

        // Log activity
        if (session) {
            await logActivity(
                null,
                session.userId,
                'Shop Created',
                {
                    shopName: name,
                    managerEmail,
                    companyId: company.id,
                }
            );
        }

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error creating shop:', error);
        return { error: 'Failed to create shop' };
    }
}

export async function updateUserNotes(userId: string, notes: string) {
    try {
        await db.update(users).set({ notes }).where(eq(users.id, userId));
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function deleteUser(userId: string) {
    try {
        await db.delete(users).where(eq(users.id, userId));
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}


export type UpsellStats = {
    platformAcceptanceRate: number;
    bundleAcceptanceRate: number;
    crossSellAcceptanceRate: number;
    customizationRate: number;
    bundleItemsSold: number;
    crossSellItemsSold: number;
    customizedOrdersCount: number;
    shopRankings: ShopRanking[];
};

export type ShopRanking = {
    rank: number;
    id: string;
    name: string;
    totalOrders: number;
    acceptanceRate: number;
    bundleRate: number;
    bundleSold: number;
    crossSellRate: number;
    crossSellSold: number;
    customizationRate: number;
    customizationSold: number;
};

export async function getUpsellAnalytics(): Promise<UpsellStats> {
    try {
        // 1. Get total orders per shop
        const shopStats = await db.select({
            companyId: companies.id,
            companyName: companies.name,
            totalOrders: count(orders.id), // Change from countDistinct to count
        })
            .from(companies)
            .leftJoin(branches, eq(companies.id, branches.companyId))
            .leftJoin(orders, and(eq(branches.id, orders.branchId), inArray(orders.status, ['PREPARING', 'READY', 'COMPLETED'])))
            .groupBy(companies.id, companies.name);

        // 2. Calculate Bundle (Orders with > 1 item of same category type)
        // 3. Calculate Cross-Sell (Orders with items from disparate category types)
        // 4. Calculate Customization (Orders with modifiers)

        // Since complex aggregations are hard in pure Drizzle without creating views or complex raw SQL,
        // we'll fetch order details and process in JS for now given the anticipated scale is manageable.
        // For production scale, move this logic to DB views or complex SQL queries.

        const allOrders = await db.select({
            orderId: orders.id,
            companyId: branches.companyId,
            items: sql<any>`json_agg(json_build_object(
                'productId', ${orderItems.productId},
                'quantity', ${orderItems.quantity},
                'categoryType', ${categories.type},
                'customizations', ${orderItems.customizations}
            ))`
        })
            .from(orders)
            .innerJoin(branches, eq(orders.branchId, branches.id))
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(inArray(orders.status, ['PREPARING', 'READY', 'COMPLETED']))
            .groupBy(orders.id, branches.companyId);


        const shopMap = new Map<string, {
            totalOrders: number;
            bundleOrders: number;
            crossSellOrders: number;
            customizedOrders: number;
            bundleItems: number;
            crossSellItems: number;
            customizedItems: number;
        }>();

        // Initialize shop map
        shopStats.forEach(shop => {
            shopMap.set(shop.companyId, {
                totalOrders: 0, // Will recount from actual verified orders
                bundleOrders: 0,
                crossSellOrders: 0,
                customizedOrders: 0,
                bundleItems: 0,
                crossSellItems: 0,
                customizedItems: 0
            });
        });

        allOrders.forEach(order => {
            const shopId = order.companyId;
            const stats = shopMap.get(shopId) || {
                totalOrders: 0, bundleOrders: 0, crossSellOrders: 0, customizedOrders: 0,
                bundleItems: 0, crossSellItems: 0, customizedItems: 0
            };

            stats.totalOrders++;

            const items = order.items as any[];
            const types = new Set(items.map((i: any) => i.categoryType));
            const isItemCustomized = (i: any) => {
                if (!i.customizations) return false;
                try {
                    const parsed = typeof i.customizations === 'string' ? JSON.parse(i.customizations) : i.customizations;
                    const keys = Object.keys(parsed).filter(k => {
                        const lowerKey = k.toLowerCase();
                        return lowerKey !== 'size' && lowerKey !== 'bundlelabel' && lowerKey !== 'tag';
                    });
                    return keys.length > 0;
                } catch(e) { return false; }
            };

            const hasModifiers = items.some(isItemCustomized);
            const totalItems = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

            // Logic definitions:
            // Bundle: > 1 item total (simple definition for "Bundle Acceptance" proxy as "Upselling quantity")
            // Cross-Sell: > 1 distinct category types (e.g. Drink + Snack)
            // Customization: Any item has modifiers

            const isBundle = totalItems > 1;
            const isCrossSell = types.size > 1;
            const isCustomized = hasModifiers;

            if (isBundle) {
                stats.bundleOrders++;
                stats.bundleItems += totalItems;
            }
            if (isCrossSell) {
                stats.crossSellOrders++;
                stats.crossSellItems += totalItems; // or just count the secondary items? Let's count all.
            }
            if (isCustomized) {
                stats.customizedOrders++;
                stats.customizedItems += items.filter(isItemCustomized).length;
            }

            shopMap.set(shopId, stats);
        });

        const rankings: ShopRanking[] = shopStats.map((shop, index) => {
            const stats = shopMap.get(shop.companyId)!;
            const safeDiv = (n: number, d: number) => d === 0 ? 0 : (n / d) * 100;

            // Acceptance Rate of 'Upsell' behaviors generally
            // Let's define it as "Any behavior found" / Total
            // Or average of the 3 rates.
            // Let's use average of the 3 rates for "Acceptance Rate".
            const bundleRate = safeDiv(stats.bundleOrders, stats.totalOrders);
            const crossSellRate = safeDiv(stats.crossSellOrders, stats.totalOrders);
            const customizationRate = safeDiv(stats.customizedOrders, stats.totalOrders);
            const avgAcceptance = (bundleRate + crossSellRate + customizationRate) / 3; // heuristic

            return {
                rank: 0, // assigned later
                id: shop.companyId,
                name: shop.companyName,
                totalOrders: stats.totalOrders,
                acceptanceRate: parseFloat(avgAcceptance.toFixed(1)),
                bundleRate: parseFloat(bundleRate.toFixed(1)),
                bundleSold: stats.bundleOrders, // orders, not items
                crossSellRate: parseFloat(crossSellRate.toFixed(1)),
                crossSellSold: stats.crossSellOrders,
                customizationRate: parseFloat(customizationRate.toFixed(1)),
                customizationSold: stats.customizedOrders
            };
        });

        // Sort by Acceptance Rate
        rankings.sort((a, b) => b.acceptanceRate - a.acceptanceRate);
        rankings.forEach((r, i) => r.rank = i + 1);

        // Platform Aggregates
        const totalPlatformOrders = Array.from(shopMap.values()).reduce((sum, s) => sum + s.totalOrders, 0);
        const totalBundleOrders = Array.from(shopMap.values()).reduce((sum, s) => sum + s.bundleOrders, 0);
        const totalCrossSellOrders = Array.from(shopMap.values()).reduce((sum, s) => sum + s.crossSellOrders, 0);
        const totalCustomizedOrders = Array.from(shopMap.values()).reduce((sum, s) => sum + s.customizedOrders, 0);

        const safeDivTotal = (n: number, d: number) => d === 0 ? 0 : (n / d) * 100;

        return {
            platformAcceptanceRate: parseFloat(((safeDivTotal(totalBundleOrders, totalPlatformOrders) + safeDivTotal(totalCrossSellOrders, totalPlatformOrders) + safeDivTotal(totalCustomizedOrders, totalPlatformOrders)) / 3).toFixed(1)),
            bundleAcceptanceRate: parseFloat(safeDivTotal(totalBundleOrders, totalPlatformOrders).toFixed(1)),
            crossSellAcceptanceRate: parseFloat(safeDivTotal(totalCrossSellOrders, totalPlatformOrders).toFixed(1)),
            customizationRate: parseFloat(safeDivTotal(totalCustomizedOrders, totalPlatformOrders).toFixed(1)),
            bundleItemsSold: totalBundleOrders, // using order count as proxy for strict "sold" metric consistency
            crossSellItemsSold: totalCrossSellOrders,
            customizedOrdersCount: totalCustomizedOrders,
            shopRankings: rankings
        };

    } catch (error) {
        console.error('Error fetching upsell analytics:', error);
        return {
            platformAcceptanceRate: 0,
            bundleAcceptanceRate: 0,
            crossSellAcceptanceRate: 0,
            customizationRate: 0,
            bundleItemsSold: 0,
            crossSellItemsSold: 0,
            customizedOrdersCount: 0,
            shopRankings: []
        };
    }
}


export async function getActivityLogs(filters?: {
    shopId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}) {
    try {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (filters?.shopId && filters.shopId !== 'all') {
            conditions.push(eq(activityLogs.shopId, filters.shopId));
        }

        if (filters?.action) {
            conditions.push(like(activityLogs.action, `%${filters.action}%`));
        }

        if (filters?.startDate) {
            conditions.push(gte(activityLogs.createdAt, filters.startDate));
        }

        if (filters?.endDate) {
            conditions.push(lte(activityLogs.createdAt, filters.endDate));
        }

        const logs = await db.select({
            id: activityLogs.id,
            action: activityLogs.action,
            details: activityLogs.details,
            createdAt: activityLogs.createdAt,
            shopName: companies.name,
            branchName: branches.branchName,
            userEmail: users.email,
        })
            .from(activityLogs)
            .leftJoin(branches, eq(activityLogs.shopId, branches.id))
            .leftJoin(companies, eq(branches.companyId, companies.id))
            .leftJoin(users, eq(activityLogs.userId, users.id))
            // Spread operator on empty array is valid in ES6 but typescript might complain if not handled or drizzle expects at least one
            // and(...[]) returns undefined? Let's check drizzle behavior or just filter undefined out
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit)
            .offset(offset);

        return logs.map(log => ({
            ...log,
            formattedDate: log.createdAt.toLocaleDateString(),
            formattedTime: log.createdAt.toLocaleTimeString(),
            relativeTime: getRelativeTime(log.createdAt),
            shopDisplayName: log.shopName || log.branchName || 'Unknown Shop'
        }));

    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }
}

function getRelativeTime(date: Date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const diffInSeconds = (date.getTime() - now.getTime()) / 1000;

    if (Math.abs(diffInSeconds) < 60) return rtf.format(Math.round(diffInSeconds), 'second');
    if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute');
    if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
    return rtf.format(Math.round(diffInSeconds / 86400), 'day');
}

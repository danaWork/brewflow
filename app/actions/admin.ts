'use server';

import { db } from '@/lib/db';
import { companies, branches, orders, users } from '@/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
        await db.update(branches)
            .set({ isActive: !currentStatus })
            .where(eq(branches.companyId, companyId));

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error toggling shop status:', error);
        return { success: false };
    }
}

export async function deleteShop(companyId: string) {
    try {
        await db.delete(companies).where(eq(companies.id, companyId));
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting shop:', error);
        return { success: false };
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
            created: u.createdAt.toLocaleDateString()
        }));
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return [];
    }
}

import bcrypt from 'bcryptjs';

export async function createManagerAccount(email: string, passwordPlain: string, companyId: string, branchId: string | null) {
    try {
        const passwordHash = bcrypt.hashSync(passwordPlain, 10);
        await db.insert(users).values({
            email,
            passwordHash,
            role: 'BRANCH_MANAGER',
            companyId,
            branchId,
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

'use server';

import { db } from '@/lib/db';
import { users, orders, orderItems, orderItemModifiers, categories, products, branches } from '@/db/schema';
import { eq, sql, and, gte, inArray, desc, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getUserSession } from './auth';

export type OwnerAnalytics = {
    bundleAcceptanceRate: number;
    crossSellAcceptanceRate: number;
    customizationRate: number;
    bundleItemsSold: number;
    crossSellItemsSold: number;
    customizedOrdersCount: number;
    totalRevenue: number;
    totalCashRevenue: number;
    totalDigitalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueOverTime: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }>;
    revenueWeekly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }>;
    revenueMonthly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }>;
    revenueYearly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }>;
};

export async function getOwnerAnalytics(branchId: string, days: number = 30): Promise<OwnerAnalytics> {
    try {
        const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.trunc(n)));
        const dailyDays = clampInt(days, 1, 365);
        const weeklyWeeks = 12;
        const monthlyMonths = 12;
        const yearlyYears = 5;

        const pad2 = (n: number) => String(n).padStart(2, '0');
        const toUtcDateKey = (d: Date) => d.toISOString().split('T')[0];
        const utcStartOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

        const isoWeekKeyAndStart = (dateUtc: Date): { key: string; weekStartUtc: Date } => {
            // ISO week is based on Thursday; week starts Monday.
            const d = utcStartOfDay(dateUtc);
            const day = d.getUTCDay(); // 0..6 (Sun..Sat)
            const isoDay = day === 0 ? 7 : day; // 1..7 (Mon..Sun)
            const weekStart = new Date(d);
            weekStart.setUTCDate(d.getUTCDate() - (isoDay - 1)); // Monday

            const thursday = new Date(weekStart);
            thursday.setUTCDate(weekStart.getUTCDate() + 3);
            const isoYear = thursday.getUTCFullYear();

            const jan4 = new Date(Date.UTC(isoYear, 0, 4));
            const jan4Day = jan4.getUTCDay();
            const jan4IsoDay = jan4Day === 0 ? 7 : jan4Day;
            const isoYearWeek1Start = new Date(jan4);
            isoYearWeek1Start.setUTCDate(jan4.getUTCDate() - (jan4IsoDay - 1));

            const weekNum = Math.floor((weekStart.getTime() - isoYearWeek1Start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return { key: `${isoYear}-W${pad2(weekNum)}`, weekStartUtc: weekStart };
        };

        const monthKeyAndStart = (dateUtc: Date): { key: string; monthStartUtc: Date } => {
            const start = new Date(Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), 1));
            return { key: `${start.getUTCFullYear()}-${pad2(start.getUTCMonth() + 1)}`, monthStartUtc: start };
        };

        const yearKeyAndStart = (dateUtc: Date): { key: string; yearStartUtc: Date } => {
            const start = new Date(Date.UTC(dateUtc.getUTCFullYear(), 0, 1));
            return { key: `${start.getUTCFullYear()}`, yearStartUtc: start };
        };

        type Bucket = { revenue: number; cashRevenue: number; digitalRevenue: number; orders: number };
        const addToBucket = (map: Map<string, Bucket>, key: string, revenue: number, cashRevenue: number, digitalRevenue: number) => {
            const existing = map.get(key) || { revenue: 0, cashRevenue: 0, digitalRevenue: 0, orders: 0 };
            map.set(key, {
                revenue: existing.revenue + revenue,
                cashRevenue: existing.cashRevenue + cashRevenue,
                digitalRevenue: existing.digitalRevenue + digitalRevenue,
                orders: existing.orders + 1
            });
        };

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dailyDays);

        // Get all orders for this branch within the time period
        const branchOrders = await db.select({
            orderId: orders.id,
            totalAmount: orders.totalAmount,
            paymentMethod: orders.paymentMethod,
            createdAt: orders.createdAt,
            items: sql<any>`json_agg(json_build_object(
                'productId', ${orderItems.productId},
                'quantity', ${orderItems.quantity},
                'categoryType', ${categories.type},
                'customizations', ${orderItems.customizations}
            ))`
        })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(
                and(
                    eq(orders.branchId, branchId),
                    gte(orders.createdAt, startDate),
                    inArray(orders.status, ['PREPARING', 'READY', 'COMPLETED'])
                )
            )
            .groupBy(orders.id, orders.totalAmount, orders.paymentMethod, orders.createdAt);

        // Calculate metrics
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalCashRevenue = 0;
        let totalDigitalRevenue = 0;
        let bundleOrders = 0;
        let crossSellOrders = 0;
        let customizedOrders = 0;
        let bundleItems = 0;
        let crossSellItems = 0;
        let customizedItems = 0;

        const revenueByDate = new Map<string, Bucket>();
        const revenueByWeek = new Map<string, Bucket>();
        const revenueByMonth = new Map<string, Bucket>();
        const revenueByYear = new Map<string, Bucket>();
        const weekStartByKey = new Map<string, Date>();

        branchOrders.forEach(order => {
            totalOrders++;
            const revenue = parseFloat(order.totalAmount.toString());
            totalRevenue += revenue;

            const isCash = (order.paymentMethod || '').toUpperCase() === 'CASH';
            const isDigital = !isCash && !!order.paymentMethod;
            if (isCash) totalCashRevenue += revenue;
            else if (isDigital) totalDigitalRevenue += revenue;
            const cashToAdd = isCash ? revenue : 0;
            const digitalToAdd = isDigital ? revenue : 0;

            // Group by date
            const createdUtc = utcStartOfDay(order.createdAt);
            const dateKey = toUtcDateKey(createdUtc);
            addToBucket(revenueByDate, dateKey, revenue, cashToAdd, digitalToAdd);

            const { key: weekKey, weekStartUtc } = isoWeekKeyAndStart(createdUtc);
            addToBucket(revenueByWeek, weekKey, revenue, cashToAdd, digitalToAdd);
            if (!weekStartByKey.has(weekKey)) weekStartByKey.set(weekKey, weekStartUtc);

            const { key: monthKey } = monthKeyAndStart(createdUtc);
            addToBucket(revenueByMonth, monthKey, revenue, cashToAdd, digitalToAdd);

            const { key: yearKey } = yearKeyAndStart(createdUtc);
            addToBucket(revenueByYear, yearKey, revenue, cashToAdd, digitalToAdd);

            const items = order.items as any[];
            const types = new Set(items.map((i: any) => i.categoryType));
            const isItemCustomized = (i: any) => {
                if (!i.customizations) return false;
                try {
                    const parsed = typeof i.customizations === 'string' ? JSON.parse(i.customizations) : i.customizations;
                    const keys = Object.keys(parsed).filter(k => {
                        const lowerKey = k.toLowerCase();
                        return lowerKey !== 'size' && lowerKey !== 'bundlelabel' && lowerKey !== 'tag' && lowerKey !== '__optionids';
                    });
                    return keys.length > 0;
                } catch(e) { return false; }
            };

            const hasModifiers = items.some(isItemCustomized);
            const totalItemCount = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

            // Bundle: more than 1 item total
            const isBundle = totalItemCount > 1;
            // Cross-Sell: multiple category types
            const isCrossSell = types.size > 1;
            // Customization: any item has modifiers
            const isCustomized = hasModifiers;

            if (isBundle) {
                bundleOrders++;
                bundleItems += totalItemCount;
            }
            if (isCrossSell) {
                crossSellOrders++;
                crossSellItems += totalItemCount;
            }
            if (isCustomized) {
                customizedOrders++;
                customizedItems += items.filter(isItemCustomized).length;
            }
        });

        // Convert revenue map to array and sort by date
        const revenueOverTime = Array.from(revenueByDate.entries())
            .map(([date, data]) => ({
                date,
                revenue: parseFloat(data.revenue.toFixed(2)),
                cashRevenue: parseFloat(data.cashRevenue.toFixed(2)),
                digitalRevenue: parseFloat(data.digitalRevenue.toFixed(2)),
                orders: data.orders
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Fill in missing dates with zero values
        const filledRevenueOverTime: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }> = [];
        for (let i = 0; i < dailyDays; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (dailyDays - 1 - i));
            const dateKey = toUtcDateKey(date);
            const existing = revenueOverTime.find(r => r.date === dateKey);
            filledRevenueOverTime.push(existing || { date: dateKey, revenue: 0, cashRevenue: 0, digitalRevenue: 0, orders: 0 });
        }

        const filledRevenueWeekly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }> = [];
        for (let i = 0; i < weeklyWeeks; i++) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - (weeklyWeeks - 1 - i) * 7);
            const { key } = isoWeekKeyAndStart(d);
            const existing = revenueByWeek.get(key);
            const data = existing || { revenue: 0, cashRevenue: 0, digitalRevenue: 0, orders: 0 };
            filledRevenueWeekly.push({
                date: key,
                revenue: parseFloat(data.revenue.toFixed(2)),
                cashRevenue: parseFloat(data.cashRevenue.toFixed(2)),
                digitalRevenue: parseFloat(data.digitalRevenue.toFixed(2)),
                orders: data.orders
            });
        }

        const filledRevenueMonthly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }> = [];
        for (let i = 0; i < monthlyMonths; i++) {
            const d = new Date();
            d.setUTCMonth(d.getUTCMonth() - (monthlyMonths - 1 - i));
            const { key } = monthKeyAndStart(d);
            const existing = revenueByMonth.get(key);
            const data = existing || { revenue: 0, cashRevenue: 0, digitalRevenue: 0, orders: 0 };
            filledRevenueMonthly.push({
                date: key,
                revenue: parseFloat(data.revenue.toFixed(2)),
                cashRevenue: parseFloat(data.cashRevenue.toFixed(2)),
                digitalRevenue: parseFloat(data.digitalRevenue.toFixed(2)),
                orders: data.orders
            });
        }

        const filledRevenueYearly: Array<{ date: string; revenue: number; cashRevenue: number; digitalRevenue: number; orders: number }> = [];
        for (let i = 0; i < yearlyYears; i++) {
            const d = new Date();
            d.setUTCFullYear(d.getUTCFullYear() - (yearlyYears - 1 - i));
            const { key } = yearKeyAndStart(d);
            const existing = revenueByYear.get(key);
            const data = existing || { revenue: 0, cashRevenue: 0, digitalRevenue: 0, orders: 0 };
            filledRevenueYearly.push({
                date: key,
                revenue: parseFloat(data.revenue.toFixed(2)),
                cashRevenue: parseFloat(data.cashRevenue.toFixed(2)),
                digitalRevenue: parseFloat(data.digitalRevenue.toFixed(2)),
                orders: data.orders
            });
        }

        const safeDiv = (n: number, d: number) => d === 0 ? 0 : (n / d) * 100;

        return {
            bundleAcceptanceRate: parseFloat(safeDiv(bundleOrders, totalOrders).toFixed(1)),
            crossSellAcceptanceRate: parseFloat(safeDiv(crossSellOrders, totalOrders).toFixed(1)),
            customizationRate: parseFloat(safeDiv(customizedOrders, totalOrders).toFixed(1)),
            bundleItemsSold: bundleOrders,
            crossSellItemsSold: crossSellOrders,
            customizedOrdersCount: customizedOrders,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            totalCashRevenue: parseFloat(totalCashRevenue.toFixed(2)),
            totalDigitalRevenue: parseFloat(totalDigitalRevenue.toFixed(2)),
            totalOrders,
            averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
            revenueOverTime: filledRevenueOverTime,
            revenueWeekly: filledRevenueWeekly,
            revenueMonthly: filledRevenueMonthly,
            revenueYearly: filledRevenueYearly
        };

    } catch (error) {
        console.error('Error fetching owner analytics:', error);
        return {
            bundleAcceptanceRate: 0,
            crossSellAcceptanceRate: 0,
            customizationRate: 0,
            bundleItemsSold: 0,
            crossSellItemsSold: 0,
            customizedOrdersCount: 0,
            totalRevenue: 0,
            totalCashRevenue: 0,
            totalDigitalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            revenueOverTime: [],
            revenueWeekly: [],
            revenueMonthly: [],
            revenueYearly: []
        };
    }
}

export async function updateDashboardPassword(currentPass: string, newPass: string) {
    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const [user] = await db.select({ passwordHash: users.passwordHash })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const isValid = bcrypt.compareSync(currentPass, user.passwordHash);
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        const newPasswordHash = bcrypt.hashSync(newPass, 10);

        await db.update(users)
            .set({ passwordHash: newPasswordHash })
            .where(eq(users.id, session.userId));

        return { success: true };
    } catch (error) {
        console.error('Error updating dashboard password:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function updateDashboardEmail(newEmail: string, currentPass: string) {
    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        const [user] = await db.select({ passwordHash: users.passwordHash, companyId: users.companyId })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const isValid = bcrypt.compareSync(currentPass, user.passwordHash);
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Check format
        if (!newEmail.includes('@') || newEmail.length < 5) {
            return { success: false, error: 'Invalid email format' };
        }

        // Check if email already exists in the same company
        const [existing] = await db.select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.companyId, user.companyId),
                    eq(users.email, newEmail)
                )
            )
            .limit(1);

        if (existing && existing.id !== session.userId) {
            return { success: false, error: 'Email is already in use' };
        }

        await db.update(users)
            .set({ email: newEmail })
            .where(eq(users.id, session.userId));

        return { success: true };
    } catch (error) {
        console.error('Error updating dashboard email:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export type StaffMemberRow = {
    id: string;
    email: string;
    notes: string | null;
    createdAt: Date;
};

export async function getStaffMembersForBranch(): Promise<{ staff: StaffMemberRow[]; error?: string }> {
    const session = await getUserSession();
    if (!session || session.role !== 'BRANCH_MANAGER') {
        return { staff: [], error: 'Unauthorized' };
    }
    if (!session.branchId) {
        return { staff: [], error: 'No branch assigned' };
    }

    const staff = await db
        .select({
            id: users.id,
            email: users.email,
            notes: users.notes,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.branchId, session.branchId), eq(users.role, 'KITCHEN_STAFF')))
        .orderBy(desc(users.createdAt));

    return { staff };
}

export async function createStaffMember(
    email: string,
    passwordPlain: string,
    notes?: string | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getUserSession();
        if (!session || session.role !== 'BRANCH_MANAGER') {
            return { success: false, error: 'Unauthorized' };
        }
        if (!session.branchId) {
            return { success: false, error: 'No branch assigned' };
        }

        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes('@') || trimmed.length < 5) {
            return { success: false, error: 'Invalid email' };
        }
        if (!passwordPlain || passwordPlain.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.companyId, session.companyId), eq(users.email, trimmed)))
            .limit(1);

        if (existing) {
            return { success: false, error: 'Email is already in use for this shop' };
        }

        const passwordHash = bcrypt.hashSync(passwordPlain, 10);
        await db.insert(users).values({
            companyId: session.companyId,
            branchId: session.branchId,
            email: trimmed,
            passwordHash,
            role: 'KITCHEN_STAFF',
            notes: notes?.trim() || null,
        });

        return { success: true };
    } catch (error) {
        console.error('createStaffMember:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function deleteStaffMember(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getUserSession();
        if (!session || session.role !== 'BRANCH_MANAGER') {
            return { success: false, error: 'Unauthorized' };
        }
        if (!session.branchId) {
            return { success: false, error: 'No branch assigned' };
        }

        const [target] = await db
            .select({
                id: users.id,
                branchId: users.branchId,
                companyId: users.companyId,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!target) {
            return { success: false, error: 'User not found' };
        }
        if (target.companyId !== session.companyId || target.branchId !== session.branchId) {
            return { success: false, error: 'Unauthorized' };
        }
        if (target.role !== 'KITCHEN_STAFF') {
            return { success: false, error: 'Can only remove staff members' };
        }

        await db.delete(users).where(eq(users.id, userId));
        return { success: true };
    } catch (error) {
        console.error('deleteStaffMember:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function updateStaffMember(
    userId: string,
    updates: {
        email: string;
        notes: string | null;
        newPasswordPlain?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getUserSession();
        if (!session || session.role !== 'BRANCH_MANAGER') {
            return { success: false, error: 'Unauthorized' };
        }
        if (!session.branchId) {
            return { success: false, error: 'No branch assigned' };
        }

        const trimmedEmail = updates.email.trim().toLowerCase();
        if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
            return { success: false, error: 'Invalid email' };
        }

        if (updates.newPasswordPlain !== undefined && updates.newPasswordPlain !== '') {
            if (updates.newPasswordPlain.length < 8) {
                return { success: false, error: 'Password must be at least 8 characters' };
            }
        }

        const [target] = await db
            .select({
                id: users.id,
                branchId: users.branchId,
                companyId: users.companyId,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!target) {
            return { success: false, error: 'User not found' };
        }
        if (target.companyId !== session.companyId || target.branchId !== session.branchId) {
            return { success: false, error: 'Unauthorized' };
        }
        if (target.role !== 'KITCHEN_STAFF') {
            return { success: false, error: 'Can only edit staff members' };
        }

        const [emailTaken] = await db
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.companyId, session.companyId),
                    eq(users.email, trimmedEmail),
                    ne(users.id, userId)
                )
            )
            .limit(1);

        if (emailTaken) {
            return { success: false, error: 'Email is already in use for this shop' };
        }

        const noteValue = updates.notes?.trim() || null;
        const patch: { email: string; notes: string | null; passwordHash?: string } = {
            email: trimmedEmail,
            notes: noteValue,
        };

        if (updates.newPasswordPlain) {
            patch.passwordHash = bcrypt.hashSync(updates.newPasswordPlain, 10);
        }

        await db.update(users).set(patch).where(eq(users.id, userId));

        return { success: true };
    } catch (error) {
        console.error('updateStaffMember:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function getPrinterConfigAction(): Promise<
    | { success: true; config: { host: string | null; port: number | null } }
    | { success: false; error: string }
> {
    try {
        const session = await getUserSession();
        if (!session || session.role !== 'BRANCH_MANAGER') {
            return { success: false, error: 'Unauthorized' };
        }
        if (!session.branchId) {
            return { success: false, error: 'No branch assigned' };
        }

        const [row] = await db
            .select({ host: branches.printerHost, port: branches.printerPort })
            .from(branches)
            .where(eq(branches.id, session.branchId))
            .limit(1);

        if (!row) {
            return { success: false, error: 'Branch not found' };
        }

        return { success: true, config: { host: row.host ?? null, port: row.port ?? null } };
    } catch (error) {
        console.error('getPrinterConfigAction:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function savePrinterConfigAction(
    host: string,
    port: number | null
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getUserSession();
        if (!session || session.role !== 'BRANCH_MANAGER') {
            return { success: false, error: 'Unauthorized' };
        }
        if (!session.branchId) {
            return { success: false, error: 'No branch assigned' };
        }

        const trimmedHost = (host ?? '').trim();
        const hostValue = trimmedHost ? trimmedHost : null;

        let portValue: number | null = null;
        if (port != null) {
            const n = Number(port);
            if (!Number.isFinite(n) || n <= 0 || n > 65535) {
                return { success: false, error: 'Invalid port' };
            }
            portValue = Math.trunc(n);
        }

        await db
            .update(branches)
            .set({
                printerHost: hostValue,
                printerPort: portValue,
            })
            .where(eq(branches.id, session.branchId));

        return { success: true };
    } catch (error) {
        console.error('savePrinterConfigAction:', error);
        return { success: false, error: 'Internal server error' };
    }
}

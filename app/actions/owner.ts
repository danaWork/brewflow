'use server';

import { db } from '@/lib/db';
import { orders, orderItems, orderItemModifiers, categories, products } from '@/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export type OwnerAnalytics = {
    bundleAcceptanceRate: number;
    crossSellAcceptanceRate: number;
    customizationRate: number;
    bundleItemsSold: number;
    crossSellItemsSold: number;
    customizedOrdersCount: number;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueOverTime: Array<{ date: string; revenue: number; orders: number }>;
};

export async function getOwnerAnalytics(branchId: string, days: number = 30): Promise<OwnerAnalytics> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get all orders for this branch within the time period
        const branchOrders = await db.select({
            orderId: orders.id,
            totalAmount: orders.totalAmount,
            createdAt: orders.createdAt,
            items: sql<any>`json_agg(json_build_object(
                'productId', ${orderItems.productId},
                'quantity', ${orderItems.quantity},
                'categoryType', ${categories.type},
                'hasModifiers', EXISTS(
                    SELECT 1 FROM ${orderItemModifiers}
                    WHERE ${orderItemModifiers.orderItemId} = ${orderItems.id}
                )
            ))`
        })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(products, eq(orderItems.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(
                and(
                    eq(orders.branchId, branchId),
                    gte(orders.createdAt, startDate)
                )
            )
            .groupBy(orders.id, orders.totalAmount, orders.createdAt);

        // Calculate metrics
        let totalOrders = 0;
        let totalRevenue = 0;
        let bundleOrders = 0;
        let crossSellOrders = 0;
        let customizedOrders = 0;
        let bundleItems = 0;
        let crossSellItems = 0;
        let customizedItems = 0;

        const revenueByDate = new Map<string, { revenue: number; orders: number }>();

        branchOrders.forEach(order => {
            totalOrders++;
            const revenue = parseFloat(order.totalAmount.toString());
            totalRevenue += revenue;

            // Group by date
            const dateKey = order.createdAt.toISOString().split('T')[0];
            const existing = revenueByDate.get(dateKey) || { revenue: 0, orders: 0 };
            revenueByDate.set(dateKey, {
                revenue: existing.revenue + revenue,
                orders: existing.orders + 1
            });

            const items = order.items as any[];
            const types = new Set(items.map((i: any) => i.categoryType));
            const hasModifiers = items.some((i: any) => i.hasModifiers);
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
                customizedItems += items.filter((i: any) => i.hasModifiers).length;
            }
        });

        // Convert revenue map to array and sort by date
        const revenueOverTime = Array.from(revenueByDate.entries())
            .map(([date, data]) => ({
                date,
                revenue: parseFloat(data.revenue.toFixed(2)),
                orders: data.orders
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Fill in missing dates with zero values
        const filledRevenueOverTime: Array<{ date: string; revenue: number; orders: number }> = [];
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateKey = date.toISOString().split('T')[0];
            const existing = revenueOverTime.find(r => r.date === dateKey);
            filledRevenueOverTime.push(existing || { date: dateKey, revenue: 0, orders: 0 });
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
            totalOrders,
            averageOrderValue: totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
            revenueOverTime: filledRevenueOverTime
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
            totalOrders: 0,
            averageOrderValue: 0,
            revenueOverTime: []
        };
    }
}

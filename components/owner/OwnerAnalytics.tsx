'use client';

import { Package, ShoppingCart, Sparkles, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import type { OwnerAnalytics } from '@/app/actions/owner';
import { RevenueChart } from './RevenueChart';
import { useMemo } from 'react';

interface OwnerAnalyticsProps {
    analytics: OwnerAnalytics;
}

export function OwnerAnalytics({ analytics }: OwnerAnalyticsProps) {
    // Format currency - memoized to prevent recreation
    const formatCurrency = useMemo(() => {
        return (value: number) => {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        };
    }, []);

    return (
        <div className="p-4 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Track your shop's performance and revenue</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Revenue */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <DollarSign className="text-green-600" size={20} />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                REVENUE
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-gray-900 mb-1">
                                {formatCurrency(analytics.totalRevenue)}
                            </h3>
                            <p className="text-sm text-gray-500">Total Revenue (Last 30 Days)</p>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-green-50 rounded-full opacity-50" />
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <ShoppingBag size={20} />
                            <span className="text-sm font-medium">Total Orders</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {analytics.totalOrders}
                        </h3>
                        <p className="text-xs text-gray-400">Last 30 Days</p>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <TrendingUp size={20} />
                            <span className="text-sm font-medium">Avg Order Value</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">
                            {formatCurrency(analytics.averageOrderValue)}
                        </h3>
                        <p className="text-xs text-gray-400">Per Order</p>
                    </div>
                </div>

                {/* Revenue Chart */}
                <RevenueChart data={analytics.revenueOverTime} />

                {/* Upsell Metrics */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Upsell Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Bundle Acceptance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-gray-500">
                                <Package size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Bundle Acceptance</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {analytics.bundleAcceptanceRate}%
                            </h3>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${analytics.bundleAcceptanceRate}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400">Orders with multiple items</p>
                        </div>

                        {/* Cross-Sell Acceptance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-gray-500">
                                <ShoppingCart size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Cross-Sell Acceptance</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {analytics.crossSellAcceptanceRate}%
                            </h3>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${analytics.crossSellAcceptanceRate}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400">Orders with mixed categories</p>
                        </div>

                        {/* Customization Rate */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-gray-500">
                                <Sparkles size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Customization Rate</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {analytics.customizationRate}%
                            </h3>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${analytics.customizationRate}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400">Orders with modifiers</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                            <Package size={18} className="text-blue-500" />
                            Bundle Orders
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{analytics.bundleItemsSold}</div>
                        <div className="text-xs text-gray-400 mt-1">Total bundle orders</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                            <ShoppingCart size={18} className="text-purple-500" />
                            Cross-Sell Orders
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{analytics.crossSellItemsSold}</div>
                        <div className="text-xs text-gray-400 mt-1">Total cross-sell orders</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                            <Sparkles size={18} className="text-amber-500" />
                            Customized Orders
                        </div>
                        <div className="text-3xl font-bold text-gray-900">{analytics.customizedOrdersCount}</div>
                        <div className="text-xs text-gray-400 mt-1">Total customized orders</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

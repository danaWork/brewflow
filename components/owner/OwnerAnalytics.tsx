'use client';

import { Package, ShoppingCart, Sparkles, DollarSign, ShoppingBag, TrendingUp, Info, Banknote, CreditCard } from 'lucide-react';
import type { OwnerAnalytics } from '@/app/actions/owner';
import { RevenueChart } from './RevenueChart';
import { useMemo, useState, useRef, useEffect } from 'react';

interface OwnerAnalyticsProps {
    analytics: OwnerAnalytics;
}

export function OwnerAnalytics({ analytics }: OwnerAnalyticsProps) {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setActiveTooltip(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTooltip = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveTooltip(activeTooltip === id ? null : id);
    };

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

    const formatDailyKey = useMemo(() => {
        return (key: string) => {
            const d = new Date(key);
            if (Number.isNaN(d.getTime())) return key;
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
    }, []);

    const isoWeekKeyToUtcMonday = (key: string): Date | null => {
        const match = /^(\d{4})-W(\d{2})$/.exec(key);
        if (!match) return null;
        const year = Number(match[1]);
        const week = Number(match[2]);
        if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;

        // Monday of ISO week 1 is the Monday of the week containing Jan 4th.
        const jan4 = new Date(Date.UTC(year, 0, 4));
        const day = jan4.getUTCDay(); // 0..6
        const isoDay = day === 0 ? 7 : day; // 1..7
        const week1Monday = new Date(jan4);
        week1Monday.setUTCDate(jan4.getUTCDate() - (isoDay - 1));

        const monday = new Date(week1Monday);
        monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
        return monday;
    };

    const formatWeeklyKey = useMemo(() => {
        return (key: string) => {
            const monday = isoWeekKeyToUtcMonday(key);
            if (!monday) return key;
            return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        };
    }, []);

    const formatMonthlyKey = useMemo(() => {
        return (key: string) => {
            const match = /^(\d{4})-(\d{2})$/.exec(key);
            if (!match) return key;
            const year = Number(match[1]);
            const month = Number(match[2]); // 1..12
            const d = new Date(Date.UTC(year, month - 1, 1));
            if (Number.isNaN(d.getTime())) return key;
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };
    }, []);

    const formatYearlyKey = useMemo(() => {
        return (key: string) => key;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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

                    {/* Total Cash Revenue */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <Banknote size={20} className="text-emerald-500" />
                            <span className="text-sm font-medium">Cash Sales</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(analytics.totalCashRevenue)}
                        </h3>
                        <p className="text-xs text-gray-400">Total Cash (Last 30 Days)</p>
                    </div>

                    {/* Total Digital Revenue */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <CreditCard size={20} className="text-blue-500" />
                            <span className="text-sm font-medium">Digital Sales</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(analytics.totalDigitalRevenue)}
                        </h3>
                        <p className="text-xs text-gray-400">Maya / GCash (Last 30 Days)</p>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm xl:col-span-1">
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm xl:col-span-1">
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

                {/* Revenue Charts */}
                <div className="space-y-6">
                    <RevenueChart
                        data={analytics.revenueOverTime}
                        title="Revenue (Daily)"
                        subtitle="Last 30 days"
                        formatXAxisLabel={formatDailyKey}
                        formatTooltipLabel={formatDailyKey}
                    />

                    <RevenueChart
                        data={analytics.revenueWeekly}
                        title="Revenue (Weekly)"
                        subtitle="Last 12 weeks"
                        formatXAxisLabel={(key) => key.replace(/^(\d{4})-W0?(\d{1,2})$/, 'W$2')}
                        formatTooltipLabel={formatWeeklyKey}
                    />

                    <RevenueChart
                        data={analytics.revenueMonthly}
                        title="Revenue (Monthly)"
                        subtitle="Last 12 months"
                        formatXAxisLabel={formatMonthlyKey}
                        formatTooltipLabel={formatMonthlyKey}
                    />

                    <RevenueChart
                        data={analytics.revenueYearly}
                        title="Revenue (Yearly)"
                        subtitle="Last 5 years"
                        formatXAxisLabel={formatYearlyKey}
                        formatTooltipLabel={formatYearlyKey}
                    />
                </div>

                {/* Upsell Metrics */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Upsell Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Bundle Acceptance */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                                <Package size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Bundle Acceptance</span>
                                <div 
                                    className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors"
                                    onClick={(e) => toggleTooltip('bundle', e)}
                                    onMouseEnter={() => setActiveTooltip('bundle')}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                >
                                    <Info size={14} />
                                </div>
                                {activeTooltip === 'bundle' && (
                                    <div 
                                        ref={tooltipRef}
                                        className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <p className="font-semibold mb-1 text-gray-100">Bundle Acceptance Rate</p>
                                        <p className="text-gray-300">(Bundle Orders / Total Orders) * 100%</p>
                                        <p className="text-gray-400 mt-2">A Bundle Order is an order where the customer bought more than 1 item in total.</p>
                                        <div className="absolute left-6 -bottom-1 w-2 h-2 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                )}
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
                            <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                                <ShoppingCart size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Cross-Sell Acceptance</span>
                                <div 
                                    className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors"
                                    onClick={(e) => toggleTooltip('crossSell', e)}
                                    onMouseEnter={() => setActiveTooltip('crossSell')}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                >
                                    <Info size={14} />
                                </div>
                                {activeTooltip === 'crossSell' && (
                                    <div 
                                        ref={tooltipRef}
                                        className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <p className="font-semibold mb-1 text-gray-100">Cross-Sell Acceptance Rate</p>
                                        <p className="text-gray-300">(Cross-Sell Orders / Total Orders) * 100%</p>
                                        <p className="text-gray-400 mt-2">A Cross-Sell Order contains items from more than one distinct category type (e.g., mixing a "drink" and a "snack").</p>
                                        <div className="absolute left-6 -bottom-1 w-2 h-2 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                )}
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
                            <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                                <Sparkles size={20} className="text-[#D46215]" />
                                <span className="text-sm font-medium">Customization Rate</span>
                                <div 
                                    className="cursor-pointer text-gray-300 hover:text-gray-500 transition-colors"
                                    onClick={(e) => toggleTooltip('customization', e)}
                                    onMouseEnter={() => setActiveTooltip('customization')}
                                    onMouseLeave={() => setActiveTooltip(null)}
                                >
                                    <Info size={14} />
                                </div>
                                {activeTooltip === 'customization' && (
                                    <div 
                                        ref={tooltipRef}
                                        className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <p className="font-semibold mb-1 text-gray-100">Customization Rate</p>
                                        <p className="text-gray-300">(Customized Orders / Total Orders) * 100%</p>
                                        <p className="text-gray-400 mt-2">A Customized Order is any order where at least one item includes modifiers or customizations.</p>
                                        <div className="absolute left-6 -bottom-1 w-2 h-2 bg-gray-900 rotate-45 transform origin-center"></div>
                                    </div>
                                )}
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

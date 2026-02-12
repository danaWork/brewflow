'use client';

import { Info, TrendingUp, Package, ShoppingCart, Sparkles, ChevronDown } from 'lucide-react';
import type { UpsellStats } from '@/app/actions/admin';

interface UpsellAnalyticsProps {
    stats: UpsellStats;
}

export function UpsellAnalytics({ stats }: UpsellAnalyticsProps) {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Upsell Performance</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Last 30 Days
                    <ChevronDown size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Platform Average Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            PLATFORM AVG
                        </span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-bold text-gray-900 mb-1">
                            {stats.platformAcceptanceRate}%
                        </h3>
                        <p className="text-sm text-gray-500">Platform Acceptance Rate</p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-green-50 rounded-full opacity-50" />
                </div>

                {/* Bundle Acceptance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <Package size={20} />
                        <span className="text-sm font-medium">Bundle Acceptance</span>
                        <Info size={14} className="text-gray-300" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.bundleAcceptanceRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>

                {/* Cross-Sell Acceptance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <ShoppingCart size={20} />
                        <span className="text-sm font-medium">Cross-Sell Acceptance</span>
                        <Info size={14} className="text-gray-300" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.crossSellAcceptanceRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>

                {/* Customization Rate */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                        <Sparkles size={20} />
                        <span className="text-sm font-medium">Customization Rate</span>
                        <Info size={14} className="text-gray-300" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.customizationRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>
            </div>

            {/* Shop Rankings Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Shop Rankings</h3>
                    <div className="flex gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>18-30% (Healthy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>8-18% (Growing)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span>&lt;8% (Low)</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-50">
                                <th className="px-6 py-4 font-medium">Rank</th>
                                <th className="px-6 py-4 font-medium">Shop</th>
                                <th className="px-6 py-4 font-medium">Acceptance %</th>
                                <th className="px-6 py-4 font-medium text-right">Bundle</th>
                                <th className="px-6 py-4 font-medium text-right">Cross-Sell</th>
                                <th className="px-6 py-4 font-medium text-right">Customization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.shopRankings.map((shop) => (
                                <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                                    <td className="px-6 py-4 font-bold text-gray-400">#{shop.rank}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{shop.name}</div>
                                        <div className="text-xs text-gray-400">{shop.totalOrders} ORDERS</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[100px] overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${shop.acceptanceRate > 18 ? 'bg-green-500' :
                                                            shop.acceptanceRate > 8 ? 'bg-blue-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min(shop.acceptanceRate, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`font-bold ${shop.acceptanceRate > 18 ? 'text-green-600' :
                                                    shop.acceptanceRate > 8 ? 'text-blue-600' : 'text-red-500'
                                                }`}>
                                                {shop.acceptanceRate}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-gray-900">{shop.bundleRate}%</div>
                                        <div className="text-xs text-gray-400">{shop.bundleSold} SOLD</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-gray-900">{shop.crossSellRate}%</div>
                                        <div className="text-xs text-gray-400">{shop.crossSellSold} SOLD</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-gray-900">{shop.customizationRate}%</div>
                                        <div className="text-xs text-gray-400">{shop.customizationSold} ORDERS</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                        <Package size={18} className="text-blue-500" />
                        Bundle Items Sold
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.bundleItemsSold}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                        <ShoppingCart size={18} className="text-purple-500" />
                        Cross-Sell Items Sold
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.crossSellItemsSold}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold">
                        <Sparkles size={18} className="text-amber-500" />
                        Customized Orders
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.customizedOrdersCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>
            </div>
        </div>
    );
}

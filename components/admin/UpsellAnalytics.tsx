'use client';

import { Info, TrendingUp, Package, ShoppingCart, Sparkles, ChevronDown } from 'lucide-react';
import type { UpsellStats } from '@/app/actions/admin';
import { useState, useRef, useEffect } from 'react';

interface UpsellAnalyticsProps {
    stats: UpsellStats;
}

export function UpsellAnalytics({ stats }: UpsellAnalyticsProps) {
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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Upsell Performance</h2>
                <button className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-gray-200 rounded-lg text-xs md:text-sm text-gray-600 hover:bg-gray-50 shrink-0">
                    Last 30 Days
                    <ChevronDown size={14} className="md:w-4 md:h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Platform Average Card */}
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
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
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                        <Package size={20} />
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
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.bundleAcceptanceRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>

                {/* Cross-Sell Acceptance */}
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                        <ShoppingCart size={20} />
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
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.crossSellAcceptanceRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>

                {/* Customization Rate */}
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-500 relative">
                        <Sparkles size={20} />
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
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.customizationRate}%
                    </h3>
                    <p className="text-xs text-gray-400">Real-Time Behavior</p>
                </div>
            </div>

            {/* Shop Rankings */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-base md:text-lg font-bold text-gray-900">Shop Rankings</h3>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs font-medium">
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500" />
                            <span>18-30% (Healthy)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500" />
                            <span>8-18% (Growing)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500" />
                            <span>&lt;8% (Low)</span>
                        </div>
                    </div>
                </div>

                {/* Mobile: cards */}
                <div className="md:hidden divide-y divide-gray-50">
                    {stats.shopRankings.map((shop) => (
                        <div key={shop.id} className="p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div>
                                    <span className="font-bold text-gray-400 text-xs">#{shop.rank}</span>
                                    <div className="font-semibold text-gray-900 text-sm">{shop.name}</div>
                                    <div className="text-[10px] text-gray-400">{shop.totalOrders} orders</div>
                                </div>
                                <span className={`font-bold text-sm shrink-0 ${shop.acceptanceRate > 18 ? 'text-green-600' : shop.acceptanceRate > 8 ? 'text-blue-600' : 'text-red-500'}`}>
                                    {shop.acceptanceRate}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full rounded-full ${shop.acceptanceRate > 18 ? 'bg-green-500' : shop.acceptanceRate > 8 ? 'bg-blue-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(shop.acceptanceRate, 100)}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="font-semibold text-gray-900 text-xs">{shop.bundleRate}%</div>
                                    <div className="text-[10px] text-gray-400">Bundle</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-xs">{shop.crossSellRate}%</div>
                                    <div className="text-[10px] text-gray-400">Cross-Sell</div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 text-xs">{shop.customizationRate}%</div>
                                    <div className="text-[10px] text-gray-400">Custom</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold text-sm md:text-base">
                        <Package size={16} className="text-blue-500 md:w-[18px] md:h-[18px]" />
                        Bundle Items Sold
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.bundleItemsSold}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold text-sm md:text-base">
                        <ShoppingCart size={16} className="text-purple-500 md:w-[18px] md:h-[18px]" />
                        Cross-Sell Items Sold
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.crossSellItemsSold}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold text-sm md:text-base">
                        <Sparkles size={16} className="text-amber-500 md:w-[18px] md:h-[18px]" />
                        Customized Orders
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.customizedOrdersCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Real-time count</div>
                </div>
            </div>
        </div>
    );
}

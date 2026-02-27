'use client';

import React, { useState } from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import PerfectPairBundles from './PerfectPairBundles';
import CrossSell from './CrossSell';

type Tab = 'perfect-pair' | 'cross-sell';

interface PromotionsTabsProps {
    initialProducts: any[];
    initialPromotions: any[];
    branchId: string;
}

export default function PromotionsTabs({ initialProducts, initialPromotions, branchId }: PromotionsTabsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('perfect-pair');

    const hasPerfectPairOutOfStock = initialPromotions
        .filter(p => p.type === 'PERFECT_PAIR')
        .some(promo => {
            const triggerProduct = initialProducts.find(p => p.id === promo.triggerValue);
            const pairProducts = promo.items.map((i: any) => initialProducts.find(p => p.id === i.productId));
            return triggerProduct?.isInStock === false || pairProducts.some(p => p?.isInStock === false);
        });

    const hasCrossSellOutOfStock = initialPromotions
        .filter(p => p.type === 'CROSS_SELL')
        .some(promo => {
            const pairProducts = promo.items.map((i: any) => initialProducts.find(p => p.id === i.productId));
            return pairProducts.some(p => p?.isInStock === false);
        });

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl w-full max-w-2xl mx-auto border border-gray-200/50">
                <button
                    onClick={() => setActiveTab('perfect-pair')}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap relative
                        ${activeTab === 'perfect-pair'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <Zap size={16} className={activeTab === 'perfect-pair' ? 'text-orange-500' : ''} />
                    Perfect Pair Bundles
                    {hasPerfectPairOutOfStock && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">!</div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('cross-sell')}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap relative
                        ${activeTab === 'cross-sell'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    <TrendingUp size={16} className={activeTab === 'cross-sell' ? 'text-orange-500' : ''} />
                    Cross-Sell
                    {hasCrossSellOutOfStock && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">!</div>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="mt-8 transition-opacity duration-300">
                {activeTab === 'perfect-pair' ? (
                    <PerfectPairBundles products={initialProducts} promotions={initialPromotions} branchId={branchId} />
                ) : (
                    <CrossSell products={initialProducts} promotions={initialPromotions} branchId={branchId} />
                )}
            </div>
        </div>
    );
}

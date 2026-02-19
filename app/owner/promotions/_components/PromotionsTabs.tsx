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

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl w-full max-w-2xl mx-auto border border-gray-200/50">
                <button
                    onClick={() => setActiveTab('perfect-pair')}
                    className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'perfect-pair'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}
          `}
                >
                    <Zap size={16} className={activeTab === 'perfect-pair' ? 'text-orange-500' : ''} />
                    Perfect Pair Bundles
                </button>
                <button
                    onClick={() => setActiveTab('cross-sell')}
                    className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${activeTab === 'cross-sell'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}
          `}
                >
                    <TrendingUp size={16} className={activeTab === 'cross-sell' ? 'text-orange-500' : ''} />
                    Cross-Sell
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

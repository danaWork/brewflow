'use client';

import { Store, Activity, ShoppingBag, Globe } from 'lucide-react';

interface StatCardsProps {
    stats: {
        totalShops: number;
        liveShops: number;
        activeNow: number;
        totalOrders: number;
    };
}

export function StatCards({ stats }: StatCardsProps) {
    const cards = [
        {
            label: 'Total Shops',
            value: stats.totalShops,
            icon: Store,
            color: 'text-[#D46215]',
            borderColor: 'border-orange-50',
            bgColor: 'bg-orange-50/50'
        },
        {
            label: 'Live Shops',
            value: stats.liveShops,
            icon: Globe,
            color: 'text-blue-500',
            borderColor: 'border-blue-100',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Active Now',
            value: stats.activeNow,
            icon: Activity,
            color: 'text-emerald-500',
            borderColor: 'border-emerald-100',
            bgColor: 'bg-emerald-50',
            hasDot: true
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'text-purple-500',
            borderColor: 'border-purple-100',
            bgColor: 'bg-purple-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className={`relative p-4 md:p-6 rounded-xl md:rounded-2xl border ${card.borderColor} bg-white transition-all hover:shadow-md`}
                >
                    {card.hasDot && (
                        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    <div className="flex flex-col items-center">
                        <span className={`text-4xl md:text-5xl font-bold ${card.color} mb-2`}>
                            {card.value}
                        </span>
                        <span className="text-gray-500 font-medium text-sm lg:text-base">
                            {card.label}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

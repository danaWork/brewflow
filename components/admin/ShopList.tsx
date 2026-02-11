'use client';

import { useState, useMemo } from 'react';
import { ShopCard } from './ShopCard';
import { Search, ArrowUpDown, ChevronDown } from 'lucide-react';

interface Shop {
    id: string;
    name: string;
    totalOrders: number;
    isActive: boolean;
    plan: string;
}

export function ShopList({ shops }: { shops: Shop[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'totalOrders'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredAndSortedShops = useMemo(() => {
        let result = shops.filter(shop =>
            shop.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        result.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [shops, searchQuery, sortBy, sortOrder]);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">All Shops</h2>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search shops..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.currentTarget.value)}
                            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#D46215] transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex items-center bg-white border border-gray-100 rounded-xl px-3 py-2 gap-2 shadow-sm">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent text-sm text-gray-500 outline-none cursor-pointer"
                        >
                            <option value="name">Name</option>
                            <option value="totalOrders">Orders</option>
                        </select>
                        <ChevronDown size={14} className="text-gray-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={toggleSort}
                        className={`p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-[#D46215] transition-colors shadow-sm ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
                    >
                        <ArrowUpDown size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedShops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                ))}
                {filteredAndSortedShops.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400 italic bg-white rounded-3xl border border-dashed border-gray-200">
                        No shops found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    );
}

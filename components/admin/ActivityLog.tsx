'use client';

import { History, Search, Filter, Calendar as CalendarIcon, ChevronDown, RefreshCcw } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';

type ActivityLogItem = {
    id: string;
    action: string;
    details: string | null;
    createdAt: Date;
    shopName: string | null;
    branchName: string | null;
    userEmail: string | null;
    formattedDate: string;
    formattedTime: string;
    relativeTime: string;
    shopDisplayName: string;
};

type Shop = {
    id: string; // companyId
    name: string;
};

export function ActivityLog({ logs, shops }: { logs: ActivityLogItem[], shops: Shop[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [actionFilter, setActionFilter] = useState(searchParams.get('action') || '');
    const [shopFilter, setShopFilter] = useState(searchParams.get('shopId') || 'all');
    const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams);
        if (actionFilter) params.set('action', actionFilter);
        else params.delete('action');

        if (shopFilter && shopFilter !== 'all') params.set('shopId', shopFilter);
        else params.delete('shopId');

        if (dateFilter) params.set('date', dateFilter);
        else params.delete('date');

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    const handleReset = () => {
        setActionFilter('');
        setShopFilter('all');
        setDateFilter('');
        const params = new URLSearchParams(searchParams);
        params.delete('action');
        params.delete('shopId');
        params.delete('date');
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2.5 rounded-xl">
                            <History className="text-[#D46215]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Activity Log</h2>
                            <p className="text-sm text-gray-500">Track and monitor admin actions across all shops</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Action Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by action..."
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#D46215] transition-all"
                        />
                    </div>

                    {/* Shop Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={shopFilter}
                            onChange={(e) => setShopFilter(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[#D46215] transition-all appearance-none cursor-pointer"
                        >
                            <option value="all">All Shops</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#D46215] transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={isPending}
                            className="flex-1 bg-[#D46215] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b54f0d] transition-colors disabled:opacity-50"
                        >
                            {isPending ? 'Searching...' : 'Apply Filters'}
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isPending}
                            className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                            title="Reset Filters"
                        >
                            <RefreshCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900 block">{log.action}</span>
                                            {log.userEmail && <span className="text-xs text-gray-400">{log.userEmail}</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600">{log.shopDisplayName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 text-sm">{log.formattedDate}</span>
                                                <span className="text-gray-400 text-xs">{log.formattedTime} ({log.relativeTime} ago)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.details ? (
                                                <div className="max-w-xs truncate text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100" title={log.details}>
                                                    {log.details}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                        No activity logs found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

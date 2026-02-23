'use client';

import { Pause, Play, Trash2, Crown } from 'lucide-react';
import { toggleShopStatus, deleteShop } from '@/app/actions/admin';
import { useTransition, useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Shop {
    id: string;
    name: string;
    totalOrders: number;
    isActive: boolean;
    plan: string;
}

export function ShopCard({ shop }: { shop: Shop }) {
    const [isPending, startTransition] = useTransition();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleToggleStatus = () => {
        startTransition(async () => {
            await toggleShopStatus(shop.id, shop.isActive);
        });
    };

    const handleDeleteClick = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        startTransition(async () => {
            await deleteShop(shop.id);
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-gray-800">{shop.name}</h3>
                    {shop.isActive && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-500 text-sm">Total Orders</span>
                <span className="text-xl font-bold text-[#D46215]">{shop.totalOrders}</span>
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Plan</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">{shop.plan}</span>
            </div>

            <div className="flex gap-1.5 md:gap-2 mt-2">
                <button
                    onClick={handleToggleStatus}
                    disabled={isPending}
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 md:py-2.5 rounded-lg md:rounded-xl text-sm md:text-base font-medium transition-colors ${shop.isActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        } disabled:opacity-50`}
                >
                    {shop.isActive ? (
                        <>
                            <Pause size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" /> Pause
                        </>
                    ) : (
                        <>
                            <Play size={16} className="md:w-[18px] md:h-[18px]" fill="currentColor" /> Resume
                        </>
                    )}
                </button>

                <button className="p-2 md:p-2.5 border border-gray-100 rounded-lg md:rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                    <Crown size={16} className="md:w-[18px] md:h-[18px]" />
                </button>

                <button
                    onClick={handleDeleteClick}
                    disabled={isPending}
                    className="p-2 md:p-2.5 border border-gray-100 rounded-lg md:rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Shop"
                message={`Are you sure you want to delete ${shop.name}?`}
                variant="danger"
            />
        </div>
    );
}

'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { updateShop } from '@/app/actions/admin';

interface Shop {
    id: string;
    name: string;
}

interface EditShopModalProps {
    isOpen: boolean;
    onClose: () => void;
    shop: Shop;
}

export function EditShopModal({ isOpen, onClose, shop }: EditShopModalProps) {
    const [shopName, setShopName] = useState(shop.name);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!shopName.trim()) {
            setError('Shop name is required');
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('companyId', shop.id);
            formData.append('newName', shopName);

            const result = await updateShop(shop.id, shopName);
            if (result.success) {
                onClose();
            } else {
                setError(result.error || 'Failed to update shop');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Edit Shop Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-2 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                                Shop Name
                            </label>
                            <input
                                id="shopName"
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D46215] outline-none transition-colors"
                                placeholder="Enter shop name"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-5 py-2.5 bg-[#D46215] text-white rounded-xl font-medium hover:bg-[#B35212] transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

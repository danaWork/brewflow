'use client';

import { useState } from 'react';
import { createShop, createManagerAccount } from '@/app/actions/admin';
import { Plus, Store, UserPlus, X, Loader2 } from 'lucide-react';

export function AdminActionButtons({ shops }: { shops: any[] }) {
    const [showShopModal, setShowShopModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreateShop = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const passwordLabel = formData.get('password') as string;

        const res = await createShop(name, email, passwordLabel);
        setLoading(false);
        if (res.success) setShowShopModal(false);
        else alert(res.error || 'Failed to create shop');
    };

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const passwordLabel = formData.get('password') as string;
        const companyId = formData.get('companyId') as string;

        const res = await createManagerAccount(email, passwordLabel, companyId, null);
        setLoading(false);
        if (res.success) setShowUserModal(false);
        else alert(res.error || 'Failed to create user');
    };

    return (
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
            <button
                onClick={() => setShowShopModal(true)}
                className="flex items-center gap-1.5 md:gap-2 bg-[#D46215] text-white px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:bg-[#B75311] transition-all shadow-md active:scale-95"
            >
                <Plus size={18} className="md:w-5 md:h-5" />
                Add New Shop
            </button>
            <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 md:gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-sm md:text-base font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
                <UserPlus size={18} className="md:w-5 md:h-5" />
                Add Manager
            </button>

            {/* Shop Modal */}
            {showShopModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={() => setShowShopModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                <Store className="text-[#D46215]" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Add New Shop</h2>
                        </div>
                        <form onSubmit={handleCreateShop} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Shop Name</label>
                                <input name="name" required placeholder="Enter shop name" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215]" />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Initial Manager Account</p>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
                                    <input name="email" type="email" required placeholder="manager@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215]" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                    <input name="password" type="password" required placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215]" />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full bg-[#D46215] text-white py-4 rounded-2xl font-bold flex justify-center items-center">
                                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Create Shop'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative">
                        <button onClick={() => setShowUserModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                <UserPlus className="text-[#D46215]" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Add Manager</h2>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Assign to Shop</label>
                                <select name="companyId" required className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215] bg-white">
                                    {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Manager Email</label>
                                <input name="email" type="email" required placeholder="manager@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215]" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Initial Password</label>
                                <input name="password" type="password" required placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#D46215]" />
                            </div>
                            <button disabled={loading} className="w-full bg-[#D46215] text-white py-4 rounded-2xl font-bold flex justify-center items-center">
                                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Create Manager Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { addInventoryItemAction } from '@/app/actions/inventory';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddInventoryModal({ branchId }: { branchId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        unit: 'pcs',
        lowStockThreshold: '10',
        costPerUnit: ''
    });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await addInventoryItemAction({
            branchId,
            name: formData.name,
            quantity: formData.quantity,
            unit: formData.unit,
            lowStockThreshold: formData.lowStockThreshold,
            costPerUnit: formData.costPerUnit || null
        });

        if (res.success) {
            setIsOpen(false);
            setFormData({ name: '', quantity: '', unit: 'pcs', lowStockThreshold: '10', costPerUnit: '' });
            router.refresh();
        } else {
            alert('Failed to add item');
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#D95D1E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#bf4f18] transition-all shadow-md active:scale-95"
            >
                <Plus size={20} />
                Add Item
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add Inventory Item</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Name</label>
                        <input
                            required
                            type="text"
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all text-lg font-bold"
                            placeholder="e.g. Milk"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Quantity</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-medium"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Unit</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-medium"
                                placeholder="e.g. kg, L, pcs"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Low Stock Alert</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-medium"
                                value={formData.lowStockThreshold}
                                onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Cost / Unit</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-medium"
                                value={formData.costPerUnit}
                                onChange={e => setFormData({ ...formData, costPerUnit: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#bf4f18] transition-all active:scale-95"
                        >
                            Save Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Save } from 'lucide-react';
import { savePromotionAction } from '@/app/actions/promotions';

interface Product {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
    categoryName: string;
    categoryType: string;
}

interface CreateBundleModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    branchId: string;
    initialData?: any;
    onSuccess: () => void;
}

export default function CreateBundleModal({ isOpen, onClose, products, branchId, initialData, onSuccess }: CreateBundleModalProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [triggerItem, setTriggerItem] = useState<Product | null>(initialData?.triggerItem || null);
    const [pairItem, setPairItem] = useState<Product | null>(initialData?.pairItem || null);
    const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(initialData?.discountType || 'PERCENTAGE');
    const [discountValue, setDiscountValue] = useState(initialData?.discountValue || 10);
    const [triggerSearch, setTriggerSearch] = useState('');
    const [pairSearch, setPairSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setTriggerItem(null);
            setPairItem(null);
            setDiscountType('PERCENTAGE');
            setDiscountValue(10);
            setTriggerSearch('');
            setPairSearch('');
        } else if (initialData) {
            setName(initialData.name || '');
            setTriggerItem(initialData.triggerItem || null);
            setPairItem(initialData.pairItem || null);
            setDiscountType(initialData.discountType || 'PERCENTAGE');
            setDiscountValue(initialData.discountValue || 10);
            setTriggerSearch('');
            setPairSearch('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const drinks = products.filter(p => p.categoryType === 'drink');
    const snacks = products.filter(p => p.categoryType === 'snack');

    const filteredDrinks = drinks.filter(p =>
        p.name.toLowerCase().includes(triggerSearch.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(triggerSearch.toLowerCase())
    );

    const filteredSnacks = snacks.filter(p =>
        p.name.toLowerCase().includes(triggerSearch.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(triggerSearch.toLowerCase())
    );

    const getPairItems = () => {
        if (!triggerItem) return products;
        return products.filter(p => p.categoryType !== triggerItem.categoryType);
    };

    const pairItems = getPairItems().filter(p =>
        p.name.toLowerCase().includes(pairSearch.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(pairSearch.toLowerCase())
    );

    const handleSave = async () => {
        if (!triggerItem || !pairItem || !name) return;

        setLoading(true);
        const res = await savePromotionAction(branchId, {
            id: initialData?.id,
            name,
            type: 'PERFECT_PAIR',
            triggerType: 'PRODUCT',
            triggerValue: triggerItem.id,
            discountType,
            discountValue,
            productIds: [pairItem.id],
        });

        setLoading(false);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert(res.error || 'Failed to save promotion');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Bundle Rule' : 'Create New Bundle Rule'}</h2>
                        <p className="text-sm text-gray-400">Set up a new Perfect Pair bundle promotion.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Bundle Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bundle Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Coffee Special"
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Selection Area */}
                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Pairing Items</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            {/* Trigger Item */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Trigger Item</span>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={triggerSearch}
                                        onChange={(e) => setTriggerSearch(e.target.value)}
                                        className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-700 focus:outline-none focus:border-orange-300"
                                    />
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {filteredDrinks.slice(0, 3).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setTriggerItem(p);
                                                setPairItem(null);
                                            }}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${triggerItem?.id === p.id
                                                    ? 'bg-orange-500 text-white shadow-md'
                                                    : 'bg-white border border-gray-100 text-gray-700 hover:border-orange-200'
                                                }`}
                                        >
                                            <span className="text-sm font-medium truncate">{p.name}</span>
                                            {triggerItem?.id === p.id && <Check size={16} />}
                                        </button>
                                    ))}
                                    {filteredSnacks.slice(0, 3).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setTriggerItem(p);
                                                setPairItem(null);
                                            }}
                                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${triggerItem?.id === p.id
                                                    ? 'bg-orange-500 text-white shadow-md'
                                                    : 'bg-white border border-gray-100 text-gray-700 hover:border-orange-200'
                                                }`}
                                        >
                                            <span className="text-sm font-medium truncate">{p.name}</span>
                                            {triggerItem?.id === p.id && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pair Item */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                        {triggerItem?.categoryType === 'drink' ? 'Snack to Pair' : triggerItem?.categoryType === 'snack' ? 'Drink to Pair' : 'Item to Pair'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={pairSearch}
                                        onChange={(e) => setPairSearch(e.target.value)}
                                        className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-lg text-gray-700 focus:outline-none focus:border-orange-300"
                                    />
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {pairItems.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-4">Select a trigger item first</p>
                                    ) : (
                                        pairItems.slice(0, 6).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setPairItem(p)}
                                                className={`w-full flex items-center p-3 rounded-lg text-left transition-all ${pairItem?.id === p.id
                                                        ? 'bg-orange-500 text-white shadow-md'
                                                        : 'bg-white border border-gray-100 text-gray-700 hover:border-orange-200'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{p.name}</div>
                                                    <div className={`text-[10px] ${pairItem?.id === p.id ? 'text-white/80' : 'text-gray-400'}`}>₱{parseFloat(p.basePrice).toFixed(2)}</div>
                                                </div>
                                                {pairItem?.id === p.id && <Check size={16} />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            {triggerItem && pairItem 
                                ? `${triggerItem.name} + ${pairItem.name}` 
                                : triggerItem 
                                    ? `Select a ${triggerItem.categoryType === 'drink' ? 'snack' : 'drink'} to pair` 
                                    : 'Select trigger and pair items'}
                        </p>
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
                            <select
                                value={discountType}
                                onChange={(e) => setDiscountType(e.target.value as any)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (₱)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</label>
                            <input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(Number(e.target.value))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !triggerItem || !pairItem || !name}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-8 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
                    </button>
                </div>
            </div>
        </div>
    );
}

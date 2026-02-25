'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Package, ChevronDown, Save, CheckCircle2, X } from 'lucide-react';
import { savePromotionAction } from '@/app/actions/promotions';
import { useRouter } from 'next/navigation';
import CrossSellSelect from './CrossSellSelect';
import { AlertModal } from '@/components/ui/AlertModal';

interface Product {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
    categoryName: string;
    categoryType: string;
}

interface CrossSellProps {
    products: Product[];
    promotions: any[];
    branchId: string;
}

const CrossSellSection = ({
    title,
    icon,
    itemType,
    products,
    selectedItems,
    discountType,
    discountValue,
    onValueChange,
    onItemsChange
}: any) => {
    const selectRef = useRef<{ open: () => void }>(null);

    const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onItemsChange(selectedItems.filter((id: string) => id !== itemId));
    };

    const handleSlotClick = () => {
        selectRef.current?.open();
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-xl text-orange-500">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                    <p className="text-xs text-gray-500">These items will be suggested to the customer</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-3 space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Discount Type</label>
                    <div className="relative">
                        <select
                            value={discountType}
                            onChange={(e) => onValueChange('discountType', e.target.value)}
                            className="w-full appearance-none bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (₱)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Amount</label>
                    <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => onValueChange('discountValue', Number(e.target.value))}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                </div>

                <div className="md:col-span-7 space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Select {itemType} Items (Up to 2)</label>
                    <CrossSellSelect
                        ref={selectRef}
                        values={selectedItems}
                        options={products.filter((p: any) => p.categoryType === itemType.toLowerCase())}
                        onChange={onItemsChange}
                        placeholder={`Select ${itemType.toLowerCase()} products...`}
                    />
                </div>
            </div>

            {selectedItems.length > 0 && (
                <div className="pt-4 border-t border-gray-50">
                    <div className="flex flex-wrap gap-4">
                        {selectedItems.map((itemId: string) => {
                            const item = products.find((p: any) => p.id === itemId);
                            return (
                                <div key={itemId} className="flex-1 min-w-[200px] flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm group relative">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {item?.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={16} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-gray-800 truncate">{item?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">₱{parseFloat(item?.basePrice || '0').toFixed(2)}</div>
                                    </div>
                                    <button
                                        onClick={(e) => handleRemoveItem(itemId, e)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            );
                        })}
                        {selectedItems.length === 1 && (
                            <button
                                onClick={handleSlotClick}
                                className="flex-1 min-w-[200px] flex items-center justify-center border-2 border-dashed border-orange-200 rounded-xl p-3 hover:border-orange-300 hover:bg-orange-50/30 transition-all group"
                            >
                                <span className="text-[10px] font-medium text-orange-400 group-hover:text-orange-500">+ Add another item</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function CrossSell({ products, promotions, branchId }: CrossSellProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });

    const drinkPromo = promotions.find(p => p.type === 'CROSS_SELL' && p.triggerValue === 'drink');
    const snackPromo = promotions.find(p => p.type === 'CROSS_SELL' && p.triggerValue === 'snack');

    const [drinkState, setDrinkState] = useState({
        discountType: drinkPromo?.discountType || 'PERCENTAGE',
        discountValue: parseFloat(drinkPromo?.discountValue || '25'),
        productIds: drinkPromo?.items.map((i: any) => i.productId) || []
    });

    const [snackState, setSnackState] = useState({
        discountType: snackPromo?.discountType || 'PERCENTAGE',
        discountValue: parseFloat(snackPromo?.discountValue || '20'),
        productIds: snackPromo?.items.map((i: any) => i.productId) || []
    });

    const handleSave = async () => {
        setLoading(true);
        setShowSuccess(false);

        try {
            const [res1, res2] = await Promise.all([
                savePromotionAction(branchId, {
                    id: drinkPromo?.id,
                    name: 'Cross-Sell: Drink',
                    type: 'CROSS_SELL',
                    triggerType: 'CATEGORY_TYPE',
                    triggerValue: 'drink',
                    ...drinkState,
                }),
                savePromotionAction(branchId, {
                    id: snackPromo?.id,
                    name: 'Cross-Sell: Snack',
                    type: 'CROSS_SELL',
                    triggerType: 'CATEGORY_TYPE',
                    triggerValue: 'snack',
                    ...snackState,
                })
            ]);

            if (res1.success && res2.success) {
                setShowSuccess(true);
                router.refresh();
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setAlertConfig({ isOpen: true, message: 'Failed to save cross-sell configuration' });
            }
        } catch (error) {
            console.error(error);
            setAlertConfig({ isOpen: true, message: 'An error occurred while saving' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-orange-500 rounded-lg shadow-sm shadow-orange-200">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cross-Sell Engine</h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium max-w-lg">
                        Maximize revenue by offering relevant recommendations with exclusive discounts when customers pick specific categories.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {showSuccess && (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                            <CheckCircle2 size={16} />
                            Changes saved successfully
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid gap-8">
                <CrossSellSection
                    title="When Customer Chooses a Drink"
                    icon={<Package size={20} />}
                    itemType="Snack"
                    products={products}
                    selectedItems={drinkState.productIds}
                    discountType={drinkState.discountType}
                    discountValue={drinkState.discountValue}
                    onValueChange={(key: string, val: any) => setDrinkState(prev => ({ ...prev, [key]: val }))}
                    onItemsChange={(val: any) => setDrinkState(prev => ({ ...prev, productIds: val }))}
                />

                <CrossSellSection
                    title="When Customer Chooses a Snack"
                    icon={<Package size={20} />}
                    itemType="Drink"
                    products={products}
                    selectedItems={snackState.productIds}
                    discountType={snackState.discountType}
                    discountValue={snackState.discountValue}
                    onValueChange={(key: string, val: any) => setSnackState(prev => ({ ...prev, [key]: val }))}
                    onItemsChange={(val: any) => setSnackState(prev => ({ ...prev, productIds: val }))}
                />
            </div>

            <AlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                message={alertConfig.message}
            />
        </div>
    );
}

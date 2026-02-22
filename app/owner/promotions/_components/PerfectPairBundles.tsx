'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Pencil, Plus, Zap, Utensils, Coffee, Trash2 } from 'lucide-react';
import CreateBundleModal from './CreateBundleModal';
import QuickChangeSelect from './QuickChangeSelect';
import ConfirmationModal from './ConfirmationModal';
import { savePromotionAction, deletePromotionAction } from '@/app/actions/promotions';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
    categoryName: string;
    categoryType: string;
}

interface PromotionItem {
    id: string;
    promotionId: string;
    productId: string;
    product: Product;
}

interface Promotion {
    id: string;
    branchId: string;
    name: string;
    type: 'PERFECT_PAIR' | 'CROSS_SELL';
    triggerType: string;
    triggerValue: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: string;
    items: PromotionItem[];
}

interface PerfectPairBundlesProps {
    products: Product[];
    promotions: Promotion[];
    branchId: string;
}

export default function PerfectPairBundles({ products, promotions, branchId }: PerfectPairBundlesProps) {
    const router = useRouter();
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['drinks-snacks', 'snacks-drinks']);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<any>(null);
    const [confirmingAction, setConfirmingAction] = useState<{ type: 'quick-change' | 'delete', data: any } | null>(null);

    const toggleGroup = (id: string) => {
        setExpandedGroups(prev =>
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const perfectPairs = promotions.filter(p => p.type === 'PERFECT_PAIR');

    const drinksToSnacks = perfectPairs.filter(p => {
        const triggerProduct = products.find(prod => prod.id === p.triggerValue);
        return triggerProduct?.categoryType === 'drink';
    });

    const snacksToDrinks = perfectPairs.filter(p => {
        const triggerProduct = products.find(prod => prod.id === p.triggerValue);
        return triggerProduct?.categoryType === 'snack';
    });

    const handleQuickChange = async () => {
        if (!confirmingAction || confirmingAction.type !== 'quick-change') return;

        const { promotionId, productId, currentPromo } = confirmingAction.data;

        const res = await savePromotionAction(branchId, {
            id: promotionId,
            name: currentPromo.name,
            type: currentPromo.type,
            triggerType: currentPromo.triggerType,
            triggerValue: currentPromo.triggerValue,
            discountType: currentPromo.discountType,
            discountValue: parseFloat(currentPromo.discountValue),
            productIds: [productId],
        });

        if (res.success) {
            setConfirmingAction(null);
            router.refresh();
        } else {
            alert(res.error || 'Failed to update bundle');
        }
    };

    const handleDelete = async () => {
        if (!confirmingAction || confirmingAction.type !== 'delete') return;

        const { promotionId } = confirmingAction.data;
        const res = await deletePromotionAction(branchId, promotionId);

        if (res.success) {
            setConfirmingAction(null);
            router.refresh();
        } else {
            alert(res.error || 'Failed to delete bundle');
        }
    };

    const renderGroup = (id: string, title: string, icon: React.ReactNode, groupPromos: Promotion[]) => (
        <div className="space-y-4">
            <button
                onClick={() => toggleGroup(id)}
                className="w-full flex items-center justify-between py-2 border-b border-gray-100 group"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-semibold text-gray-800 text-sm">{title}</span>
                </div>
                {expandedGroups.includes(id) ? (
                    <ChevronUp size={18} className="text-gray-400 group-hover:text-gray-600" />
                ) : (
                    <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600" />
                )}
            </button>

            {expandedGroups.includes(id) && (
                <div className="grid gap-3">
                    {groupPromos.map((promo) => {
                        const triggerProduct = products.find(p => p.id === promo.triggerValue);
                        const pairProduct = promo.items[0]?.product;

                        const discountLabel = promo.discountType === 'PERCENTAGE' ? `${parseFloat(promo.discountValue)}%` : `₱${parseFloat(promo.discountValue)}`;
                        return (
                            <div
                                key={promo.id}
                                className="bg-white border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm group/row relative pr-14 sm:pr-3"
                            >
                                <div className="flex-1 min-w-0 text-sm font-medium text-gray-700">
                                    {triggerProduct?.name || 'Unknown Product'}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:flex-[1.5] sm:items-center gap-2 sm:gap-4">
                                    <div className="flex-1 min-w-0">
                                        <QuickChangeSelect
                                            value={pairProduct?.id || ''}
                                            options={products.filter(p => p.categoryType !== triggerProduct?.categoryType)}
                                            onChange={(newProductId) => setConfirmingAction({
                                                type: 'quick-change',
                                                data: { promotionId: promo.id, productId: newProductId, currentPromo: promo }
                                            })}
                                        />
                                    </div>
                                    {/* Discount badge: top-right corner on mobile, inline on desktop */}
                                    <span className="absolute top-2 right-2 sm:static shrink-0 w-fit bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                        {discountLabel}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingPromotion({
                                                    id: promo.id,
                                                    name: promo.name,
                                                    triggerItem: triggerProduct,
                                                    pairItem: pairProduct,
                                                    discountType: promo.discountType,
                                                    discountValue: parseFloat(promo.discountValue)
                                                });
                                                setIsCreateModalOpen(true);
                                            }}
                                            className="text-gray-400 hover:text-orange-500 p-1.5 rounded-lg hover:bg-orange-50"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmingAction({ type: 'delete', data: { promotionId: promo.id } })}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {groupPromos.length === 0 && (
                        <div className="py-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-400">No bundles found in this category.</p>
                            <button
                                onClick={() => {
                                    setEditingPromotion(null);
                                    setIsCreateModalOpen(true);
                                }}
                                className="text-orange-500 text-xs font-semibold mt-2 hover:underline"
                            >
                                + Create your first bundle
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-gray-900">Perfect Pair Bundles</h2>
                    <p className="text-sm text-gray-400">Manage item pairings with special discounts.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPromotion(null);
                        setIsCreateModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 w-full sm:w-auto whitespace-nowrap"
                >
                    <Plus size={18} />
                    Add Bundle
                </button>
            </div>

            <div className="space-y-8">
                {renderGroup('drinks-snacks', 'Drinks — Snacks', <Coffee size={18} className="text-orange-500" />, drinksToSnacks)}
                {renderGroup('snacks-drinks', 'Snacks — Drinks', <Utensils size={18} className="text-orange-500" />, snacksToDrinks)}
            </div>

            <CreateBundleModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingPromotion(null);
                }}
                products={products}
                branchId={branchId}
                initialData={editingPromotion}
                onSuccess={() => router.refresh()}
            />

            <ConfirmationModal
                isOpen={!!confirmingAction}
                onClose={() => setConfirmingAction(null)}
                onConfirm={confirmingAction?.type === 'quick-change' ? handleQuickChange : handleDelete}
                title={confirmingAction?.type === 'quick-change' ? 'Save Changes?' : 'Delete Bundle?'}
                message={confirmingAction?.type === 'quick-change'
                    ? 'Are you sure you want to update this bundle pairing?'
                    : 'This action cannot be undone. Are you sure you want to delete this bundle rule?'}
                confirmText={confirmingAction?.type === 'quick-change' ? 'Save Changes' : 'Delete Rule'}
                type={confirmingAction?.type === 'delete' ? 'danger' : 'warning'}
            />
        </div>
    );
}

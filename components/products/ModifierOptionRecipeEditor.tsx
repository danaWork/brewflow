'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    InventoryItem,
    linkModifierOptionToIngredientsAction,
} from '@/app/actions/inventory';
import { Plus, Trash2, Save, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AlertModal } from '@/components/ui/AlertModal';

type ModifierOption = { id: string; name: string; price?: string | number; imageUrl?: string | null };

type ModifierGroup = {
    id: string;
    name: string;
    displayMode: string;
    options: ModifierOption[];
};

type IngredientLine = { inventoryItemId: string; quantityRequired: number };

type InitialRow = {
    modifierOptionId: string;
    inventoryItemId: string;
    quantityRequired: number;
    inventoryItem: InventoryItem;
};

function groupInitialByOption(initial: InitialRow[]): Record<string, IngredientLine[]> {
    const map: Record<string, IngredientLine[]> = {};
    for (const row of initial) {
        if (!map[row.modifierOptionId]) map[row.modifierOptionId] = [];
        map[row.modifierOptionId].push({
            inventoryItemId: row.inventoryItemId,
            quantityRequired: row.quantityRequired,
        });
    }
    return map;
}

interface ModifierOptionRecipeEditorProps {
    branchId: string;
    productId: string;
    linkedGroups: ModifierGroup[];
    inventoryItems: InventoryItem[];
    initialModifierIngredients: InitialRow[];
    /** Lighter layout when nested inside the menu product modal */
    variant?: 'standalone' | 'embedded';
}

function buildRecipesState(
    optionIds: string[],
    initialModifierIngredients: InitialRow[]
): Record<string, IngredientLine[]> {
    const fromDb = groupInitialByOption(initialModifierIngredients);
    const next: Record<string, IngredientLine[]> = {};
    for (const oid of optionIds) {
        next[oid] = fromDb[oid]?.length ? [...fromDb[oid]] : [];
    }
    return next;
}

export default function ModifierOptionRecipeEditor({
    branchId,
    productId,
    linkedGroups,
    inventoryItems,
    initialModifierIngredients,
    variant = 'standalone',
}: ModifierOptionRecipeEditorProps) {
    const optionIds = useMemo(
        () => linkedGroups.flatMap((g) => g.options.map((o) => o.id)),
        [linkedGroups]
    );

    const [recipesByOption, setRecipesByOption] = useState<Record<string, IngredientLine[]>>(() =>
        buildRecipesState(optionIds, initialModifierIngredients)
    );

    const initialSig = useMemo(
        () =>
            `${productId}:${initialModifierIngredients.map((r) => `${r.modifierOptionId}:${r.inventoryItemId}:${r.quantityRequired}`).join('|')}`,
        [productId, initialModifierIngredients]
    );

    useEffect(() => {
        setRecipesByOption(buildRecipesState(optionIds, initialModifierIngredients));
    }, [productId, optionIds.join(','), initialSig]);

    const [isSaving, setIsSaving] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: '',
    });
    const router = useRouter();

    const updateLine = (
        optionId: string,
        index: number,
        field: keyof IngredientLine,
        value: string | number
    ) => {
        setRecipesByOption((prev) => {
            const lines = [...(prev[optionId] || [])];
            const line = { ...lines[index] };
            if (field === 'quantityRequired') {
                line.quantityRequired = parseFloat(String(value)) || 0;
            } else {
                line.inventoryItemId = value as string;
            }
            lines[index] = line;
            return { ...prev, [optionId]: lines };
        });
    };

    const addLine = (optionId: string) => {
        setRecipesByOption((prev) => ({
            ...prev,
            [optionId]: [...(prev[optionId] || []), { inventoryItemId: '', quantityRequired: 0 }],
        }));
    };

    const removeLine = (optionId: string, index: number) => {
        setRecipesByOption((prev) => ({
            ...prev,
            [optionId]: (prev[optionId] || []).filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        let failed = false;
        for (const oid of optionIds) {
            const raw = recipesByOption[oid] || [];
            const valid = raw.filter((i) => i.inventoryItemId && i.quantityRequired > 0);
            const res = await linkModifierOptionToIngredientsAction(branchId, productId, oid, valid);
            if (!res.success) {
                failed = true;
                break;
            }
        }
        if (failed) {
            setAlertConfig({ isOpen: true, message: 'Failed to save one or more modifier recipes' });
        } else {
            setAlertConfig({ isOpen: true, message: 'Modifier option recipes saved' });
            router.refresh();
        }
        setIsSaving(false);
    };

    const shell =
        variant === 'embedded'
            ? 'mt-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-5'
            : 'bg-white p-6 rounded-lg shadow mt-8';

    if (linkedGroups.length === 0) {
        return (
            <div className={shell}>
                <h3 className={`font-bold mb-2 ${variant === 'embedded' ? 'text-base text-gray-900' : 'text-lg'}`}>
                    Modifier option recipes
                </h3>
                <p className="text-sm text-gray-500">
                    This product has no modifier groups linked. Check the groups above under Linked Modifiers, then
                    set ingredient amounts per option (e.g. Large vs Medium).
                </p>
            </div>
        );
    }

    return (
        <div className={shell}>
            <h3 className={`font-bold mb-2 ${variant === 'embedded' ? 'text-base text-gray-900' : 'text-lg'}`}>
                Modifier option recipes
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Set ingredients per modifier option for this product only. When an order includes{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">__optionIds</code>, amounts here override the
                base recipe for the same stock items. Other base ingredients still apply.
            </p>

            <div className="space-y-6">
                {linkedGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 font-semibold text-gray-800">{group.name}</div>
                        <div className="divide-y">
                            {group.options.map((opt) => (
                                <details key={opt.id} className="group">
                                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 hover:bg-gray-50 list-none">
                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                                        <span>{opt.name}</span>
                                        <span className="text-xs text-gray-400 ml-auto">
                                            {(recipesByOption[opt.id] || []).filter(
                                                (l) => l.inventoryItemId && l.quantityRequired > 0
                                            ).length}{' '}
                                            ingredient line(s)
                                        </span>
                                    </summary>
                                    <div className="px-4 pb-4 pt-0 space-y-3 border-t bg-white">
                                        {(recipesByOption[opt.id] || []).map((ing, index) => (
                                            <div key={index} className="flex gap-4 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Ingredient
                                                    </label>
                                                    <select
                                                        className="w-full border rounded p-2"
                                                        value={ing.inventoryItemId}
                                                        onChange={(e) =>
                                                            updateLine(opt.id, index, 'inventoryItemId', e.target.value)
                                                        }
                                                    >
                                                        <option value="">Select item</option>
                                                        {inventoryItems.map((item) => (
                                                            <option key={item.id} value={item.id}>
                                                                {item.name} ({item.unit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-1/4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Qty required
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full border rounded p-2"
                                                        value={ing.quantityRequired}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                opt.id,
                                                                index,
                                                                'quantityRequired',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(opt.id, index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addLine(opt.id)}
                                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                                        >
                                            <Plus size={18} /> Add ingredient
                                        </button>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t pt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSaving ? 'Saving…' : 'Save modifier recipes'}
                </button>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                message={alertConfig.message}
            />
        </div>
    );
}

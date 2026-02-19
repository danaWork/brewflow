'use client';

import { useState } from 'react';
import { InventoryItem, linkProductToIngredientsAction } from '@/app/actions/inventory';
import { Plus, Trash2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Ingredient {
    inventoryItemId: string;
    quantityRequired: number;
}

interface ProductRecipeEditorProps {
    branchId: string;
    productId: string;
    initialIngredients: (Ingredient & { inventoryItem: InventoryItem })[];
    inventoryItems: InventoryItem[];
}

export default function ProductRecipeEditor({ branchId, productId, initialIngredients, inventoryItems }: ProductRecipeEditorProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>(
        initialIngredients.map(i => ({ inventoryItemId: i.inventoryItemId, quantityRequired: i.quantityRequired }))
    );
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const addIngredient = () => {
        setIngredients([...ingredients, { inventoryItemId: '', quantityRequired: 0 }]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
        const newIngredients = [...ingredients];
        if (field === 'quantityRequired') {
            newIngredients[index].quantityRequired = parseFloat(value as string) || 0;
        } else {
            newIngredients[index].inventoryItemId = value as string;
        }
        setIngredients(newIngredients);
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Filter out invalid entries
        const validIngredients = ingredients.filter(i => i.inventoryItemId && i.quantityRequired > 0);
        
        const res = await linkProductToIngredientsAction(branchId, productId, validIngredients);
        if (res.success) {
            alert('Recipe saved successfully');
            router.refresh();
        } else {
            alert('Failed to save recipe');
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h3 className="text-lg font-bold mb-4">Recipe / Ingredients</h3>
            <div className="space-y-4">
                {ingredients.map((ing, index) => (
                    <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient</label>
                            <select
                                className="w-full border rounded p-2"
                                value={ing.inventoryItemId}
                                onChange={e => updateIngredient(index, 'inventoryItemId', e.target.value)}
                            >
                                <option value="">Select Item</option>
                                {inventoryItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.unit})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qty Required</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full border rounded p-2"
                                value={ing.quantityRequired}
                                onChange={e => updateIngredient(index, 'quantityRequired', e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => removeIngredient(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex gap-4">
                <button
                    onClick={addIngredient}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                >
                    <Plus size={20} /> Add Ingredient
                </button>
            </div>
            
            <div className="mt-6 border-t pt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Recipe'}
                </button>
            </div>
        </div>
    );
}

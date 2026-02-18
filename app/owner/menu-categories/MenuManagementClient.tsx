'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Image as ImageIcon, Settings2, X, Trash } from 'lucide-react';
import { 
    createCategory, updateCategory, deleteCategory, 
    createProduct, updateProduct, deleteProduct,
    createModifierGroup, deleteModifierGroup 
} from '@/app/actions/menu-management';
import { InventoryItem, linkProductToIngredientsAction } from '@/app/actions/inventory';

type Product = {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
    categoryId: string;
    isHidden?: boolean;
    modifierLinks?: { modifierGroupId: string }[];
    productIngredients?: { inventoryItemId: string; quantityRequired: string }[];
};

type Category = {
    id: string;
    name: string;
    type: string;
    config?: string | null;
    products: Product[];
};

type ModifierGroup = {
    id: string;
    name: string;
    options: { id: string; name: string }[];
};

interface Props {
    initialCategories: Category[];
    modifierGroups: ModifierGroup[];
    inventoryItems: InventoryItem[];
    branchId: string;
}

export default function MenuManagementClient({ initialCategories, modifierGroups, inventoryItems, branchId }: Props) {
    const [activeTab, setActiveTab] = useState<'menu' | 'modifiers'>('menu');
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(initialCategories.map(c => c.id));
    
    // Modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    
    // Editing states
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [editingIngredients, setEditingIngredients] = useState<{ inventoryItemId: string; quantityRequired: number }[]>([]);

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const openProductModal = (product: Product | null, categoryId: string | null) => {
        setEditingProduct(product);
        setActiveCategoryId(categoryId);
        if (product && product.productIngredients) {
            setEditingIngredients(product.productIngredients.map(pi => ({
                inventoryItemId: pi.inventoryItemId,
                quantityRequired: parseFloat(pi.quantityRequired)
            })));
        } else {
            setEditingIngredients([]);
        }
        setIsProductModalOpen(true);
    };

    const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const flow = formData.get('flow') as string;

        const config = JSON.stringify({ flow });

        if (editingCategory?.id) {
            await updateCategory(editingCategory.id, name, type, config);
        } else {
            await createCategory(name, type, config);
        }
        window.location.reload();
    };

    const handleDeleteCategory = async (id: string) => {
        if (confirm('Are you sure you want to delete this category? All products in it will be affected.')) {
            await deleteCategory(id);
            window.location.reload();
        }
    };

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const basePrice = formData.get('basePrice') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const categoryId = activeCategoryId || editingProduct?.categoryId;

        if (!categoryId) return;

        const isHidden = formData.get('isHidden') === 'on';

        const data = {
            categoryId,
            name,
            basePrice,
            imageUrl: imageUrl || undefined,
            modifierGroupIds: formData.getAll('modifierGroups') as string[],
            isHidden,
        };

        let productId = editingProduct?.id;

        if (editingProduct) {
            await updateProduct(editingProduct.id, data);
        } else {
            const newProduct = await createProduct(data);
            productId = newProduct.id;
        }

        // Save Ingredients
        const validIngredients = editingIngredients.filter(i => i.inventoryItemId && i.quantityRequired > 0);
        if (productId) {
            await linkProductToIngredientsAction(branchId, productId, validIngredients);
        }

        window.location.reload();
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
            window.location.reload();
        }
    };
    
    // ... helpers for ingredients ...
    const addIngredient = () => {
        setEditingIngredients([...editingIngredients, { inventoryItemId: '', quantityRequired: 0 }]);
    };
    const updateIngredient = (index: number, field: 'inventoryItemId' | 'quantityRequired', value: string | number) => {
        const newIngs = [...editingIngredients];
        // @ts-ignore
        newIngs[index][field] = value;
        setEditingIngredients(newIngs);
    };
    const removeIngredient = (index: number) => {
        setEditingIngredients(editingIngredients.filter((_, i) => i !== index));
    };

    const handleSaveModifier = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const optionsRaw = formData.get('options') as string;
        const options = optionsRaw.split(',').map(s => s.trim()).filter(s => s !== '');

        await createModifierGroup(name, options);
        window.location.reload();
    };

    const handleDeleteModifier = async (id: string) => {
        if (confirm('Are you sure? This will remove this modifier group from all products.')) {
            await deleteModifierGroup(id);
            window.location.reload();
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Menu Management</h1>
                    <p className="text-gray-500 mt-1">
                        Configure your digital menu, categories, and customization options.
                    </p>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setActiveTab('menu')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Menu & Categories
                    </button>
                    <button 
                        onClick={() => setActiveTab('modifiers')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'modifiers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Modifiers
                    </button>
                </div>
            </div>

            {activeTab === 'menu' ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setIsCategoryModalOpen(true);
                            }}
                            className="bg-[#D95D1E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#bf4f18] transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus size={20} />
                            Add Category
                        </button>
                    </div>

                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <div 
                                    className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer" 
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-1 rounded-md transition-transform ${expandedCategories.includes(category.id) ? 'rotate-0' : '-rotate-90'}`}>
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 border border-gray-200 px-1.5 rounded">
                                                    {category.type}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {category.products.length} products
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => openProductModal(null, category.id)}
                                            className="p-2.5 text-gray-500 hover:text-[#D95D1E] hover:bg-orange-50 rounded-xl transition-all"
                                            title="Add Product"
                                        >
                                            <Plus size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingCategory(category);
                                                setIsCategoryModalOpen(true);
                                            }}
                                            className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {expandedCategories.includes(category.id) && (
                                    <div className="bg-gray-50/30 border-t border-gray-100">
                                        {category.products.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-gray-400 italic text-sm mb-4">No products in this category yet.</p>
                                                <button 
                                                    onClick={() => openProductModal(null, category.id)}
                                                    className="inline-flex items-center gap-2 text-[#D95D1E] font-medium hover:underline text-sm"
                                                >
                                                    <Plus size={16} />
                                                    Create your first product
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {category.products.map((product) => (
                                                    <div key={product.id} className="p-4 pl-14 flex items-center justify-between hover:bg-white transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                                                                {product.imageUrl ? (
                                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon size={24} className="text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-sm text-[#D95D1E] font-bold">₱{product.basePrice}</p>
                                                                    {product.modifierLinks && product.modifierLinks.length > 0 && (
                                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                                                                            {product.modifierLinks.length} Modifiers
                                                                        </span>
                                                                    )}
                                                                    {product.isHidden && (
                                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                                                                            Hidden
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <button
                                                                onClick={() => openProductModal(product, category.id)}
                                                                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Modifier Groups</h2>
                            <p className="text-sm text-gray-500">Create global options like "Size", "Sugar Level", or "Add-ons".</p>
                        </div>
                        <button
                            onClick={() => setIsModifierModalOpen(true)}
                            className="bg-[#D95D1E] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#bf4f18] transition-all shadow-md active:scale-95"
                        >
                            <Plus size={20} />
                            Add Group
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modifierGroups.length === 0 ? (
                            <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Settings2 size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-gray-900 font-bold mb-1">No Modifiers Yet</h3>
                                <p className="text-gray-500 text-sm max-w-xs mx-auto">Create modifier groups to allow customers to customize their orders.</p>
                            </div>
                        ) : (
                            modifierGroups.map((group) => (
                                <div key={group.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 truncate pr-10">{group.name}</h3>
                                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">
                                                {group.options.length} OPTIONS
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteModifier(group.id)}
                                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.options.map((opt) => (
                                            <span key={opt.id} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100">
                                                {opt.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modals - using a unified glass background */}
            {(isCategoryModalOpen || isProductModalOpen || isModifierModalOpen) && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] transition-all animate-in fade-in duration-200" />
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {editingCategory ? 'Edit Category' : 'New Category'}
                            </h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Internal Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingCategory?.name}
                                    required
                                    autoFocus
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all text-lg font-medium"
                                    placeholder="e.g. Signature Coffees"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Display Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['drink', 'snack', 'meal'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                const form = document.querySelector('form') as HTMLFormElement;
                                                const select = form.querySelector('select[name="type"]') as HTMLSelectElement;
                                                select.value = type;
                                                // Trigger reactive update if needed, but here we just manually style for now
                                                setEditingCategory(prev => prev ? { ...prev, type } : { id: '', name: '', type, products: [] });
                                            }}
                                            className={`py-3 px-4 rounded-xl text-sm font-bold capitalize transition-all border ${editingCategory?.type === type || (!editingCategory && type === 'drink') ? 'bg-[#D95D1E] border-[#D95D1E] text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                    <select name="type" className="hidden" defaultValue={editingCategory?.type || 'drink'}>
                                        <option value="drink">drink</option>
                                        <option value="snack">snack</option>
                                        <option value="meal">meal</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Customization Flow</label>
                                <div className="space-y-2">
                                    {[
                                        { id: 'drink_full', name: 'Standard Drink', desc: 'Size → Add-ons → Toppings' },
                                        { id: 'simple_choice', name: 'Simple Pick', desc: 'Just list the items with prices' },
                                        { id: 'fixed_meal', name: 'Meal Set', desc: 'Main Choice → Side → Drinks' },
                                    ].map((f) => {
                                        const currentFlow = editingCategory?.config ? JSON.parse(editingCategory.config).flow : 'drink_full';
                                        return (
                                            <label key={f.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${currentFlow === f.id ? 'bg-orange-50 border-[#D95D1E]' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="flow" 
                                                    value={f.id} 
                                                    defaultChecked={currentFlow === f.id}
                                                    className="w-4 h-4 text-[#D95D1E] focus:ring-[#D95D1E]"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{f.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-medium">{f.desc}</div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#bf4f18] transition-all active:scale-95"
                                >
                                    {editingCategory ? 'Update Changes' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white z-20">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <p className="text-sm text-gray-400 font-medium">Configure product details and modifiers.</p>
                            </div>
                            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveProduct} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Display Name</label>
                                        <input
                                            name="name"
                                            type="text"
                                            defaultValue={editingProduct?.name}
                                            required
                                            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-semibold"
                                            placeholder="Caramel Macchiato"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price (PHP)</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                                            <input
                                                name="basePrice"
                                                type="number"
                                                step="0.01"
                                                defaultValue={editingProduct?.basePrice}
                                                required
                                                className="w-full pl-10 pr-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-bold"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Display Visibility</label>
                                        <label className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl cursor-pointer hover:bg-white transition-all border border-transparent hover:border-gray-100">
                                            <input 
                                                name="isHidden" 
                                                type="checkbox" 
                                                defaultChecked={editingProduct?.isHidden}
                                                className="w-5 h-5 rounded-lg border-gray-300 text-[#D95D1E] focus:ring-[#D95D1E]" 
                                            />
                                            <span className="text-sm font-semibold text-gray-600">Hide from Customer Menu</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Cover Image</label>
                                    <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 group hover:border-[#D95D1E]/30 transition-all cursor-pointer overflow-hidden relative">
                                        {editingProduct?.imageUrl ? (
                                            <img src={editingProduct.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                        ) : (
                                            <>
                                                <ImageIcon size={32} className="text-gray-300 mb-2 group-hover:text-[#D95D1E]/50" />
                                                <p className="text-[10px] text-gray-400 text-center px-4">Cloudflare R2 storage coming soon</p>
                                            </>
                                        )}
                                        <input 
                                            name="imageUrl" 
                                            type="text" 
                                            defaultValue={editingProduct?.imageUrl || ''} 
                                            className="absolute bottom-2 left-2 right-2 px-2 py-1.5 text-[10px] bg-white/90 backdrop-blur rounded-lg border border-gray-100 focus:outline-[#D95D1E]" 
                                            placeholder="Paste image URL here..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Linked Modifiers</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {modifierGroups.length === 0 ? (
                                        <p className="col-span-full text-xs text-gray-400 italic bg-gray-50 p-6 rounded-2xl text-center border border-dashed border-gray-200">
                                            Go to the 'Modifiers' tab to create your first customization group.
                                        </p>
                                    ) : (
                                        modifierGroups.map((group) => {
                                            const isChecked = editingProduct?.modifierLinks?.some(link => link.modifierGroupId === group.id);
                                            return (
                                                <label key={group.id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-white hover:border-[#D95D1E]/20 transition-all group">
                                                    <input
                                                        type="checkbox"
                                                        name="modifierGroups"
                                                        value={group.id}
                                                        defaultChecked={isChecked}
                                                        className="w-5 h-5 rounded-lg border-gray-300 text-[#D95D1E] focus:ring-[#D95D1E]"
                                                    />
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{group.name}</span>
                                                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter mt-0.5">
                                                            {group.options.length} OPTIONS
                                                        </p>
                                                    </div>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Recipe / Ingredients</label>
                                <div className="space-y-3">
                                    {editingIngredients.map((ing, index) => (
                                        <div key={index} className="flex gap-3 items-center">
                                            <div className="flex-1">
                                                <select
                                                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#D95D1E] text-sm font-medium"
                                                    value={ing.inventoryItemId}
                                                    onChange={e => updateIngredient(index, 'inventoryItemId', e.target.value)}
                                                >
                                                    <option value="">Select Ingredient</option>
                                                    {inventoryItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Qty"
                                                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#D95D1E] text-sm font-medium"
                                                    value={ing.quantityRequired}
                                                    onChange={e => updateIngredient(index, 'quantityRequired', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(index)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addIngredient}
                                        className="flex items-center gap-2 text-sm font-bold text-[#D95D1E] hover:underline px-2 py-1"
                                    >
                                        <Plus size={16} />
                                        Add Ingredient
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-8 pb-4">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#bf4f18] transition-all active:scale-95"
                                >
                                    {editingProduct ? 'Save Product' : 'Add to Menu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modifier Modal */}
            {isModifierModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">New Modifier Group</h2>
                            <button onClick={() => setIsModifierModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveModifier} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Group Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all text-lg font-bold"
                                    placeholder="e.g. Milk Options"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Options (Comma separated)</label>
                                <textarea
                                    name="options"
                                    required
                                    rows={3}
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#D95D1E] transition-all font-medium resize-none"
                                    placeholder="Whole Milk, Oat Milk, Soy Milk, No Milk"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-tighter">Tip: Separation is done by commas.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModifierModalOpen(false)}
                                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-[#D95D1E] text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#bf4f18] transition-all active:scale-95"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

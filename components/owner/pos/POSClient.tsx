'use client';

import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, X, CreditCard, Banknote, HelpCircle, UtensilsCrossed, Tag, Info, Package, Search, Bell, CheckCircle } from 'lucide-react';
import { createPOSOrderAction } from '@/app/actions/orders';
import { useOrder } from '@/context/OrderContext';

export type Product = {
    id: string;
    categoryId: string;
    name: string;
    basePrice: string | number;
    imageUrl: string | null;
    isHidden: boolean;
    isFeatured: boolean;
};

export type Category = {
    id: string;
    name: string;
    type: string;
    products: Product[];
};

type CartItem = {
    uniqueId: string;
    productId: string | null;
    customName: string | null;
    name: string;
    price: number;
    quantity: number;
};

const DISCOUNTS = [
    { name: 'None', type: 'PERCENT', value: 0 },
    { name: 'PWD', type: 'PERCENT', value: 20 },
    { name: 'Senior Citizen', type: 'PERCENT', value: 20 },
    { name: 'House (10%)', type: 'PERCENT', value: 10 },
    { name: 'Employee', type: 'PERCENT', value: 50 },
];

export function POSClient({ categories, branchId }: { categories: Category[], branchId: string }) {
    const { activeOrders, updateOrderStatus, updateOrderPaymentStatus, updateOrder } = useOrder();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [discountName, setDiscountName] = useState<string>('None');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'PAYMAYA'>('CASH');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ad-Hoc Modal State
    const [showAdHocModal, setShowAdHocModal] = useState(false);
    const [showIncomingModal, setShowIncomingModal] = useState(false);
    const [incomingTab, setIncomingTab] = useState<'PENDING' | 'UNPAID'>('PENDING');
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [adHocName, setAdHocName] = useState('');
    const [adHocPrice, setAdHocPrice] = useState('');

    const pendingOrders = activeOrders.filter(o => o.status === 'PENDING');
    const unpaidOrders = activeOrders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'PENDING' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

    const filteredCategories = useMemo(() => {
        return categories.map(cat => {
            const products = cat.products.filter(p => !p.isHidden && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            return { ...cat, products };
        }).filter(cat => cat.products.length > 0);
    }, [categories, searchQuery]);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, {
                uniqueId: Math.random().toString(36).substring(7),
                productId: product.id,
                customName: null,
                name: product.name,
                price: parseFloat(product.basePrice.toString()),
                quantity: 1
            }];
        });
    };

    const addAdHocItem = () => {
        if (!adHocName.trim() || !adHocPrice || isNaN(parseFloat(adHocPrice))) return;
        setCart(prev => [...prev, {
            uniqueId: Math.random().toString(36).substring(7),
            productId: null,
            customName: adHocName.trim(),
            name: adHocName.trim() + ' (Custom)',
            price: parseFloat(adHocPrice),
            quantity: 1
        }]);
        setShowAdHocModal(false);
        setAdHocName('');
        setAdHocPrice('');
    };

    const updateQuantity = (uniqueId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const removeItem = (uniqueId: string) => {
        setCart(prev => prev.filter(item => item.uniqueId !== uniqueId));
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

    const discountAmount = useMemo(() => {
        const discount = DISCOUNTS.find(d => d.name === discountName);
        if (!discount || discount.value === 0) return 0;
        return subtotal * (discount.value / 100);
    }, [subtotal, discountName]);

    const total = subtotal - discountAmount;

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingOrderId) {
                // Keep the current status unless we want to bump it, for now we will just use PREPARING
                const res = await updateOrder(editingOrderId, cart.map(item => ({
                    ...item,
                    productId: item.productId,
                    customName: item.customName,
                    quantity: item.quantity,
                    price: item.price,
                })), total, paymentMethod, 'UNPAID', 'PREPARING', undefined);

                if (res.success) {
                    alert('Order updated successfully!');
                    setCart([]);
                    setDiscountName('None');
                    setPaymentMethod('CASH');
                    setEditingOrderId(null);
                } else {
                    alert('Failed to update order');
                }
            } else {
                const res = await createPOSOrderAction({
                branchId,
                items: cart.map(item => ({
                    productId: item.productId,
                    customName: item.customName,
                    quantity: item.quantity,
                    priceAtTime: item.price
                })),
                subtotalAmount: subtotal,
                discountAmount: discountAmount,
                discountName: discountName === 'None' ? null : discountName,
                totalAmount: total,
                paymentMethod
            });

            if (res.success) {
                alert('Order completed successfully!');
                setCart([]);
                setDiscountName('None');
                setPaymentMethod('CASH');
                setEditingOrderId(null);
            } else {
                alert(res.error || 'Failed to complete order');
            }
            }
        } catch (err) {
            alert('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditOrder = (order: any) => {
        setCart(order.items.map((item: any) => ({
            uniqueId: Math.random().toString(36).substring(7),
            productId: item.productId,
            customName: item.name.includes('(Custom)') ? item.name.replace(' (Custom)', '') : null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            options: item.options
        })));
        setPaymentMethod(order.paymentMethod || 'CASH');
        setEditingOrderId(order.id);
        setShowIncomingModal(false);
    };

    const cancelEdit = () => {
        setCart([]);
        setPaymentMethod('CASH');
        setEditingOrderId(null);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-screen overflow-hidden bg-gray-50">
            {/* Left Side: Menu Grid */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                <div className="p-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UtensilsCrossed className="text-[#D95D1E]" />
                        Point of Sale
                    </h1>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D95D1E] focus:ring-1 focus:ring-[#D95D1E] transition-all"
                            />
                        </div>
                        
                        <button 
                            onClick={() => setShowIncomingModal(true)}
                            className="relative flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 font-bold rounded-lg transition-colors whitespace-nowrap"
                        >
                            <Bell size={18} />
                            Orders Data
                            {(pendingOrders.length > 0 || unpaidOrders.length > 0) && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-xs shadow-sm px-1">
                                    {pendingOrders.length + unpaidOrders.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-white border-b border-gray-200 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                const el = document.getElementById(`category-${cat.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl whitespace-nowrap text-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
                    {filteredCategories.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 pb-10">
                            <Search size={40} className="opacity-20 mb-2" />
                            <p>No products found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        filteredCategories.map(cat => (
                            <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 px-1">{cat.name}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {cat.products.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D95D1E] hover:shadow-md transition-all text-left flex flex-col gap-2 group"
                                        >
                                            <div className="aspect-square bg-gray-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden w-full">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <Package className="text-gray-300 w-12 h-12" />
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
                                            <div className="mt-auto pt-2">
                                                <span className="text-[#D95D1E] font-bold">{formatCurrency(parseFloat(product.basePrice.toString()))}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Cart Sidebar */}
            <div className="w-full md:w-[400px] bg-white flex flex-col shrink-0 relative z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[#D95D1E]" />
                        {editingOrderId ? 'Editing Order' : 'Current Order'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {editingOrderId && (
                            <button onClick={cancelEdit} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200 transition-colors">
                                Cancel
                            </button>
                        )}
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">{cart.length} items</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.uniqueId} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-gray-900 text-sm pe-4">{item.name}</span>
                                <button onClick={() => removeItem(item.uniqueId)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex justify-between items-center text-[#D95D1E] font-bold text-sm">
                                <span>{formatCurrency(item.price)}</span>
                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                    <button onClick={() => updateQuantity(item.uniqueId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 hover:text-[#D95D1E]"><Minus size={14} /></button>
                                    <span className="text-gray-900 font-semibold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.uniqueId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 hover:text-[#D95D1E]"><Plus size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 pb-10 mt-10">
                            <ShoppingCart size={40} className="opacity-20 mb-2" />
                            <p>No items added yet</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-4">
                    <button 
                        onClick={() => setShowAdHocModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 border-dashed rounded-xl text-sm font-semibold text-gray-700 hover:border-[#D95D1E] hover:text-[#D95D1E] transition-all"
                    >
                        <Plus size={16} />
                        Add Custom / Ad-Hoc Item
                    </button>

                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                            <Tag size={18} className="text-gray-500" />
                            <select 
                                value={discountName} 
                                onChange={(e) => setDiscountName(e.target.value)}
                                className="flex-1 bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 text-gray-900 font-medium focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E] outline-none"
                            >
                                {DISCOUNTS.map(d => (
                                    <option key={d.name} value={d.name}>
                                        {d.name} {d.value > 0 ? `(${d.value}%)` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${paymentMethod === 'CASH' ? 'border-[#D95D1E] bg-orange-50 text-[#D95D1E]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                                <Banknote size={18} className="mb-1" />
                                <span className="text-[10px] font-bold">CASH</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('GCASH')}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${paymentMethod === 'GCASH' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CreditCard size={18} className="mb-1" />
                                <span className="text-[10px] font-bold">GCASH</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('PAYMAYA')}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${paymentMethod === 'PAYMAYA' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                            >
                                <CreditCard size={18} className="mb-1" />
                                <span className="text-[10px] font-bold">PAYMAYA</span>
                            </button>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount ({discountName})</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2 pb-2">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-black text-[#D95D1E]">{formatCurrency(total)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isSubmitting}
                                className={`w-full py-3.5 ${editingOrderId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'} text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                            >
                                {isSubmitting ? 'Processing...' : (editingOrderId ? `Update Order ${formatCurrency(total)}` : `Charge ${formatCurrency(total)}`)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ad-Hoc Modal */}
            {showAdHocModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <HelpCircle size={18} className="text-[#D95D1E]" />
                                Add Custom Item
                            </h3>
                            <button onClick={() => setShowAdHocModal(false)} className="text-gray-400 hover:text-gray-900 p-1">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Item Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Special Request"
                                    value={adHocName}
                                    onChange={e => setAdHocName(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Price (PHP)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={adHocPrice}
                                    onChange={e => setAdHocPrice(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E] transition-all"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={addAdHocItem}
                                    disabled={!adHocName.trim() || !adHocPrice}
                                    className="w-full py-2.5 bg-[#D95D1E] hover:bg-[#c25016] text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Add to Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Incoming Orders Modal */}
            {showIncomingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                    <Bell size={20} className="text-yellow-600" />
                                    Orders Dashboard
                                </h3>
                                <button onClick={() => setShowIncomingModal(false)} className="text-gray-400 hover:text-gray-900 p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex border-b border-gray-200 -mx-4 px-4">
                                <button 
                                    className={`pb-2 px-1 mr-6 font-bold text-sm border-b-2 transition-colors ${incomingTab === 'PENDING' ? 'border-[#D95D1E] text-[#D95D1E]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setIncomingTab('PENDING')}
                                >
                                    Incoming ({pendingOrders.length})
                                </button>
                                <button 
                                    className={`pb-2 px-1 font-bold text-sm border-b-2 transition-colors ${incomingTab === 'UNPAID' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setIncomingTab('UNPAID')}
                                >
                                    Unpaid Active ({unpaidOrders.length})
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/50 space-y-4">
                            {(incomingTab === 'PENDING' ? pendingOrders : unpaidOrders).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <CheckCircle size={48} className="mb-4 text-emerald-300 opacity-50" />
                                    <p className="font-medium text-gray-500">No {incomingTab === 'PENDING' ? 'incoming' : 'unpaid'} orders right now!</p>
                                </div>
                            ) : (
                                (incomingTab === 'PENDING' ? pendingOrders : unpaidOrders).map((order: any) => (
                                    <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                                <span className="font-black text-xl text-gray-900">#{order.orderNumber}</span>
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">{order.table}</span>
                                                <span className="text-gray-400 text-sm ml-auto">
                                                    {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            {order.note && (
                                                <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm mb-3 border border-yellow-200">
                                                    <span className="font-bold block text-xs uppercase mb-1">Note:</span>
                                                    {order.note}
                                                </div>
                                            )}
                                            
                                            <div className="space-y-2 mb-3">
                                                {order.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                                        <div className="flex justify-between items-start text-sm gap-2">
                                                            <div className="flex gap-2 flex-1 min-w-0">
                                                                <span className="font-bold text-gray-900 shrink-0">{item.quantity}x</span>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-gray-800 font-medium leading-tight">{item.name}</span>
                                                                    {item.options && Object.keys(item.options).length > 0 && (
                                                                        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1">
                                                                            {Object.entries(item.options).map(([key, value]) => {
                                                                                if (key === 'tag' || key === 'bundleLabel') return null;
                                                                                return (
                                                                                    <span
                                                                                        key={key}
                                                                                        className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-gray-200"
                                                                                    >
                                                                                        {key}: {String(value)}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                            {item.options.tag === 'TOGETHER' && (
                                                                                <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-purple-100">
                                                                                    Together
                                                                                </span>
                                                                            )}
                                                                            {item.options.bundleLabel && (
                                                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-indigo-100">
                                                                                    {item.options.bundleLabel}
                                                                                </span>
                                                                            )}
                                                                            {item.options.tag === 'EXTRA' && (
                                                                                <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-pink-100">
                                                                                    + Extra
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-500 font-medium shrink-0">₱{(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                <span className="text-gray-600 font-medium text-sm">Total</span>
                                                <span className="font-bold text-[#D95D1E] text-lg">₱{order.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full md:w-48 flex flex-col gap-3 shrink-0 justify-end border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-3 md:mt-0">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Payment Status</label>
                                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                                    <button 
                                                        onClick={() => updateOrderPaymentStatus(order.id, 'UNPAID')}
                                                        className={`flex-1 py-1.5 text-xs font-bold transition-colors ${order.paymentStatus !== 'PAID' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    >
                                                        UNPAID
                                                    </button>
                                                    <div className="w-px bg-gray-200"></div>
                                                    <button 
                                                        onClick={() => {
                                                            updateOrderPaymentStatus(order.id, 'PAID');
                                                            if (incomingTab === 'UNPAID' && order.status === 'READY') {
                                                                updateOrderStatus(order.id, 'COMPLETED'); // Auto complete if paid and ready
                                                            }
                                                        }}
                                                        className={`flex-1 py-1.5 text-xs font-bold transition-colors ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    >
                                                        PAID
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleEditOrder(order)}
                                                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200 text-sm"
                                            >
                                                Edit / Add Items
                                            </button>

                                            {incomingTab === 'PENDING' && (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl mt-auto transition-colors shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    Approve to Kitchen
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

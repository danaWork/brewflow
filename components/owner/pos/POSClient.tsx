'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, X, CreditCard, Banknote, HelpCircle, UtensilsCrossed, Tag, Package, Search, Bell, CheckCircle, Pencil, Printer } from 'lucide-react';
import { createPOSOrderAction } from '@/app/actions/orders';
import { addCompanyPaymentMethodAction, getCompanyPaymentMethodsAction, removeCompanyPaymentMethodAction } from '@/app/actions/payment-methods';
import { useOrder } from '@/context/OrderContext';
import type { CartItem as OrderCartItem } from '@/context/CartContext';
import { ProductAddModal } from './ProductAddModal';
import { buildReceiptEscPosFromOrder } from '@/lib/receipt-thermal';
import { connectAndPrint, isBluetoothSupported } from '@/lib/bluetooth-thermal-print';

export type Product = {
    id: string;
    categoryId: string;
    name: string;
    basePrice: string | number;
    /** List price before per-product sale (optional, for display) */
    compareAtPrice?: number;
    saleLabel?: string | null;
    imageUrl: string | null;
    image?: string | null;
    isHidden: boolean;
    isFeatured: boolean;
    modifiers?: { id: string; name: string; displayMode: string; defaultModifierOptionId?: string | null; options: { id: string; name: string; price: number; image?: string | null }[] }[];
};

export type Category = {
    id: string;
    name: string;
    type: string;
    products: Product[];
};

type CartItemExtra = { productId: string; name: string; price: number; quantity: number; options?: Record<string, any>; tag?: string };
type CartItem = {
    uniqueId: string;
    productId: string | null;
    customName: string | null;
    name: string;
    price: number;
    quantity: number;
    itemDiscountType?: 'PERCENTAGE' | 'FIXED';
    itemDiscountValue?: number;
    options?: Record<string, any>;
    extras?: CartItemExtra[];
    bundleLabel?: string;
    tag?: string;
};

function effectiveItemPrice(item: CartItem): number {
    const raw = Number(item.itemDiscountValue ?? 0);
    if (!Number.isFinite(raw) || raw <= 0) return item.price;

    if (item.itemDiscountType === 'PERCENTAGE') {
        const pct = Math.min(100, raw);
        return Math.max(0, item.price * (1 - pct / 100));
    }

    return Math.max(0, item.price - raw);
}

const DISCOUNTS = [
    { name: 'None', type: 'PERCENT', value: 0 },
    { name: 'PWD', type: 'PERCENT', value: 10 },
    { name: 'Senior Citizen', type: 'PERCENT', value: 20 },
    { name: 'House (10%)', type: 'PERCENT', value: 10 },
    { name: 'Employee', type: 'PERCENT', value: 50 },
];

type PromotionForPOS = {
  id: string;
  name: string;
  type: string;
  triggerType: string;
  triggerValue: string;
  discountType: string;
  discountValue: string | number;
  isActive?: boolean;
  items?: { productId: string }[];
};

export function POSClient({
  categories,
  branchId,
  promotions = [],
  productIdToCategoryType = {},
  initialPaymentMethods = ['CASH', 'GCASH', 'PAYMAYA'],
}: {
  categories: Category[];
  branchId: string;
  promotions?: PromotionForPOS[];
  productIdToCategoryType?: Record<string, string>;
  initialPaymentMethods?: string[];
}) {
    const { activeOrders, updateOrderStatus, updateOrderPaymentStatus, updateOrder } = useOrder();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [discountName, setDiscountName] = useState<string>('None');
    const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>(initialPaymentMethods[0] || 'CASH');
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [isSavingPaymentMethod, setIsSavingPaymentMethod] = useState(false);
    const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
    const [showPaymentMethodsManager, setShowPaymentMethodsManager] = useState(false);
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ad-Hoc Modal State
    const [showAdHocModal, setShowAdHocModal] = useState(false);
    const [showIncomingModal, setShowIncomingModal] = useState(false);
    const [incomingTab, setIncomingTab] = useState<'PENDING' | 'UNPAID'>('PENDING');
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [adHocName, setAdHocName] = useState('');
    const [adHocPrice, setAdHocPrice] = useState('');
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [productModalProduct, setProductModalProduct] = useState<Product | null>(null);
    const [editingCartItemUniqueId, setEditingCartItemUniqueId] = useState<string | null>(null);
    const [discountEditorOpenById, setDiscountEditorOpenById] = useState<Record<string, boolean>>({});
    const [cancelOrderModal, setCancelOrderModal] = useState<{ id: string; orderNumber: number; table: string } | null>(null);
    const [cancelOrderReason, setCancelOrderReason] = useState('');
    const [receiptModal, setReceiptModal] = useState<{
        orderNumber: number;
        table: string;
        paymentMethod: string;
        timestamp: Date;
        total: number;
        items: { name: string; price: number; quantity: number; options?: Record<string, unknown>; extras?: { name: string; price: number; quantity?: number }[] }[];
        discountName?: string | null;
        discountAmount?: number;
        cancellationReason?: string | null;
    } | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('pos_cart');
            const savedDiscount = localStorage.getItem('pos_discount');
            const savedPayment = localStorage.getItem('pos_payment');
            const savedCash = localStorage.getItem('pos_cash');

            if (savedCart) setCart(JSON.parse(savedCart));
            if (savedDiscount) setDiscountName(savedDiscount);
            if (savedPayment) setPaymentMethod(savedPayment);
            if (savedCash) setCashReceived(savedCash);
        } catch (e) {
            console.error('Failed to load POS state from local storage', e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        try {
            localStorage.setItem('pos_cart', JSON.stringify(cart));
            localStorage.setItem('pos_discount', discountName);
            localStorage.setItem('pos_payment', paymentMethod);
            localStorage.setItem('pos_cash', cashReceived);
        } catch (e) {
            console.error('Failed to save POS state to local storage', e);
        }
    }, [cart, discountName, paymentMethod, cashReceived, isInitialized]);

    useEffect(() => {
        const fallback = initialPaymentMethods.map((name, idx) => ({
            id: `fallback-${idx}`,
            name,
        }));
        setPaymentMethods(fallback);
    }, [initialPaymentMethods]);

    useEffect(() => {
        (async () => {
            setIsLoadingPaymentMethods(true);
            const result = await getCompanyPaymentMethodsAction();
            if (result.success) {
                setPaymentMethods(result.methods);
                if (!result.methods.find((m) => m.name === paymentMethod)) {
                    setPaymentMethod(result.methods[0]?.name || 'CASH');
                }
            }
            setIsLoadingPaymentMethods(false);
        })();
    }, []);

    const pendingOrders = activeOrders.filter(o => o.status === 'PENDING');
    const unpaidOrders = activeOrders.filter(o => o.paymentStatus === 'UNPAID' && o.status !== 'PENDING' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

    const filteredCategories = useMemo(() => {
        return categories.map(cat => {
            const products = cat.products.filter(p => !p.isHidden && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
            return { ...cat, products };
        }).filter(cat => cat.products.length > 0);
    }, [categories, searchQuery]);

    const addToCart = (product: Product, payload?: { price: number; quantity: number; options?: Record<string, unknown> }) => {
        const price = payload ? payload.price : parseFloat(product.basePrice.toString());
        const quantity = payload?.quantity ?? 1;
        const options = payload?.options;

        setCart(prev => {
            const matchKey = options ? JSON.stringify(options) : null;
            const existing = prev.find(
                item => item.productId === product.id && (matchKey ? JSON.stringify(item.options || {}) === matchKey : !item.options || Object.keys(item.options).length === 0)
            );
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id && (matchKey ? JSON.stringify(item.options || {}) === matchKey : !item.options || Object.keys(item.options).length === 0)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, {
                uniqueId: Math.random().toString(36).substring(7),
                productId: product.id,
                customName: null,
                name: product.name,
                price,
                quantity,
                options: options && Object.keys(options).length > 0 ? options : undefined,
            }];
        });
        setCartDrawerOpen(true);
    };

    const handleProductClick = (product: Product) => {
        if (product.modifiers && product.modifiers.length > 0) {
            setProductModalProduct(product);
        } else {
            addToCart(product);
        }
    };

    const getProductById = (productId: string): Product | undefined => {
        for (const cat of categories) {
            const p = cat.products.find((pr) => pr.id === productId);
            if (p) return p;
        }
        return undefined;
    };

    const handleProductModalAdd = (payload: { productId: string; name: string; price: number; quantity: number; options?: Record<string, unknown> }) => {
        if (!productModalProduct) return;
        if (editingCartItemUniqueId) {
            setCart((prev) => {
                const editingItem = prev.find((i) => i.uniqueId === editingCartItemUniqueId);
                const without = prev.filter((i) => i.uniqueId !== editingCartItemUniqueId);
                return [
                    ...without,
                    {
                        uniqueId: Math.random().toString(36).substring(7),
                        productId: productModalProduct.id,
                        customName: null,
                        name: payload.name,
                        price: payload.price,
                        quantity: payload.quantity,
                        itemDiscountType: editingItem?.itemDiscountType,
                        itemDiscountValue: editingItem?.itemDiscountValue,
                        options: payload.options && Object.keys(payload.options).length > 0 ? payload.options : undefined,
                    },
                ];
            });
            setEditingCartItemUniqueId(null);
        } else {
            addToCart(productModalProduct, { price: payload.price, quantity: payload.quantity, options: payload.options });
        }
        setProductModalProduct(null);
    };

    const openEditCartItem = (item: CartItem) => {
        if (!item.productId) return;
        const product = getProductById(item.productId);
        if (!product) return;
        setProductModalProduct(product);
        setEditingCartItemUniqueId(item.uniqueId);
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
        setDiscountEditorOpenById((prev) => {
            const next = { ...prev };
            delete next[uniqueId];
            return next;
        });
    };

    const toggleDiscountEditor = (uniqueId: string) => {
        setDiscountEditorOpenById((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
    };

    const updateItemDiscount = (
        uniqueId: string,
        type: 'PERCENTAGE' | 'FIXED',
        value: number | undefined,
    ) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                if (value == null || !Number.isFinite(value) || value <= 0) {
                    return { ...item, itemDiscountType: undefined, itemDiscountValue: undefined };
                }
                return { ...item, itemDiscountType: type, itemDiscountValue: value };
            }),
        );
    };

    const clearItemDiscount = (uniqueId: string) => {
        updateItemDiscount(uniqueId, 'PERCENTAGE', undefined);
    };

    const refreshPaymentMethods = async () => {
        const result = await getCompanyPaymentMethodsAction();
        if (!result.success) return;
        setPaymentMethods(result.methods);
        if (!result.methods.find((m) => m.name === paymentMethod)) {
            setPaymentMethod(result.methods[0]?.name || 'CASH');
        }
    };

    const handleAddPaymentMethod = async () => {
        const name = newPaymentMethod.trim();
        if (!name) return;
        setIsSavingPaymentMethod(true);
        const result = await addCompanyPaymentMethodAction(name);
        if (!result.success) {
            toast.error(result.error || 'Failed to add payment method');
            setIsSavingPaymentMethod(false);
            return;
        }
        setNewPaymentMethod('');
        await refreshPaymentMethods();
        toast.success('Payment method added');
        setIsSavingPaymentMethod(false);
    };

    const handleRemovePaymentMethod = async (methodId: string, methodName: string) => {
        setIsSavingPaymentMethod(true);
        const result = await removeCompanyPaymentMethodAction(methodId);
        if (!result.success) {
            toast.error(result.error || 'Failed to remove payment method');
            setIsSavingPaymentMethod(false);
            return;
        }
        await refreshPaymentMethods();
        toast.success(`${methodName} removed`);
        setIsSavingPaymentMethod(false);
    };

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (effectiveItemPrice(item) * item.quantity), 0), [cart]);
    const listSubtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
    const itemDiscountsTotal = useMemo(
        () =>
            cart.reduce((sum, item) => {
                const itemDiscount = Math.max(0, item.price - effectiveItemPrice(item));
                return sum + itemDiscount * item.quantity;
            }, 0),
        [cart],
    );

    const cartProductIds = useMemo(() => cart.filter(i => i.productId).map(i => i.productId as string), [cart]);

    const appliedPromotion = useMemo(() => {
        for (const promo of promotions) {
            if (promo.isActive === false) continue;
            if (promo.type === 'PERFECT_PAIR') {
                const hasTrigger = cartProductIds.includes(promo.triggerValue);
                const promotionProductIds = (promo.items || []).map((i: { productId: string }) => i.productId);
                const hasPromoItem = promotionProductIds.some((id: string) => cartProductIds.includes(id));
                if (hasTrigger && hasPromoItem) return promo;
            } else if (promo.type === 'CROSS_SELL') {
                const cartCategoryTypes = cartProductIds.map((id: string) => productIdToCategoryType[id]).filter(Boolean);
                if (cartCategoryTypes.includes(promo.triggerValue)) return promo;
            }
        }
        return null;
    }, [promotions, cartProductIds, productIdToCategoryType]);

    const promotionDiscountAmount = useMemo(() => {
        if (!appliedPromotion) return 0;
        const value = parseFloat(String(appliedPromotion.discountValue));
        if (appliedPromotion.discountType === 'PERCENTAGE') return subtotal * (value / 100);
        return Math.min(value, subtotal);
    }, [appliedPromotion, subtotal]);

    const manualDiscountAmount = useMemo(() => {
        const discount = DISCOUNTS.find(d => d.name === discountName);
        if (!discount || discount.value === 0) return 0;
        return subtotal * (discount.value / 100);
    }, [subtotal, discountName]);

    const isManualDiscountApplied = discountName !== 'None';
    const discountAmount = (appliedPromotion ? promotionDiscountAmount : 0) + (isManualDiscountApplied ? manualDiscountAmount : 0);
    let discountNameDisplay = 'None';
    if (appliedPromotion && isManualDiscountApplied) discountNameDisplay = `${appliedPromotion.name} & ${discountName}`;
    else if (appliedPromotion) discountNameDisplay = appliedPromotion.name;
    else if (isManualDiscountApplied) discountNameDisplay = discountName;
    const total = Math.max(0, subtotal - discountAmount);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Add at least one item to the order');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingOrderId) {
                const editingOrder = activeOrders.find(o => o.id === editingOrderId);
                const currentStatus = editingOrder?.status ?? 'PENDING';
                const currentPaymentStatus = editingOrder?.paymentStatus ?? 'UNPAID';
                const cartForUpdate = cart.map(item => ({
                    id: item.uniqueId,
                    productId: item.productId,
                    customName: item.customName ?? undefined,
                    name: item.name,
                    quantity: item.quantity,
                    price: effectiveItemPrice(item),
                    options: item.options,
                    extras: item.extras,
                    bundleLabel: item.bundleLabel,
                    tag: item.tag,
                })) as OrderCartItem[];
                const discountToSend = discountNameDisplay === 'None' ? null : discountNameDisplay;
                const res = await updateOrder(editingOrderId, cartForUpdate, subtotal, discountAmount, discountToSend, total, paymentMethod, currentPaymentStatus, currentStatus, undefined);

                if (res.success) {
                    toast.success('Order updated. Customer will see the changes.');
                    setCart([]);
                    setDiscountName('None');
                    setPaymentMethod(paymentMethods[0]?.name || 'CASH');
                    setCashReceived('');
                    setEditingOrderId(null);
                    setCartDrawerOpen(false);
                } else {
                    toast.error((res as { error?: string }).error || 'Failed to update order. Please try again.');
                }
            } else {
                const itemsToSend: { productId: string | null; customName: string | null; quantity: number; priceAtTime: number; customizations?: Record<string, unknown> }[] = [];
                cart.forEach(item => {
                    itemsToSend.push({
                        productId: item.productId,
                        customName: item.customName,
                        quantity: item.quantity,
                        priceAtTime: effectiveItemPrice(item),
                        customizations: item.options || item.bundleLabel || item.tag ? { ...item.options, bundleLabel: item.bundleLabel, tag: item.tag } : undefined,
                    });
                    (item.extras || []).forEach(extra => {
                        itemsToSend.push({
                            productId: extra.productId,
                            customName: null,
                            quantity: extra.quantity,
                            priceAtTime: extra.price,
                            customizations: { ...extra.options, tag: extra.tag || 'EXTRA' },
                        });
                    });
                });
                const res = await createPOSOrderAction({
                    branchId,
                    items: itemsToSend,
                    subtotalAmount: subtotal,
                    discountAmount: discountAmount,
                    discountName: discountNameDisplay === 'None' ? null : discountNameDisplay,
                    totalAmount: total,
                    paymentMethod,
                });

                if (res.success && res.order) {
                    toast.success('Order placed successfully (Sent to Kitchen)');
                    // Set receipt modal with current order details before clearing state
                    setReceiptModal({
                        orderNumber: res.order.orderNumber,
                        table: res.order.tableId, // POS table ID or walk-in designator
                        paymentMethod,
                        timestamp: new Date(),
                        total,
                        items: cart.map(item => ({
                            name: item.name,
                            price: effectiveItemPrice(item),
                            quantity: item.quantity,
                            options: item.options,
                            extras: item.extras?.map(ex => ({ name: ex.name, price: ex.price, quantity: ex.quantity }))
                        })),
                        discountName: discountNameDisplay === 'None' ? null : discountNameDisplay,
                        discountAmount: discountAmount
                    });
                    setCart([]);
                    setDiscountName('None');
                    setPaymentMethod(paymentMethods[0]?.name || 'CASH');
                    setCashReceived('');
                    setEditingOrderId(null);
                    setCartDrawerOpen(false);
                } else {
                    toast.error(res.error || 'Failed to complete order. Please try again.');
                }
            }
        } catch (err) {
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditOrder = (order: any) => {
        setCart((order.items || []).map((item: any) => {
            const opts = item.options || {};
            return {
                uniqueId: Math.random().toString(36).substring(7),
                productId: item.productId,
                customName: item.name?.includes('(Custom)') ? item.name.replace(' (Custom)', '') : null,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                options: Object.keys(opts).length ? opts : undefined,
                extras: item.extras,
                bundleLabel: opts.bundleLabel,
                tag: opts.tag,
            };
        }));
        setPaymentMethod(order.paymentMethod || 'CASH');
        setEditingOrderId(order.id);
        setShowIncomingModal(false);
    };

    const cancelEdit = () => {
        setCart([]);
        setPaymentMethod(paymentMethods[0]?.name || 'CASH');
        setCashReceived('');
        setEditingOrderId(null);
    };

    const storeName = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_RECEIPT_STORE_NAME
        ? process.env.NEXT_PUBLIC_RECEIPT_STORE_NAME
        : 'BrewFlow';

    async function printReceipt(order: { orderNumber: number; items: { name: string; price: number; quantity: number; options?: Record<string, unknown>; extras?: { name: string; price: number; quantity?: number }[] }[]; total: number; table: string; paymentMethod: string; timestamp: Date; discountAmount?: number; discountName?: string | null }) {
        const receiptOrder = {
            orderNumber: order.orderNumber,
            items: order.items.map((item: any) => ({
                name: item.name ?? 'Unknown',
                price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
                quantity: item.quantity ?? 1,
                options: item.options,
                extras: item.extras?.map((ex: any) => ({ name: ex.name, price: ex.price, quantity: ex.quantity ?? 1 })),
            })),
            total: order.total,
            table: order.table,
            paymentMethod: order.paymentMethod,
            timestamp: order.timestamp instanceof Date ? order.timestamp : new Date(order.timestamp),
            discountAmount: order.discountAmount,
            discountName: order.discountName,
            cancellationReason: (order as any).cancellationReason,
        };
        const bytes = buildReceiptEscPosFromOrder(receiptOrder, { storeName });
        const result = await connectAndPrint(bytes);
        if (result.ok) {
            toast.success('Receipt sent to printer');
        } else {
            if (result.reason === 'unsupported') {
                toast.info('Receipt printing requires Chrome or Edge. Payment confirmed.');
            } else if (result.reason === 'cancelled') {
                toast.info('Printer not selected. Payment confirmed.');
            } else {
                toast.warning('Payment confirmed. Could not print receipt.');
            }
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    const resolveImageUrl = (url: string | null | undefined): string | null => {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith('/')) return typeof window !== 'undefined' ? `${window.location.origin}${trimmed}` : trimmed;
        return trimmed;
    };

    const productImageSrc = (product: Product): string | null => resolveImageUrl(product.image ?? product.imageUrl);

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-screen overflow-hidden bg-gray-50">
            {/* Mobile: Cart FAB */}
            <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-30 min-h-[48px] min-w-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#D95D1E] text-white font-bold shadow-lg hover:bg-[#c25016] transition-colors"
            >
                <ShoppingCart size={22} />
                <span>Cart</span>
                {cart.length > 0 && (
                    <span className="bg-white text-[#D95D1E] min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-black">
                        {cart.length}
                    </span>
                )}
            </button>

            {/* Mobile: Drawer backdrop */}
            <div
                aria-hidden
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${cartDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setCartDrawerOpen(false)}
            />

            {/* Left Side: Menu Grid */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                <div className="p-3 sm:p-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UtensilsCrossed className="text-[#D95D1E]" />
                        Point of Sale
                    </h1>
                    
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[140px] md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 md:py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#D95D1E] focus:ring-1 focus:ring-[#D95D1E] transition-all min-h-[44px]"
                            />
                        </div>
                        
                        <button 
                            type="button"
                            onClick={() => setShowIncomingModal(true)}
                            className="relative flex items-center gap-2 px-4 py-2.5 md:py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 font-bold rounded-lg transition-colors whitespace-nowrap min-h-[44px]"
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

                <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    {categories.map(cat => (
                        <button
                            type="button"
                            key={cat.id}
                            onClick={() => {
                                const el = document.getElementById(`category-${cat.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-4 py-2.5 min-h-[44px] rounded-xl whitespace-nowrap text-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                                            type="button"
                                            key={product.id}
                                            onClick={() => handleProductClick(product)}
                                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D95D1E] hover:shadow-md transition-all text-left flex flex-col gap-2 group"
                                        >
                                            <div className="relative aspect-square bg-gray-100 rounded-xl mb-2 w-full overflow-hidden">
                                                {productImageSrc(product) ? (
                                                    <Image
                                                        src={productImageSrc(product)!}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                                        unoptimized={productImageSrc(product)?.startsWith('/') === true}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Package className="text-gray-300 w-12 h-12" />
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
                                            <div className="mt-auto pt-2 flex flex-col gap-0.5">
                                                {product.compareAtPrice != null && product.compareAtPrice > parseFloat(String(product.basePrice)) && (
                                                    <span className="text-xs text-gray-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[#D95D1E] font-bold">{formatCurrency(parseFloat(product.basePrice.toString()))}</span>
                                                    {product.saleLabel ? (
                                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">{product.saleLabel}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Cart Sidebar (desktop) / Drawer (mobile) */}
            <div
                className={`fixed md:relative inset-y-0 right-0 w-full max-w-[400px] md:max-w-none md:w-[400px] bg-white flex flex-col z-50 md:z-10 shadow-2xl md:shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-out ${cartDrawerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
            >
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[#D95D1E]" />
                        {editingOrderId ? 'Editing Order' : 'Current Order'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCartDrawerOpen(false)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                            aria-label="Close cart"
                        >
                            <X size={20} />
                        </button>
                        {editingOrderId && (
                            <button type="button" onClick={cancelEdit} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200 transition-colors">
                                Cancel
                            </button>
                        )}
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">{cart.length} items</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.map((item) => {
                        const unitEffective = effectiveItemPrice(item);
                        const hasItemDiscount = unitEffective < item.price;
                        const discountType = item.itemDiscountType || 'PERCENTAGE';
                        const discountValue = item.itemDiscountValue ?? '';
                        const isDiscountEditorOpen = discountEditorOpenById[item.uniqueId] || false;

                        return (
                            <div key={item.uniqueId} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col min-w-0 flex-1 pe-2">
                                        <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                                        {item.options && Object.keys(item.options).length > 0 && (
                                            <div className="flex flex-wrap gap-x-1.5 gap-y-1 mt-1">
                                                {Object.entries(item.options).map(([key, value]) => {
                                                    if (key === 'tag' || key === 'bundleLabel') return null;
                                                    return (
                                                        <span key={key} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-gray-200">
                                                            {key}: {String(value)}
                                                        </span>
                                                    );
                                                })}
                                                {item.options.tag === 'TOGETHER' && (
                                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-purple-100">Together</span>
                                                )}
                                                {item.options.bundleLabel && (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-indigo-100">{item.options.bundleLabel}</span>
                                                )}
                                                {item.options.tag === 'EXTRA' && (
                                                    <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-pink-100">+ Extra</span>
                                                )}
                                            </div>
                                        )}
                                        {item.extras && item.extras.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.extras.map((ex, i) => (
                                                    <span key={i} className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded border border-pink-100">
                                                        + {ex.name} {ex.quantity > 1 ? `×${ex.quantity}` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {item.productId && getProductById(item.productId) && (
                                            <button
                                                type="button"
                                                onClick={() => openEditCartItem(item)}
                                                className="p-1.5 text-gray-500 hover:text-[#D95D1E] hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Edit toppings / options"
                                                aria-label="Edit toppings"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => removeItem(item.uniqueId)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[#D95D1E] font-bold text-sm">
                                    <div className="flex items-center gap-2">
                                        {hasItemDiscount && (
                                            <span className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}</span>
                                        )}
                                        <span>{formatCurrency(unitEffective)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                        <button type="button" onClick={() => updateQuantity(item.uniqueId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 hover:text-[#D95D1E]"><Minus size={14} /></button>
                                        <span className="text-gray-900 font-semibold w-4 text-center">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(item.uniqueId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-700 hover:text-[#D95D1E]"><Plus size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => toggleDiscountEditor(item.uniqueId)}
                                        className="text-xs font-semibold text-[#D95D1E] hover:text-[#c25016]"
                                    >
                                        {hasItemDiscount ? 'Edit Item Discount' : 'Add Item Discount'}
                                    </button>
                                    {hasItemDiscount && (
                                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                            -{formatCurrency((item.price - unitEffective) * item.quantity)}
                                        </span>
                                    )}
                                </div>
                                {isDiscountEditorOpen && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => updateItemDiscount(item.uniqueId, 'PERCENTAGE', item.itemDiscountValue)}
                                                className={`px-2.5 py-1 text-xs font-bold ${discountType === 'PERCENTAGE' ? 'bg-[#D95D1E] text-white' : 'bg-white text-gray-600'}`}
                                            >
                                                %
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateItemDiscount(item.uniqueId, 'FIXED', item.itemDiscountValue)}
                                                className={`px-2.5 py-1 text-xs font-bold ${discountType === 'FIXED' ? 'bg-[#D95D1E] text-white' : 'bg-white text-gray-600'}`}
                                            >
                                                ₱
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={discountValue}
                                            onChange={(e) => {
                                                const next = Number(e.target.value);
                                                updateItemDiscount(item.uniqueId, discountType, Number.isFinite(next) ? next : undefined);
                                            }}
                                            placeholder={discountType === 'PERCENTAGE' ? '0-100' : '0.00'}
                                            className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => clearItemDiscount(item.uniqueId)}
                                            className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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

                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                {paymentMethods.map((method) => {
                                    const upper = method.name.toUpperCase();
                                    const isCash = upper === 'CASH';
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.name)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border ${paymentMethod === method.name ? 'border-[#D95D1E] bg-orange-50 text-[#D95D1E]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {isCash ? <Banknote size={18} className="mb-1" /> : <CreditCard size={18} className="mb-1" />}
                                            <span className="text-[10px] font-bold uppercase">{method.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentMethodsManager((v) => !v)}
                                className="w-full text-xs font-semibold text-gray-600 hover:text-gray-900"
                            >
                                {showPaymentMethodsManager ? 'Hide Payment Methods Manager' : 'Manage Payment Methods'}
                            </button>
                            {showPaymentMethodsManager && (
                                <div className="space-y-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex gap-2">
                                        <input
                                            value={newPaymentMethod}
                                            onChange={(e) => setNewPaymentMethod(e.target.value)}
                                            placeholder="Add payment method"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddPaymentMethod}
                                            disabled={isSavingPaymentMethod || !newPaymentMethod.trim()}
                                            className="px-3 py-2 text-sm font-bold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {paymentMethods.map((method) => (
                                            <div key={method.id} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded text-sm">
                                                <span className="font-medium text-gray-800 uppercase">{method.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePaymentMethod(method.id, method.name)}
                                                    disabled={isSavingPaymentMethod || paymentMethods.length <= 1}
                                                    className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {isLoadingPaymentMethods && (
                                        <div className="text-xs text-gray-500">Loading payment methods...</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>{formatCurrency(listSubtotal)}</span>
                            </div>
                            {itemDiscountsTotal > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Item Discounts</span>
                                    <span>-{formatCurrency(itemDiscountsTotal)}</span>
                                </div>
                            )}
                            {appliedPromotion && promotionDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount ({appliedPromotion.name})</span>
                                    <span>-{formatCurrency(promotionDiscountAmount)}</span>
                                </div>
                            )}
                            {isManualDiscountApplied && manualDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount ({discountName})</span>
                                    <span>-{formatCurrency(manualDiscountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2 pb-2">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-black text-[#D95D1E]">{formatCurrency(total)}</span>
                            </div>

                            {paymentMethod.toUpperCase() === 'CASH' && (
                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Cash Received</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95D1E]/20 focus:border-[#D95D1E] transition-all"
                                        />
                                    </div>
                                    {parseFloat(cashReceived) > 0 && parseFloat(cashReceived) >= total && (
                                        <div className="flex justify-between items-center text-sm font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 mb-2 mt-2">
                                            <span>Change</span>
                                            <span>{formatCurrency(parseFloat(cashReceived) - total)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

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
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm max-h-[85vh] sm:max-h-none overflow-hidden animate-in fade-in zoom-in-95 duration-200 safe-area-pb">
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
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 safe-area-pb">
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
                                            
                                            {order.discountAmount && order.discountAmount > 0 ? (
                                                <div className="pt-3 border-t border-gray-100 space-y-1.5">
                                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                                        <span>Subtotal</span>
                                                        <span>₱{(order.total + order.discountAmount).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm font-medium text-green-600">
                                                        <span>Discount ({order.discountName || 'Manual'})</span>
                                                        <span>-₱{order.discountAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-1.5 overflow-hidden">
                                                        <span className="text-gray-600 font-medium text-sm">Total</span>
                                                        <span className="font-bold text-[#D95D1E] text-lg">₱{order.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                    <span className="text-gray-600 font-medium text-sm">Total</span>
                                                    <span className="font-bold text-[#D95D1E] text-lg">₱{order.total.toFixed(2)}</span>
                                                </div>
                                            )}
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
                                                        onClick={async () => {
                                                            updateOrderPaymentStatus(order.id, 'PAID');
                                                            if (incomingTab === 'UNPAID' && order.status === 'READY') {
                                                                updateOrderStatus(order.id, 'COMPLETED');
                                                            }
                                                            printReceipt(order).catch(() => {});
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

                                            <button 
                                                onClick={() => {
                                                    if (!isBluetoothSupported()) {
                                                        toast.info('Receipt printing requires Chrome or Edge.');
                                                        return;
                                                    }
                                                    printReceipt(order).catch(() => toast.error('Could not print receipt.'));
                                                }}
                                                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200 text-sm flex items-center justify-center gap-2"
                                            >
                                                <Printer size={16} />
                                                Print receipt
                                            </button>

                                            {incomingTab === 'PENDING' && (
                                                <button 
                                                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    Approve to Kitchen
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => { setCancelOrderReason(''); setCancelOrderModal({ id: order.id, orderNumber: order.orderNumber, table: order.table }); }}
                                                className="w-full py-2 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors border border-red-200 text-sm"
                                            >
                                                Cancel Order
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {receiptModal && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Receipt Header */}
                        <div className="bg-gray-50 border-b border-gray-100 p-6 text-center">
                            <h3 className="text-xl font-black text-gray-900 mb-1">{storeName}</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">RECEIPT / POINT OF SALE</p>
                        </div>
                        
                        {/* Receipt Body */}
                        <div className="p-6 bg-white space-y-5 flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar">
                            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 pb-4 border-b border-dashed border-gray-200">
                                <span>Order #{receiptModal.orderNumber}</span>
                                <span>{receiptModal.timestamp.toLocaleDateString()} {receiptModal.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            <div className="space-y-3">
                                {receiptModal.items.map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                        <div className="flex justify-between items-start font-medium text-gray-900">
                                            <span className="flex-1 pr-2">{item.quantity} x {item.name}</span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                        {/* Modifiers / Options */}
                                        {item.options && Object.keys(item.options).length > 0 && (
                                            <div className="pl-4 mt-1 text-xs text-gray-500 space-y-0.5">
                                                {Object.entries(item.options).map(([key, val]) => {
                                                     if (key === 'tag' || key === 'bundleLabel') return null;
                                                     return <div key={key}>- {key}: {String(val)}</div>;
                                                })}
                                                {item.options.tag ? <div>- Tag: {String(item.options.tag)}</div> : null}
                                                {item.options.bundleLabel ? <div>- Bundle: {String(item.options.bundleLabel)}</div> : null}
                                            </div>
                                        )}
                                        {/* Extras */}
                                        {item.extras && item.extras.length > 0 && (
                                            <div className="pl-4 mt-1 text-xs text-gray-500 space-y-0.5">
                                                {item.extras.map((ex, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span>+ {ex.quantity && ex.quantity > 1 ? `${ex.quantity} x ` : ''}{ex.name}</span>
                                                        <span>{formatCurrency(ex.price * (ex.quantity || 1))}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-dashed border-gray-200 space-y-1.5">
                                {receiptModal.discountAmount ? (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600 font-medium">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(receiptModal.total + receiptModal.discountAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span>Discount ({receiptModal.discountName || 'Manual'})</span>
                                            <span>-{formatCurrency(receiptModal.discountAmount)}</span>
                                        </div>
                                    </>
                                ) : null}
                                <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-2">
                                    <span>Total</span>
                                    <span>{formatCurrency(receiptModal.total)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-widest pt-2">
                                    <span>Payment</span>
                                    <span>{receiptModal.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        {/* Receipt Actions */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setReceiptModal(null)}
                                className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                                Done
                            </button>
                            <button
                                onClick={() => {
                                    printReceipt(receiptModal);
                                    // Normally you'd want the user to explicitly dismiss it, so we don't nullify the modal here.
                                    // If you want it to auto-close after print, add: setReceiptModal(null);
                                }}
                                className="flex-1 py-3 px-4 bg-[#D95D1E] hover:bg-[#c25016] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                            >
                                <Printer size={18} />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel order confirmation */}
            {cancelOrderModal && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Cancel order?</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Order #{cancelOrderModal.orderNumber} (Table {cancelOrderModal.table}) will be cancelled. The customer will see the order as cancelled. This cannot be undone.
                        </p>
                        <textarea
                            value={cancelOrderReason}
                            onChange={(e) => setCancelOrderReason(e.target.value)}
                            placeholder="Reason for cancellation (optional)"
                            rows={3}
                            className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelOrderModal(null)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    updateOrderStatus(cancelOrderModal.id, 'CANCELLED', cancelOrderReason.trim() || undefined);
                                    if (editingOrderId === cancelOrderModal.id) {
                                        setEditingOrderId(null);
                                        setCart([]);
                                        setCartDrawerOpen(false);
                                    }
                                    setCancelOrderModal(null);
                                    setShowIncomingModal(false);
                                    toast.success('Order cancelled');
                                }}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Cancel Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Add Modal (modifiers/toppings) */}
            {productModalProduct && (
                <ProductAddModal
                    product={productModalProduct}
                    categoryName={filteredCategories.find(c => c.products.some(p => p.id === productModalProduct.id))?.name}
                    onAdd={handleProductModalAdd}
                    onClose={() => {
                        setProductModalProduct(null);
                        setEditingCartItemUniqueId(null);
                    }}
                    resolveImageUrl={resolveImageUrl}
                    formatCurrency={formatCurrency}
                    initialOptionsFromCart={editingCartItemUniqueId ? cart.find(i => i.uniqueId === editingCartItemUniqueId)?.options : undefined}
                    initialQuantity={editingCartItemUniqueId ? cart.find(i => i.uniqueId === editingCartItemUniqueId)?.quantity : undefined}
                    editMode={!!editingCartItemUniqueId}
                />
            )}
        </div>
    );
}

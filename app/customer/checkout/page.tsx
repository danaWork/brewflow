'use client';

import { useCart } from '@/context/CartContext';
import { useOrder } from '@/context/OrderContext';
import { ArrowLeft, ChevronDown, Check, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrderConfirmation from '@/components/customer/OrderConfirmation';
import { useTable } from '@/context/TableContext';
import FloatingOrderTabs from '@/components/customer/FloatingOrderTabs';

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const { createOrder } = useOrder();
    const { tableId } = useTable();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'PAYMAYA'>('CASH');
    const [note, setNote] = useState('');
    const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [lastOrderNumber, setLastOrderNumber] = useState<number>(0);

    const paymentMethods: { label: string; value: 'CASH' | 'GCASH' | 'PAYMAYA' }[] = [
        { label: 'Cash', value: 'CASH' },
        { label: 'GCash', value: 'GCASH' },
        { label: 'PayMaya', value: 'PAYMAYA' },
    ];

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePlaceOrder = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const result = await createOrder(items, cartTotal, paymentMethod, note);
            console.log(result);

            if (result) {
                setLastOrderNumber(result.orderNumber);
                clearCart();
                setShowConfirmation(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseConfirmation = () => {
        setShowConfirmation(false);
        router.push(`/customer/table/${tableId || '1'}`);
    };

    useEffect(() => {
        if (items.length === 0 && !showConfirmation) {
            router.push(`/customer/table/${tableId || '1'}`);
        }
    }, [items, router, showConfirmation, tableId]);

    if (items.length === 0 && !showConfirmation) {
        return null;
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 shrink-0 shadow-sm flex items-center gap-4 z-10 relative">
                <Link href="/customer/cart" className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-6">
                    {items.length > 0 ? items.map((item) => {
                        const hasExtras = item.extras && item.extras.length > 0;
                        const isNamedBundle = !!item.bundleLabel;

                        if (isNamedBundle) {
                            return (
                                <div key={item.id} className="bg-orange-50 rounded-3xl p-5 shadow-sm border border-orange-100">
                                    <div className="mb-4">
                                        <span className="inline-flex items-center gap-2 bg-gray-200/50 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                                            <Package size={14} className="text-[#D95D1E]" />
                                            {item.bundleLabel}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <span className="text-lg font-bold text-gray-900">{item.quantity}x</span>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                                                <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.options || {}).map(([key, value]) => (
                                                        <span key={key}>
                                                            <span className="font-semibold text-gray-600">{key}:</span> {String(value)}{" "}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">
                                            ₱{item.price.toFixed(2)}
                                        </span>
                                    </div>

                                    {hasExtras && <div className="my-4 border-t border-dashed border-orange-200/50" />}

                                    {item.extras?.map((extra, idx) => (
                                            <div key={idx} className="flex justify-between items-start mt-4">
                                            <div className="flex gap-4">
                                                <span className="text-lg font-bold text-gray-900">{extra.quantity}x</span>
                                                <h4 className="font-bold text-gray-900 text-lg">{extra.name}</h4>
                                            </div>
                                            <div className="text-right leading-none">
                                                <div className="text-gray-300 line-through text-xs mb-1">
                                                    ₱{(extra.price * 1.25).toFixed(2)}
                                                </div>
                                                <div className="text-[#00B050] font-bold text-lg">
                                                    ₱{extra.price.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        return (
                            <div key={item.id} className="space-y-[-12px] group">
                                <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative z-10 ${hasExtras ? 'rounded-b-none border-b-0 pb-8' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <span className="text-lg font-bold text-gray-900">{item.quantity}x</span>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                                                <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.options || {}).map(([key, value]) => (
                                                        <span key={key}>
                                                            <span className="font-semibold text-gray-600">{key}:</span> {String(value)}{" "}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900 text-lg">
                                            ₱{item.price.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {hasExtras && (
                                    <div className="bg-orange-50 rounded-2xl rounded-t-none p-5 pt-6 shadow-sm border border-orange-100 border-t-0 relative z-0 border-l-4 border-l-[#D95D1E]">
                                        {item.extras?.map((extra, idx) => (
                                            <div key={idx} className={`flex justify-between items-start ${idx > 0 ? 'mt-4 pt-4 border-t border-dashed border-orange-200/50' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-[#D95D1E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        TOGETHER
                                                    </span>
                                                    <span className="text-lg font-bold text-gray-900">{extra.quantity}x</span>
                                                    <h4 className="font-bold text-gray-900 text-lg">{extra.name}</h4>
                                                </div>
                                                <div className="text-right leading-none">
                                                    <div className="text-gray-300 line-through text-xs mb-1">
                                                        ₱{(extra.price * 1.25).toFixed(2)}
                                                    </div>
                                                    <div className="text-[#00B050] font-bold text-lg">
                                                        ₱{extra.price.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="p-8 text-center text-gray-400">Order Placed!</div>
                    )}
                </div>
            </div>

            <div className="shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-lg mx-auto p-4 space-y-4">
                    <div className="space-y-2 relative">
                        <h2 className="text-xs font-bold text-gray-500 uppercase">Payment Method</h2>
                        <div className="relative">
                            <button
                                onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between text-sm font-medium active:bg-gray-50 transition-colors"
                            >
                                <span className="text-gray-900">{paymentMethods.find(m => m.value === paymentMethod)?.label}</span>
                                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isPaymentDropdownOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 p-1">
                                    {paymentMethods.map(method => (
                                        <button
                                            key={method.value}
                                            onClick={() => {
                                                setPaymentMethod(method.value);
                                                setIsPaymentDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex justify-between items-center ${paymentMethod === method.value ? 'bg-orange-50 text-[#D95D1E]' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {method.label}
                                            {paymentMethod === method.value && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-gray-500 uppercase">Note / Special Instructions</h2>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Allergy to peanuts, less ice..."
                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                            rows={2}
                        />
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between items-center text-gray-900 font-bold text-xl mb-4">
                            <span>Total</span>
                            <span>₱{cartTotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={items.length === 0 || isSubmitting}
                            className="block w-full bg-[#10B981] text-white font-bold py-4 rounded-xl text-center text-lg border-2 border-gray-900 active:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Placing Order...
                                </>
                            ) : (
                                'Place Order'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <FloatingOrderTabs />
            <OrderConfirmation
                isOpen={showConfirmation}
                onClose={handleCloseConfirmation}
                orderNumber={lastOrderNumber}
                paymentMethod={paymentMethod}
            />
        </div>
    );
}

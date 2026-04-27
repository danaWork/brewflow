'use client';

import { Order, OrderStatus } from '@/context/OrderContext';
import { Wallet, ChefHat, Bell, CheckCircle2, X, XCircle, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateReceiptDataUrl } from '@/lib/generate-receipt-image';

interface OrderStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onDismiss?: (orderId: string) => void;
}

export default function OrderStatusModal({ isOpen, onClose, order, onDismiss }: OrderStatusModalProps) {
    const [render, setRender] = useState(false);
    const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
        }
    }, [isOpen]);

    // Generate receipt from order data — no DOM capture, no race conditions
    useEffect(() => {
        if (!order || !['PREPARING', 'READY', 'COMPLETED'].includes(order.status)) return;
        setReceiptDataUrl(null);
        try {
            const dataUrl = generateReceiptDataUrl({
                orderNumber: order.orderNumber,
                table: order.table,
                paymentMethod: order.paymentMethod,
                timestamp: order.timestamp instanceof Date ? order.timestamp : new Date(order.timestamp),
                items: order.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    options: item.options as Record<string, unknown> | undefined,
                })),
                discountAmount: order.discountAmount,
                discountName: order.discountName,
                total: order.total,
            });
            setReceiptDataUrl(dataUrl);
        } catch (e) {
            console.error('Failed to generate receipt', e);
        }
    }, [order]);

    const handleShare = async () => {
         if (!receiptDataUrl || !order) return;
         try {
             const res = await fetch(receiptDataUrl);
             const blob = await res.blob();
             const file = new File([blob], `receipt-${order.orderNumber}.png`, { type: 'image/png' });
             if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                 await navigator.share({ files: [file], title: 'Invoice' });
             }
         } catch (e) {
             console.log('Share API failed', e);
         }
    };



    if (!order || !render) return null;

    const animationClass = isOpen ? 'animate-in zoom-in-95 fade-in duration-200' : 'animate-out zoom-out-95 fade-out duration-200';

    if (!isOpen) return null;

    const statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    const currentStepIndex = statuses.indexOf(order.status);

    const getStepColor = (stepIndex: number) => {
        if (order.status === 'CANCELLED') return 'text-gray-300';
        if (stepIndex < currentStepIndex) return 'text-[#00B050]';
        if (stepIndex === currentStepIndex) {
            const colors: Record<OrderStatus, string> = {
                'PENDING': 'text-yellow-500',
                'PREPARING': 'text-blue-500',
                'READY': 'text-[#00B050]',
                'COMPLETED': 'text-[#D95D1E]',
                'CANCELLED': 'text-gray-300'
            };
            return colors[order.status];
        }
        return 'text-gray-300';
    };

    const getStepBg = (stepIndex: number) => {
        if (order.status === 'CANCELLED') return 'bg-gray-200';
        if (stepIndex < currentStepIndex) return 'bg-[#00B050]';
        if (stepIndex === currentStepIndex) {
            const bgs: Record<OrderStatus, string> = {
                'PENDING': 'bg-yellow-500',
                'PREPARING': 'bg-blue-500',
                'READY': 'bg-[#00B050]',
                'COMPLETED': 'bg-[#D95D1E]',
                'CANCELLED': 'bg-gray-200'
            };
            return bgs[order.status];
        }
        return 'bg-gray-200';
    };

    const renderBanner = () => {
        switch (order.status) {
            case 'PENDING':
                return (
                    <div className="bg-yellow-500 text-white p-6 pt-10 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <Wallet className="mx-auto mb-2 w-12 h-12" />
                            <h1 className="text-2xl font-bold mb-1">Waiting for Payment</h1>
                            <p className="opacity-90 text-sm">Please proceed to the counter to pay.</p>
                        </div>
                    </div>
                );
            case 'PREPARING':
                return (
                    <div className="bg-blue-500 text-white p-6 pt-10 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <ChefHat className="mx-auto mb-2 w-12 h-12 animate-bounce" />
                            <h1 className="text-2xl font-bold mb-1">Preparing Your Order</h1>
                            <p className="opacity-90 text-sm">Our team is crafting your drinks with care.</p>
                        </div>
                    </div>
                );
            case 'READY':
                return (
                    <div className="bg-[#00B050] text-white p-6 pt-10 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <Bell className="mx-auto mb-2 w-12 h-12 animate-pulse" />
                            <h1 className="text-2xl font-bold mb-1">Ready for Pickup!</h1>
                            <p className="opacity-90 text-sm">Please head to the pickup counter.</p>
                        </div>
                    </div>
                );
            case 'CANCELLED':
                return (
                    <div className="bg-gray-500 text-white p-6 pt-10 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <XCircle className="mx-auto mb-2 w-12 h-12" />
                            <h1 className="text-2xl font-bold mb-1">Order Cancelled</h1>
                            {order.cancellationReason ? (
                                <p className="opacity-90 text-sm">
                                    Reason: {order.cancellationReason}
                                </p>
                            ) : (
                                <p className="opacity-90 text-sm">This order has been cancelled.</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-[#D95D1E] text-white p-6 pt-10 relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <CheckCircle2 className="mx-auto mb-2 w-12 h-12" />
                            <h1 className="text-2xl font-bold mb-1">Enjoy Your Drinks!</h1>
                            <p className="opacity-90 text-sm">Thank you for visiting BrewFlow!</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-gray-50 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col ${animationClass}`}>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur border border-white/30 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="absolute top-4 left-4 z-20 bg-white/20 backdrop-blur px-3 py-1 rounded-lg text-white text-xs font-bold border border-white/30">
                    #{order.orderNumber}
                </div>

                <div className="shrink-0">
                    {renderBanner()}
                </div>

                <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between relative">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0" />

                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${getStepBg(0)} text-white`}>
                                    <Wallet size={18} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${getStepColor(0)}`}>Payment</span>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${getStepBg(1)} text-white`}>
                                    <ChefHat size={18} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${getStepColor(1)}`}>Preparing</span>
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${getStepBg(2)} text-white`}>
                                    <Bell size={18} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${getStepColor(2)}`}>Pickup</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Payment</p>
                            <p className="text-lg font-bold text-gray-900">{order.paymentMethod?.toUpperCase() || 'CASH'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Table</p>
                            <p className="text-lg font-bold text-gray-900">{order.table}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Order Summary</h3>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start text-sm">
                                        <div className="flex gap-3">
                                            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs h-fit">
                                                {item.quantity}x
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">{item.name}</span>
                                                </div>

                                                <div className="text-xs text-gray-400 font-medium mt-0.5 space-y-0.5">
                                                    {(item.options?.bundleLabel || item.options?.tag) && (
                                                        <div className="flex flex-wrap gap-2 mb-1">
                                                            {item.options.bundleLabel && (
                                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase brightness-95">
                                                                    {item.options.bundleLabel}
                                                                </span>
                                                            )}
                                                            {item.options.tag && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                                    item.options.tag === 'TOGETHER' ? 'bg-purple-50 text-purple-600' : 
                                                                    item.options.tag === 'EXTRA' ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'
                                                                }`}>
                                                                    {item.options.tag}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        {[
                                                            item.options?.size && `${item.options.size}`,
                                                            item.options?.milk && `${item.options.milk} Milk`,
                                                            item.options?.sweetness && `${item.options.sweetness}`,
                                                            item.options?.ice && `${item.options.ice} Ice`
                                                        ].filter(Boolean).join(' • ')}
                                                    </div>
                                                    {item.options?.toppings && item.options.toppings.length > 0 && (
                                                        <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                                                            + {item.options.toppings.map((t: { name: string }) => t.name).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-gray-900 font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>

                                    {/* Secondary check for nested extras in legacy data */}
                                    {item.extras && item.extras.length > 0 && (
                                        <div className="ml-8 border-l-2 border-gray-100 pl-3 space-y-3 mt-1">
                                            {item.extras.map((extra, eidx) => (
                                                <div key={eidx} className="flex justify-between items-start text-xs">
                                                    <div className="flex gap-2">
                                                        <span className="text-gray-400 font-bold">{extra.quantity}x</span>
                                                        <div>
                                                            <div className="font-bold text-gray-700">{extra.name}</div>
                                                            {extra.tag && (
                                                                <span className="text-[9px] bg-pink-50 text-pink-600 px-1 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                                                                    {extra.tag}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-600 font-medium">₱{(extra.price * (extra.quantity || 1)).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="p-5 bg-white border-t border-gray-100 z-10 shrink-0">
                    {order.status === 'CANCELLED' && onDismiss ? (
                        <button
                            onClick={() => {
                                onDismiss(order.id);
                                onClose();
                            }}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                        >
                            Dismiss Order
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium text-lg">Total Amount</span>
                                <span className="text-[#D95D1E] font-bold text-2xl">₱{order.total.toFixed(2)}</span>
                            </div>
                            
                            {['PREPARING', 'READY', 'COMPLETED'].includes(order.status) && (
                                <div className="flex gap-2">
                                    <a
                                        href={receiptDataUrl || '#'}
                                        download={`receipt-${order.orderNumber}.png`}
                                        className={`flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-900 font-bold py-3 text-md rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-100 transition-colors active:scale-95 ${!receiptDataUrl ? 'opacity-50 cursor-wait pointer-events-none' : ''}`}
                                    >
                                        {!receiptDataUrl ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-900 rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={18} />
                                                Download Save
                                            </>
                                        )}
                                    </a>
                                    {receiptDataUrl && typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && (
                                        <button
                                            onClick={handleShare}
                                            className="px-4 flex items-center justify-center bg-[#D95D1E] text-white font-bold rounded-xl hover:bg-[#c25016] transition-colors active:scale-95"
                                            title="Share Receipt"
                                        >
                                            Share
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

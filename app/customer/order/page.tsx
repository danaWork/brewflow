'use client';

import { useOrder, OrderStatus } from '@/context/OrderContext';
import { ArrowLeft, Wallet, ChefHat, Bell, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTable } from '@/context/TableContext';
import { toast } from 'sonner';

export default function OrderStatusPage() {
    const { userOrders, orderUpdatedOrderId, clearOrderUpdatedNotification } = useOrder();
    const { tableId } = useTable();
    const router = useRouter();
    const notifiedRef = useRef<string | null>(null);

    const currentOrder = userOrders.length > 0 ? userOrders[0] : null;

    useEffect(() => {
        if (!currentOrder) {
            router.push(`/customer/table/${tableId || '1'}`);
        }
    }, [currentOrder, router, tableId]);

    useEffect(() => {
        if (currentOrder && orderUpdatedOrderId === currentOrder.id && notifiedRef.current !== orderUpdatedOrderId) {
            notifiedRef.current = orderUpdatedOrderId;
            toast.info('Your order was updated by the staff. The details below are now up to date.');
            clearOrderUpdatedNotification();
        }
    }, [currentOrder, orderUpdatedOrderId, clearOrderUpdatedNotification]);

    if (!currentOrder) return null;

    const statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    const currentStepIndex = statuses.indexOf(currentOrder.status);

    const getStepColor = (stepIndex: number) => {
        if (currentOrder.status === 'CANCELLED') return 'text-gray-300';
        if (stepIndex < currentStepIndex) return 'text-[#00B050]';
        if (stepIndex === currentStepIndex) {
            const colors: Record<OrderStatus, string> = {
                'PENDING': 'text-yellow-500',
                'PREPARING': 'text-blue-500',
                'READY': 'text-[#00B050]',
                'COMPLETED': 'text-[#D95D1E]',
                'CANCELLED': 'text-gray-300'
            };
            return colors[currentOrder.status];
        }
        return 'text-gray-300';
    };

    const getStepBg = (stepIndex: number) => {
        if (currentOrder.status === 'CANCELLED') return 'bg-gray-200';
        if (stepIndex < currentStepIndex) return 'bg-[#00B050]';
        if (stepIndex === currentStepIndex) {
            const bgs: Record<OrderStatus, string> = {
                'PENDING': 'bg-yellow-500',
                'PREPARING': 'bg-blue-500',
                'READY': 'bg-[#00B050]',
                'COMPLETED': 'bg-[#D95D1E]',
                'CANCELLED': 'bg-gray-200'
            };
            return bgs[currentOrder.status];
        }
        return 'bg-gray-200';
    };

    const Banner = () => {
        switch (currentOrder.status) {
            case 'PENDING':
                return (
                    <div className="bg-yellow-500 text-white p-6 rounded-b-[2rem] pt-12 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <Wallet className="mx-auto mb-2 w-12 h-12" />
                            <h1 className="text-2xl font-bold mb-1">Waiting for Payment</h1>
                            <p className="opacity-90 text-sm">Please proceed to the counter to pay.</p>
                        </div>
                    </div>
                );
            case 'PREPARING':
                return (
                    <div className="bg-blue-500 text-white p-6 rounded-b-[2rem] pt-12 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <ChefHat className="mx-auto mb-2 w-12 h-12 animate-bounce" />
                            <h1 className="text-2xl font-bold mb-1">Preparing Your Order</h1>
                            <p className="opacity-90 text-sm">Our team is crafting your drinks with care.</p>
                        </div>
                    </div>
                );
            case 'READY':
                return (
                    <div className="bg-[#00B050] text-white p-6 rounded-b-[2rem] pt-12 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <Bell className="mx-auto mb-2 w-12 h-12 animate-pulse" />
                            <h1 className="text-2xl font-bold mb-1">Ready for Pickup!</h1>
                            <p className="opacity-90 text-sm">Please head to the pickup counter.</p>
                        </div>
                    </div>
                );
            case 'CANCELLED':
                return (
                    <div className="bg-gray-500 text-white p-6 rounded-b-[2rem] pt-12 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <XCircle className="mx-auto mb-2 w-12 h-12" />
                            <h1 className="text-2xl font-bold mb-1">Order Cancelled</h1>
                            <p className="opacity-90 text-sm">This order has been cancelled.</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-[#D95D1E] text-white p-6 rounded-b-[2rem] pt-12 shadow-lg relative overflow-hidden">
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-20">
                <button onClick={() => router.push(`/customer/table/${tableId || '1'}`)} className="bg-white/20 backdrop-blur p-2 rounded-lg text-white hover:bg-white/30 transition border border-white/30">
                    <ArrowLeft size={24} />
                </button>
                <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-lg text-white text-xs font-bold flex items-center border border-white/30">
                    #{currentOrder.orderNumber}
                </div>
            </div>

            <Banner />

            <div className="flex-1 p-6 space-y-8">

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
                        <p className="text-lg font-bold text-gray-900">{currentOrder.paymentMethod?.toUpperCase() || 'CASH'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Table</p>
                        <p className="text-lg font-bold text-gray-900">{currentOrder.table}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Order Summary</h3>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                        {currentOrder.items.map((item, idx) => (
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

                                            {item.options && Object.keys(item.options).length > 0 && (
                                                <div className="text-xs text-gray-400 font-medium mt-0.5">
                                                    {Object.entries(item.options)
                                                        .filter(([k]) => k !== 'tag' && k !== 'bundleLabel')
                                                        .map(([key, value]) => `${key}: ${String(value)}`)
                                                        .join(' · ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-gray-900 font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}

                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                            <span className="text-gray-500 font-medium">Total Amount</span>
                            <span className="text-[#D95D1E] font-bold text-xl">₱{currentOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

import { useOrder, Order } from '@/context/OrderContext';
import { Clock, ChefHat, Bell, CheckCircle2, X, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import OrderStatusModal from './OrderStatusModal';

export default function FloatingOrderTabs() {
    const { userOrders, dismissOrder } = useOrder();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return Clock;
            case 'PREPARING': return ChefHat;
            case 'READY': return Bell;
            case 'COMPLETED': return CheckCircle2;
            case 'CANCELLED': return XCircle;
            default: return Clock;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500';
            case 'PREPARING': return 'bg-blue-500';
            case 'READY': return 'bg-[#00B050]';
            case 'COMPLETED': return 'bg-gray-500';
            case 'CANCELLED': return 'bg-red-400';
            default: return 'bg-gray-400';
        }
    };

    // Auto-dismiss completed or cancelled orders after 10 seconds of them reaching this state
    useEffect(() => {
        if (userOrders.length === 0) return;
        
        const timers: NodeJS.Timeout[] = [];
        
        userOrders.forEach(order => {
            if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
                const timer = setTimeout(() => {
                    dismissOrder(order.id);
                    if (selectedOrder?.id === order.id) {
                        setSelectedOrder(null);
                    }
                }, 10000);
                timers.push(timer);
            }
        });

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [userOrders, dismissOrder, selectedOrder]);

    if (userOrders.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center gap-2 px-4 pointer-events-none">
                <div className="flex gap-2 overflow-x-auto max-w-full pointer-events-auto no-scrollbar">
                    {userOrders.map((order) => {
                        const Icon = getStatusIcon(order.status);
                        const canDismiss = order.status === 'COMPLETED' || order.status === 'CANCELLED';

                        return (
                            <div key={order.id} className="relative group  overflow-x-hidden">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className={`${getStatusColor(order.status)} text-white shadow-lg rounded-full pl-3 pr-4 py-2 flex items-center gap-2 transform active:scale-95 transition-all text-sm font-bold animate-in slide-in-from-bottom-4 fade-in duration-300`}
                                >
                                    <div className="bg-white/20 rounded-full p-1">
                                        <Icon size={14} className="text-white" />
                                    </div>
                                    <span>
                                        #{order.orderNumber}
                                        <span className="opacity-75 font-normal ml-1 capitalize text-xs">
                                            • {order.status.toLowerCase()}
                                        </span>
                                    </span>
                                </button>

                                {canDismiss && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dismissOrder(order.id);
                                        }}
                                        className="absolute -top-1 -right-1 bg-white text-gray-500 rounded-full p-0.5 shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <OrderStatusModal
                order={selectedOrder}
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onDismiss={(orderId) => {
                    dismissOrder(orderId);
                    setSelectedOrder(null);
                }}
            />
        </>
    );
}

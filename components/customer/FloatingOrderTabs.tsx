import { useOrder, Order } from '@/context/OrderContext';
import { Clock, ChefHat, Bell, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import OrderStatusModal from './OrderStatusModal';

export default function FloatingOrderTabs() {
  const { userOrders, dismissOrder } = useOrder();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status icons
  const getStatusIcon = (status: string) => {
      switch (status) {
          case 'payment': return Clock;
          case 'preparing': return ChefHat;
          case 'ready': return Bell;
          case 'completed': return CheckCircle2;
          default: return Clock;
      }
  };

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'payment': return 'bg-yellow-500';
          case 'preparing': return 'bg-blue-500';
          case 'ready': return 'bg-[#00B050]';
          case 'completed': return 'bg-gray-500'; // Less prominent
          default: return 'bg-gray-400';
      }
  };

  if (userOrders.length === 0) return null;

  return (
    <>
        <div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center gap-2 px-4 pointer-events-none">
            {/* Wrapper to allow pointer events on children but pass through on container */}
            <div className="flex gap-2 overflow-x-auto max-w-full pointer-events-auto no-scrollbar">
                {userOrders.map((order) => {
                    const Icon = getStatusIcon(order.status);
                    const isCompleted = order.status === 'completed';
                    
                    return (
                        <div key={order.id} className="relative group">
                             <button
                                onClick={() => setSelectedOrder(order)}
                                className={`${getStatusColor(order.status)} text-white shadow-lg rounded-full pl-3 pr-4 py-2 flex items-center gap-2 transform active:scale-95 transition-all text-sm font-bold animate-in slide-in-from-bottom-4 fade-in duration-300`}
                            >
                                <div className="bg-white/20 rounded-full p-1">
                                    <Icon size={14} className="text-white" />
                                </div>
                                <span>
                                    {order.id}
                                    <span className="opacity-75 font-normal ml-1 capitalize text-xs">
                                        • {order.status}
                                    </span>
                                </span>
                            </button>
                            
                            {/* Dismiss Button for Completed Orders */}
                            {isCompleted && (
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

        {/* Modal */}
        <OrderStatusModal 
            order={selectedOrder} 
            isOpen={!!selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
        />
    </>
  );
}

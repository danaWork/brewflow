'use client';

import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { useState } from 'react';
import { LayoutGrid, Clock, ChefHat, Bell, X, CreditCard, Banknote, Smartphone } from 'lucide-react';

// Payment method icon helper
function PaymentIcon({ method }: { method: string }) {
  const lowerMethod = method.toLowerCase();
  if (lowerMethod === 'cash') return <Banknote size={12} />;
  if (lowerMethod === 'gcash' || lowerMethod === 'maya') return <Smartphone size={12} />;
  return <CreditCard size={12} />;
}

// Cancel Confirmation Modal
function CancelConfirmModal({ 
  isOpen, 
  order, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean; 
  order: Order | null; 
  onConfirm: () => void; 
  onCancel: () => void; 
}) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <X size={20} className="text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Cancel Order?</h2>
        </div>
        
        <p className="text-gray-600 mb-2">
          Are you sure you want to cancel order <span className="font-bold">{order.id}</span>?
        </p>
        <p className="text-sm text-gray-400 mb-6">
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
          >
            Keep Order
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OwnerKanbanPage() {
  const { activeOrders, updateOrderStatus } = useOrder();
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  
  // Filter out cancelled orders for display
  const visibleOrders = activeOrders.filter(o => o.status !== 'cancelled');
  
  // Columns
  const columns: { id: OrderStatus, title: string, color: string, icon: any }[] = [
      { id: 'payment', title: 'Pending', color: 'bg-yellow-100 border-yellow-200', icon: Clock },
      { id: 'preparing', title: 'Preparing', color: 'bg-blue-100 border-blue-200', icon: ChefHat },
      { id: 'ready', title: 'Ready', color: 'bg-green-100 border-green-200', icon: Bell },
  ];

  // We will just filter orders for each column
  const getOrdersByStatus = (status: OrderStatus) => visibleOrders.filter(o => o.status === status);

  const handleCancelClick = (order: Order) => {
    setCancelModalOrder(order);
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrder) {
      updateOrderStatus(cancelModalOrder.id, 'cancelled');
      setCancelModalOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-[#D95D1E] text-white p-2 rounded-lg">
                    <LayoutGrid size={24} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">BrewFlow <span className="text-gray-400 font-normal">Kitchen Display</span></h1>
            </div>
            <div className="text-sm font-medium text-gray-500">
                {visibleOrders.length} Active Orders
            </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-6 h-full min-w-[max-content]">
                {columns.map(col => (
                    <div key={col.id} className="w-80 flex flex-col h-full">
                        <div className={`p-4 rounded-t-xl border-b-0 border-2 ${col.color.replace('bg-', 'bg-opacity-50 ')} flex items-center gap-3`}>
                             <col.icon size={20} className="text-gray-700" />
                             <h2 className="font-bold text-gray-900">{col.title}</h2>
                             <span className="ml-auto bg-white/50 px-2 py-0.5 rounded text-xs font-bold">
                                 {getOrdersByStatus(col.id).length}
                             </span>
                        </div>
                        <div className={`flex-1 bg-white border-2 border-t-0 p-4 space-y-4 rounded-b-xl ${col.color.replace('bg-', 'border-').split(' ')[1]}`}>
                             {getOrdersByStatus(col.id).map(order => (
                                 <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-2">
                                           <span className="font-bold text-lg text-gray-900">{order.id}</span>
                                           {/* Payment Method Badge */}
                                           <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                             <PaymentIcon method={order.paymentMethod} />
                                             {order.paymentMethod}
                                           </span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                           <span className="text-xs text-gray-500">{order.items.length} items</span>
                                           {/* Cancel Button */}
                                           <button 
                                             onClick={() => handleCancelClick(order)}
                                             className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                             title="Cancel order"
                                           >
                                             <X size={16} />
                                           </button>
                                         </div>
                                     </div>

                                     {/* Special Instructions Badge */}
                                     {order.specialInstructions && (
                                         <div className="mb-4 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                             <p className="text-[10px] font-bold text-[#D95D1E] uppercase tracking-wide mb-1">Note</p>
                                             <p className="text-sm font-bold text-gray-900 leading-tight">"{order.specialInstructions}"</p>
                                         </div>
                                     )}
                                     <div className="space-y-1 mb-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                                                <div className="flex justify-between items-start text-sm">
                                                    <div className="flex gap-2">
                                                        <span className="font-bold text-gray-900">{item.quantity}x</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-800 font-medium">{item.name}</span>
                                                            
                                                            {/* Options */}
                                                            <div className="text-xs text-gray-500">
                                                                {[
                                                                    item.options?.size,
                                                                    item.options?.milk && `${item.options.milk} Milk`,
                                                                    item.options?.sweetness,
                                                                    item.options?.ice && `${item.options.ice} Ice`
                                                                ].filter(Boolean).join(', ')}
                                                            </div>

                                                            {/* Toppings */}
                                                            {item.options?.toppings && Array.isArray(item.options.toppings) && item.options.toppings.length > 0 && (
                                                                <div className="text-xs text-orange-600 font-medium mt-0.5">
                                                                    + {item.options.toppings.map((t: any) => t.name).join(', ')}
                                                                </div>
                                                            )}

                                                            {/* Extras */}
                                                            {item.extras && item.extras.length > 0 && (
                                                                <div className="mt-1 space-y-0.5">
                                                                    {item.extras.map((extra, eIdx) => (
                                                                        <div key={eIdx} className="text-xs text-gray-500 flex items-center gap-1">
                                                                            <span className="bg-gray-100 px-1 rounded text-[10px] items-center justify-center flex h-4 min-w-[16px]">
                                                                                {item.quantity * extra.quantity}
                                                                            </span>
                                                                            <span>{extra.name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                     
                                     {/* Action Buttons */}
                                     {col.id === 'payment' && (
                                         <button 
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            className="w-full py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition"
                                         >
                                             Start Preparing →
                                         </button>
                                     )}
                                     {col.id === 'preparing' && (
                                         <button 
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                                         >
                                             Mark Ready →
                                         </button>
                                     )}
                                     {col.id === 'ready' && (
                                         <button 
                                            onClick={() => updateOrderStatus(order.id, 'completed')}
                                            className="w-full py-2 bg-gray-50 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100 transition"
                                         >
                                             Complete Order ✓
                                         </button>
                                     )}
                                 </div>
                             ))}
                             
                             {getOrdersByStatus(col.id).length === 0 && (
                                 <div className="text-center text-gray-400 text-sm py-8 italic">
                                     No {col.title.toLowerCase()} orders
                                 </div>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Cancel Confirmation Modal */}
        <CancelConfirmModal 
          isOpen={cancelModalOrder !== null}
          order={cancelModalOrder}
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelModalOrder(null)}
        />
    </div>
  );
}

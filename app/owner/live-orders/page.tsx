'use client';

import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { useState } from 'react';
import { Clock, ChefHat, CheckCircle, X, CreditCard, Banknote, Smartphone, ClipboardList, Bell } from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

function PaymentIcon({ method }: { method: string }) {
  const lowerMethod = method.toLowerCase();
  if (lowerMethod === 'cash') return <Banknote size={12} />;
  if (lowerMethod === 'gcash' || lowerMethod === 'paymaya' || lowerMethod === 'maya') return <Smartphone size={12} />;
  return <CreditCard size={12} />;
}

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
          Are you sure you want to cancel order <span className="font-bold">#{order.orderNumber}</span>?
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

export default function LiveOrdersPage() {
  const { activeOrders, updateOrderStatus } = useOrder();
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  const visibleOrders = activeOrders.filter(o => o.status !== 'CANCELLED');

  const { newOrderNotification, dismissNotification } = useOrderNotifications(activeOrders);

  const columns: { id: OrderStatus, title: string, bgColor: string, borderColor: string, icon: any }[] = [
    { id: 'PENDING', title: 'Pending', bgColor: 'bg-[#FFF9E6]', borderColor: 'border-[#E6C84A]', icon: Clock },
    { id: 'PREPARING', title: 'Preparing', bgColor: 'bg-[#FFF5EB]', borderColor: 'border-[#E6894A]', icon: ChefHat },
    { id: 'READY', title: 'Ready', bgColor: 'bg-[#E8F5E9]', borderColor: 'border-[#4CAF50]', icon: CheckCircle },
    { id: 'COMPLETED', title: 'Completed', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: CheckCircle },
  ];

  const getOrdersByStatus = (status: OrderStatus) => visibleOrders.filter(o => o.status === status);

  const handleCancelClick = (order: Order) => {
    setCancelModalOrder(order);
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrder) {
      updateOrderStatus(cancelModalOrder.id, 'CANCELLED');
      setCancelModalOrder(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {newOrderNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#D95D1E] p-4 min-w-[320px] max-w-[90vw] flex items-center gap-4">
            <div className="bg-[#D95D1E]/10 p-2 rounded-lg">
              <Bell className="text-[#D95D1E]" size={24} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg mb-0.5">
                New Order Received! 🍽️
              </div>
              <div className="text-sm text-gray-600">
                Order #{newOrderNotification.order.orderNumber} from {newOrderNotification.order.table}
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        </div>
      </div>

      <div className="px-6 pt-6 pb-2">
        <h2 className="text-lg font-bold text-gray-900">Live Orders</h2>
        <p className="text-sm text-gray-500">{visibleOrders.length} active orders</p>
      </div>

      <div className="flex-1 overflow-x-auto px-6 pb-6 mt-4">
        <div className="flex gap-4 h-full min-w-[max-content]">
          {columns.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full">
              <div className={`flex-1 rounded-xl border-2 ${col.borderColor} ${col.bgColor} flex flex-col min-h-[500px]`}>
                <div className="p-4 flex items-center gap-3">
                  <col.icon size={18} className="text-gray-600" />
                  <h3 className="font-semibold text-gray-800">{col.title}</h3>
                  <span className="ml-auto bg-white/80 px-2.5 py-0.5 rounded-md text-sm font-medium text-gray-600 border border-gray-200">
                    {getOrdersByStatus(col.id).length}
                  </span>
                </div>

                <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {getOrdersByStatus(col.id).map(order => (
                    <div key={order.id} className={`p-4 rounded-xl shadow-sm border transition-shadow ${order.status === 'COMPLETED'
                        ? 'bg-gray-50 border-gray-200 opacity-75 hover:opacity-100'
                        : 'bg-white border-gray-100 hover:shadow-md'
                      }`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-xl text-gray-900">
                          #{order.orderNumber}
                        </span>
                        {/* Only show cancel button if NOT completed */}
                        {order.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCancelClick(order)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Cancel order"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {order.table}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                          <PaymentIcon method={order.paymentMethod} />
                          {order.paymentMethod}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4">
                        {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
                          <div key={idx} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                            <div className="flex justify-between items-start text-sm">
                              <div className="flex gap-2">
                                <span className="font-bold text-gray-900">{item.quantity}x</span>
                                <div className="flex flex-col">
                                  <span className="text-gray-800 font-medium">{item.name}</span>
                                  {item.options && (
                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                                      {item.options.size && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          {item.options.size}
                                        </span>
                                      )}
                                      {item.options.milk && (
                                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          {item.options.milk}
                                        </span>
                                      )}
                                      {item.options.sweetness && (
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          {item.options.sweetness}
                                        </span>
                                      )}
                                      {item.options.ice && (
                                        <span className="text-[10px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          {item.options.ice}
                                        </span>
                                      )}
                                      {item.options.toppings && item.options.toppings.length > 0 && (
                                        <div className="w-full flex flex-wrap gap-1 mt-1">
                                          {item.options.toppings.map((t: any, tidx: number) => (
                                            <span key={tidx} className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                                              + {t.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {item.options.tag === 'TOGETHER' && (
                                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          Together
                                        </span>
                                      )}
                                      {item.options.bundleLabel && (
                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          {item.options.bundleLabel}
                                        </span>
                                      )}
                                      {item.options.tag === 'EXTRA' && (
                                        <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">
                                          + Extra
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-xs text-gray-400 italic">No item details available</div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mb-3">
                        <div className="text-xs text-gray-500">
                          {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-lg font-bold text-[#D95D1E]">
                          ₱{order.total.toFixed(2)}
                        </div>
                      </div>

                      {col.id === 'PENDING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="w-full py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition"
                        >
                          Start Preparing →
                        </button>
                      )}
                      {col.id === 'PREPARING' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                        >
                          Mark Ready →
                        </button>
                      )}
                      {col.id === 'READY' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          className="w-full py-2 bg-gray-50 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100 transition"
                        >
                          Complete Order ✓
                        </button>
                      )}
                      {/* No buttons for COMPLETED */}
                    </div>
                  ))}

                  {getOrdersByStatus(col.id).length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-16">
                      No {col.title.toLowerCase()} orders
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CancelConfirmModal
        isOpen={cancelModalOrder !== null}
        order={cancelModalOrder}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalOrder(null)}
      />
    </div>
  );
}

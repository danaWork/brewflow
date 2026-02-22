'use client';

import { useState } from 'react';
import { Clock, ChefHat, CheckCircle, CreditCard, Banknote, Smartphone, X } from 'lucide-react';
import type { Order, OrderStatus } from '@/context/OrderContext';

function PaymentIcon({ method }: { method: string }) {
  const lowerMethod = method.toLowerCase();
  if (lowerMethod === 'cash') return <Banknote size={12} />;
  if (lowerMethod === 'gcash' || lowerMethod === 'paymaya' || lowerMethod === 'maya') return <Smartphone size={12} />;
  return <CreditCard size={12} />;
}

type ColumnConfig = {
  id: OrderStatus;
  title: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

interface LiveOrdersTabsMobileProps {
  columns: ColumnConfig[];
  getOrdersByStatus: (status: OrderStatus) => Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onCancelClick: (order: Order) => void;
}

export default function LiveOrdersTabsMobile({
  columns,
  getOrdersByStatus,
  updateOrderStatus,
  onCancelClick,
}: LiveOrdersTabsMobileProps) {
  const [activeTab, setActiveTab] = useState<OrderStatus>(columns[0]?.id ?? 'PENDING');
  const activeCol = columns.find((c) => c.id === activeTab) ?? columns[0];
  const orders = activeCol ? getOrdersByStatus(activeCol.id) : [];

  /* Status accent color for content area top bar only */
  const statusAccentBar: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-400',
    PREPARING: 'bg-orange-400',
    READY: 'bg-emerald-500',
    COMPLETED: 'bg-gray-300',
    CANCELLED: 'bg-gray-200',
  };
  const accentBar = statusAccentBar[activeCol.id] ?? 'bg-gray-200';

  return (
    <div className="flex flex-col flex-1 min-h-0 md:hidden">
      {/* Tabs - neutral bar, active = primary orange only */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto shrink-0 -mx-4 px-4">
        {columns.map((col) => {
          const count = getOrdersByStatus(col.id).length;
          const Icon = col.icon;
          const isActive = activeTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveTab(col.id)}
              className={`
                flex items-center gap-2 px-4 py-3.5 min-h-[48px] shrink-0 text-sm font-medium transition-all
                border-b-2 -mb-px
                ${isActive
                  ? 'border-[#D95D1E] text-[#D95D1E] bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-[#D95D1E]' : 'text-gray-400'} />
              <span className="whitespace-nowrap">{col.title}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold min-w-[1.25rem] text-center
                  ${isActive ? 'bg-[#D95D1E]/15 text-[#D95D1E]' : 'bg-gray-200/80 text-gray-600'}
                `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content - neutral background with subtle status accent bar */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-[400px] mt-0">
        <div className={`h-1 shrink-0 ${accentBar}`} aria-hidden />
        <div className="p-4 pt-4 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`
                p-4 rounded-xl shadow-sm border transition-shadow
                ${order.status === 'COMPLETED'
                  ? 'bg-gray-50 border-gray-200 opacity-75 hover:opacity-100'
                  : 'bg-white border-gray-100 hover:shadow-md'
                }
              `}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-xl text-gray-900">#{order.orderNumber}</span>
                {order.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => onCancelClick(order)}
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

              {order.note && (
                <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm mb-3 border border-yellow-200">
                  <span className="font-bold block text-xs uppercase mb-1">Note:</span>
                  {order.note}
                </div>
              )}

              <div className="space-y-1 mb-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between items-start text-sm">
                        <div className="flex gap-2">
                          <span className="font-bold text-gray-900">{item.quantity}x</span>
                          <div className="flex flex-col">
                            <span className="text-gray-800 font-medium">{item.name}</span>
                            {item.options && (
                              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                {Object.entries(item.options).map(([key, value]) => {
                                  if (key === 'tag' || key === 'bundleLabel') return null;
                                  return (
                                    <span
                                      key={key}
                                      className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold uppercase tracking-tight border border-gray-200"
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
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 italic">No item details available</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 mb-3">
                <div className="text-xs text-gray-500">
                  {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-lg font-bold text-[#D95D1E]">₱{order.total.toFixed(2)}</div>
              </div>

              {activeCol.id === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                  className="w-full py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-100 transition"
                >
                  Start Preparing →
                </button>
              )}
              {activeCol.id === 'PREPARING' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'READY')}
                  className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                >
                  Mark Ready →
                </button>
              )}
              {activeCol.id === 'READY' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                  className="w-full py-2 bg-gray-50 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100 transition"
                >
                  Complete Order ✓
                </button>
              )}
            </div>
          ))}

          {orders.length === 0 && (
            <div className="flex items-center justify-center text-gray-400 text-sm py-16">
              No {activeCol.title.toLowerCase()} orders
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

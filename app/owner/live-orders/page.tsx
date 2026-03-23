'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import { Clock, ChefHat, CheckCircle, X, CreditCard, Banknote, Smartphone, ClipboardList, Bell, History, ChevronDown, ChevronUp, RefreshCw, Search } from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import LiveOrdersTabsMobile from './LiveOrdersTabsMobile';
import { getPastOrdersAction, updateOrderPaymentMethodAction } from '@/app/actions/orders';
import { getSessionAction } from '@/app/actions/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type PastOrder = {
  id: string;
  orderNumber: number;
  status: 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  tableNumber: string;
  createdAt: Date;
  completedAt: Date | null;
  paymentMethod: string | null;
  note: string | null;
  cancellationReason?: string | null;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    options?: any;
  }[];
};

// ─── Small helpers ────────────────────────────────────────────────────────────

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
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

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
        <p className="text-sm text-gray-400 mb-4">
          This action cannot be undone.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation (optional)"
          rows={3}
          className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-200"
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Log Entry ───────────────────────────────────────────────────────

function ActivityLogEntry({ order }: { order: PastOrder }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = order.status === 'COMPLETED';

  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`rounded-xl border transition-all ${
      isCompleted
        ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
        : 'bg-red-50/50 border-red-100 hover:border-red-200'
    }`}>
      {/* Header row – always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-3 md:p-4 text-left"
      >
        {/* Order number */}
        <span className="font-bold text-gray-900 text-sm min-w-[3rem]">
          #{order.orderNumber}
        </span>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
          isCompleted
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-600'
        }`}>
          {isCompleted ? <CheckCircle size={10} /> : <X size={10} />}
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </span>

        {/* Table */}
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
          {order.tableNumber}
        </span>

        {/* Payment */}
        {order.paymentMethod && (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
            <PaymentIcon method={order.paymentMethod} />
            {order.paymentMethod}
          </span>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Total */}
        <span className="font-bold text-[#D95D1E] text-sm shrink-0">
          ₱{order.totalAmount.toFixed(2)}
        </span>

        {/* Date/Time */}
        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
          {dateStr} · {timeStr}
        </span>

        {/* Expand chevron */}
        <span className="text-gray-400 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Mobile: date under header */}
      <div className="sm:hidden px-3 pb-2 -mt-1 text-xs text-gray-400">
        {dateStr} · {timeStr}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {order.note && (
            <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm border border-yellow-200">
              <span className="font-bold block text-xs uppercase mb-1">Note:</span>
              {order.note}
            </div>
          )}
          {!isCompleted && order.cancellationReason && (
            <div className="bg-red-50 text-red-800 p-2 rounded-lg text-sm border border-red-200">
              <span className="font-bold block text-xs uppercase mb-1">Cancellation Reason:</span>
              {order.cancellationReason}
            </div>
          )}
          <div className="space-y-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-2 text-sm items-start border-b border-gray-50 last:border-0 pb-1.5 last:pb-0">
                <span className="font-bold text-gray-700 shrink-0">{item.quantity}×</span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-800">{item.name}</span>
                  {item.options && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(item.options).map(([key, value]) => {
                        if (key === 'tag' || key === 'bundleLabel') return null;
                        return (
                          <span key={key} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-gray-200">
                            {key}: {String(value)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="ml-auto text-gray-500 text-xs shrink-0">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activity Log Section ─────────────────────────────────────────────────────

function ActivityLogSection() {
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await getSessionAction();
      const branchId = session?.user?.branchId;
      if (!branchId) {
        setError('Could not determine shop branch.');
        setLoading(false);
        return;
      }
      const result = await getPastOrdersAction(branchId, {
        page,
        limit,
        dateFilter,
        searchQuery
      });
      if (result.success && result.orders) {
        setOrders(result.orders.map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          completedAt: o.completedAt ? new Date(o.completedAt) : null,
        })));
        setTotalCount(result.totalCount || 0);
      } else {
        setError('Failed to load activity log.');
      }
    } catch (e) {
      setError('Failed to load activity log.');
    }
    setLoading(false);
  }, [page, dateFilter, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter(o => filter === 'ALL' || o.status === filter);

  return (
    <section className="px-4 md:px-6 pb-10 mt-2">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <History size={18} className="text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Activity Log</h2>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">All past orders for your shop</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters and Search Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 items-start md:items-center">
        {/* Filter pills */}
        <div className="flex gap-2">
          {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                filter === f
                  ? f === 'ALL'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : f === 'COMPLETED'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'ALL'
                ? `All (${filter === 'ALL' ? totalCount : '...'})`
                : f === 'COMPLETED'
                  ? `Completed`
                  : `Cancelled`}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto md:ml-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Search table or order number..." 
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-full md:w-56 focus:outline-none focus:border-gray-400"
              value={searchQuery}
              onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
              }}
            />
          </div>
          <div className="relative">
            <input 
              type="date" 
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600 w-full"
              value={dateFilter}
              onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" />
          Loading activity log…
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <History size={32} className="opacity-40" />
          No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}orders in activity log yet
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {filtered.map(order => (
              <ActivityLogEntry key={order.id} order={order} />
            ))}
          </div>
          
          {/* Pagination */}
          {Math.ceil(totalCount / limit) > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Prev
              </button>
              
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar px-1 py-1">
                {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                      page === p 
                        ? 'bg-gray-800 text-white border-gray-800' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / limit), p + 1))}
                disabled={page === Math.ceil(totalCount / limit)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LiveOrdersPage() {
  const { activeOrders, updateOrderStatus, isLoading, refreshActiveOrders } = useOrder();
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  const visibleOrders = activeOrders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED');

  const { newOrderNotification, dismissNotification } = useOrderNotifications(activeOrders, isLoading);

  // Only PREPARING and READY in the kitchen kanban
  const columns: { id: OrderStatus, title: string, bgColor: string, borderColor: string, icon: any }[] = [
    { id: 'PREPARING', title: 'Preparing', bgColor: 'bg-[#FFF5EB]', borderColor: 'border-[#E6894A]', icon: ChefHat },
    { id: 'READY', title: 'Ready', bgColor: 'bg-[#E8F5E9]', borderColor: 'border-[#4CAF50]', icon: CheckCircle },
  ];

  const getOrdersByStatus = (status: OrderStatus) => visibleOrders.filter(o => o.status === status);

  const handleCancelClick = (order: Order) => {
    setCancelModalOrder(order);
  };

  const handleConfirmCancel = (reason: string) => {
    if (cancelModalOrder) {
      updateOrderStatus(cancelModalOrder.id, 'CANCELLED', reason || undefined);
      setCancelModalOrder(null);
    }
  };

  const handlePaymentMethodChange = async (orderId: string, newMethod: 'CASH' | 'GCASH' | 'PAYMAYA') => {
    const res = await updateOrderPaymentMethodAction(orderId, newMethod);
    if (res.success) {
      alert('Payment method updated');
      refreshActiveOrders();
    } else {
      alert('Failed to update payment method');
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

      <div className="bg-white px-4 py-4 md:px-6 md:py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={20} className="text-[#D95D1E]" />
          <h1 className="text-xl font-bold text-gray-900">Kitchen Display</h1>
        </div>
      </div>

      {/* ── Live Orders heading ── */}
      <div className="px-4 md:px-6 pt-5 md:pt-6 pb-4 md:pb-2">
        <h2 className="text-lg font-bold text-gray-900">Active preparation</h2>
        <p className="text-sm text-gray-500 mt-1">{visibleOrders.filter(o => o.status === 'PREPARING' || o.status === 'READY').length} order{visibleOrders.filter(o => o.status === 'PREPARING' || o.status === 'READY').length !== 1 ? 's' : ''} in queue</p>
      </div>

      {/* Mobile: tabbed view */}
      <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:hidden mt-0">
        <LiveOrdersTabsMobile
          columns={columns}
          getOrdersByStatus={getOrdersByStatus}
          updateOrderStatus={updateOrderStatus}
          onCancelClick={handleCancelClick}
          onPaymentMethodChange={handlePaymentMethodChange}
        />
      </div>

      {/* Desktop: three columns */}
      <div className="overflow-x-auto px-6 pb-6 mt-4 hidden md:block">
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
                    <div key={order.id} className="p-4 rounded-xl shadow-sm border bg-white border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-xl text-gray-900">
                          #{order.orderNumber}
                        </span>
                        <button
                          onClick={() => handleCancelClick(order)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Cancel order"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {order.table}
                        </span>
                        <div className="relative group/payment">
                          <select
                            value={order.paymentMethod || 'CASH'}
                            onChange={(e) => handlePaymentMethodChange(order.id, e.target.value as any)}
                            className="appearance-none inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold pl-2.5 py-1 pr-6 rounded-full uppercase cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D95D1E]"
                          >
                            <option value="CASH">CASH</option>
                            <option value="GCASH">GCASH</option>
                            <option value="PAYMAYA">PAYMAYA</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                            {order.paymentStatus}
                        </span>
                      </div>

                      {order.note && (
                        <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm mb-3 border border-yellow-200">
                           <span className="font-bold block text-xs uppercase mb-1">Note:</span>
                           {order.note}
                        </div>
                      )}

                      <div className="space-y-1 mb-4">
                        {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
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
                                            <span key={key} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold uppercase tracking-tight border border-gray-200">
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

                      {/* Removed PENDING to PREPARING button as this is handled in POS now */}
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

      {/* ── Divider ── */}
      <div className="mx-4 md:mx-6 my-2 border-t border-gray-200" />

      {/* ── Activity Log ── */}
      <ActivityLogSection />

      <CancelConfirmModal
        isOpen={cancelModalOrder !== null}
        order={cancelModalOrder}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalOrder(null)}
      />
    </div>
  );
}

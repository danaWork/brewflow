'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useOrder, Order, OrderStatus } from '@/context/OrderContext';
import {
  Bell,
  CheckCircle,
  ChefHat,
  ChevronDown,
  CreditCard,
  Banknote,
  Smartphone,
  History,
  Info,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

function StationReadyBadge({ label }: { label: string }) {
  return (
    <div className="w-full py-2 px-3 bg-emerald-500 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 cursor-default select-none">
      <CheckCircle size={15} className="shrink-0" />
      <span>{label} — waiting for other station</span>
    </div>
  );
}
import LiveOrdersTabsMobile from '@/app/owner/live-orders/LiveOrdersTabsMobile';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { getCompanyPaymentMethodsAction } from '@/app/actions/payment-methods';
import { getPastOrdersAction, updateOrderPaymentMethodAction } from '@/app/actions/orders';

type Station = 'all' | 'drink' | 'food';

// ─── Types (Activity Log) ──────────────────────────────────────────────────────

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

function isDrinkItem(item: any) {
  return String(item?.categoryType ?? '').toLowerCase() === 'drink';
}

function stationBadgeText(order: Order) {
  const drink = order.drinkStationStatus ?? null;
  const food = order.foodStationStatus ?? null;
  const parts: string[] = [];
  if (drink !== null) parts.push(`Drinks: ${drink}`);
  if (food !== null) parts.push(`Food: ${food}`);
  return parts.join(' · ');
}

function StaffQuickTips({
  station,
  onRefresh,
}: {
  station: Station;
  onRefresh: () => void;
}) {
  const isAll = station === 'all';

  const bullets =
    station === 'drink'
      ? [
          'This screen lists only drink items for each order.',
          'When the drinks are finished, tap Mark Drinks Ready.',
          'Once you tap it, the button turns green and shows "Drinks marked ready — waiting for other station". This means you\'re done; the kitchen just needs to finish their side.',
          'When the kitchen also marks food ready, the whole order automatically moves to Ready.',
        ]
      : station === 'food'
        ? [
            'This screen lists only food items (snacks, meals, etc.) for each order.',
            'When the food is finished, tap Mark Food Ready.',
            'Once you tap it, the button turns green and shows "Food marked ready — waiting for other station". This means you\'re done; the barista just needs to finish the drinks.',
            'When the barista also marks drinks ready, the whole order automatically moves to Ready.',
          ]
        : [
            'Orders appear here after someone approves them at the POS (counter).',
            'Preparing: when everything for that order is done, tap Mark Ready to move it to Ready.',
            'Ready: when the guest has picked up the order, tap Complete Order.',
            'If an order has both drinks and food, the small line under the table shows drink vs food progress until both sides are finished.',
            'To open the dedicated station screens: Drinks = /owner/live-orders/drinks, Kitchen = /owner/live-orders/kitchen.',
          ];

  return (
    <details className="group mt-3 rounded-xl border border-amber-200/90 bg-amber-50/50 px-3 py-2 md:px-4 md:py-2.5 open:bg-amber-50/70">
      <summary className="cursor-pointer list-none flex items-center gap-2 font-semibold text-gray-800 text-sm select-none [&::-webkit-details-marker]:hidden">
        <Info size={16} className="text-amber-700 shrink-0" aria-hidden />
        <span>Quick tips for staff</span>
        <ChevronDown
          size={16}
          className="ml-auto text-gray-500 transition-transform group-open:rotate-180 shrink-0"
          aria-hidden
        />
      </summary>
      <ul className="mt-2.5 space-y-1.5 pl-0.5 text-sm text-gray-700 list-disc list-inside marker:text-amber-700">
        {bullets.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
      {isAll && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          <a
            href="/owner/live-orders/drinks"
            className="inline-flex items-center rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition"
          >
            Open Drinks screen
          </a>
          <a
            href="/owner/live-orders/kitchen"
            className="inline-flex items-center rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition"
          >
            Open Kitchen screen
          </a>
        </div>
      )}
      <p className="mt-2.5 text-xs text-gray-600 border-t border-amber-200/60 pt-2">
        The list refreshes automatically every few seconds. If something looks stuck,{' '}
        <button
          type="button"
          onClick={onRefresh}
          className="font-semibold text-[#D95D1E] underline underline-offset-2 hover:text-[#b84a18]"
        >
          tap to refresh now
        </button>
        .
      </p>
    </details>
  );
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Cancel Order #{order.orderNumber}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Add a reason (optional)</p>
          </div>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D1E]"
          placeholder="Reason for cancellation…"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Keep Order
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition border border-red-100"
          >
            Cancel Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Log ──────────────────────────────────────────────────────────────

function ActivityLogEntry({ order }: { order: PastOrder }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">#{order.orderNumber}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-gray-50">
            {order.tableNumber}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
          }`}>
            {order.status}
          </span>
        </div>
        <div className="text-sm font-bold text-[#D95D1E]">₱{order.totalAmount.toFixed(2)}</div>
      </div>
      {order.cancellationReason && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
          <span className="font-bold uppercase mr-1">Reason:</span>
          {order.cancellationReason}
        </div>
      )}
      <div className="mt-3 space-y-1">
        {order.items.map((it, idx) => (
          <div key={idx} className="text-sm text-gray-700 flex justify-between">
            <span className="font-medium">{it.quantity}x {it.name}</span>
            <span className="text-gray-500">₱{it.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLogSection() {
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const session = await (await import('@/app/actions/auth')).getSessionAction();
        const branchId = session?.user?.branchId;
        if (!branchId) {
          setOrders([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const res = await getPastOrdersAction(branchId, { page, limit, dateFilter: dateFilter || undefined, searchQuery: searchQuery || undefined });
        if (!res.success) {
          setError(res.error || 'Failed to load activity log');
          setOrders([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        setOrders(res.orders as any);
        setTotalCount(res.totalCount ?? 0);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Failed to load activity log');
        setOrders([]);
        setTotalCount(0);
        setLoading(false);
      }
    })();
  }, [page, dateFilter, searchQuery]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  return (
    <section className="px-4 md:px-6 pb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Activity Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders…"
              className="pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600 w-[180px]"
            />
          </div>
          <input
            type="date"
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 text-gray-600"
          >
            <option value="ALL">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

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

// ─── StationDashboard ──────────────────────────────────────────────────────────

export default function StationDashboard({ station }: { station: Station }) {
  const { activeOrders, updateOrderStatus, updateStationStatus, isLoading, refreshActiveOrders } = useOrder();
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['CASH', 'GCASH', 'PAYMAYA']);

  const visibleOrders = useMemo(
    () => activeOrders.filter(o => o.status !== 'CANCELLED' && o.status !== 'COMPLETED'),
    [activeOrders],
  );

  const stationFilteredOrders = useMemo(() => {
    if (station === 'drink') {
      return visibleOrders.filter(o => o.drinkStationStatus === 'PREPARING' || o.drinkStationStatus === 'READY');
    }
    if (station === 'food') {
      return visibleOrders.filter(o => o.foodStationStatus === 'PREPARING' || o.foodStationStatus === 'READY');
    }
    return visibleOrders;
  }, [station, visibleOrders]);

  // Notifications are only relevant for the manager "all" view; avoid extra work on station screens.
  const notificationOrders = station === 'all' ? activeOrders : [];
  const { newOrderNotification, dismissNotification } = useOrderNotifications(notificationOrders, isLoading);

  const columns: { id: OrderStatus, title: string, bgColor: string, borderColor: string, icon: any }[] = [
    { id: 'PREPARING', title: 'Preparing', bgColor: 'bg-[#FFF5EB]', borderColor: 'border-[#E6894A]', icon: ChefHat },
    { id: 'READY', title: 'Ready', bgColor: 'bg-[#E8F5E9]', borderColor: 'border-[#4CAF50]', icon: CheckCircle },
  ];

  const ordersByStatus = useMemo(() => {
    const preparing: Order[] = [];
    const ready: Order[] = [];
    for (const o of stationFilteredOrders) {
      if (o.status === 'PREPARING') preparing.push(o);
      else if (o.status === 'READY') ready.push(o);
    }
    return { PREPARING: preparing, READY: ready } as const;
  }, [stationFilteredOrders]);

  const getOrdersByStatus = (status: OrderStatus) => {
    if (status === 'PREPARING') return ordersByStatus.PREPARING;
    if (status === 'READY') return ordersByStatus.READY;
    return [];
  };

  const handleCancelClick = (order: Order) => {
    setCancelModalOrder(order);
  };

  const handleConfirmCancel = (reason: string) => {
    if (cancelModalOrder) {
      updateOrderStatus(cancelModalOrder.id, 'CANCELLED', reason || undefined);
      setCancelModalOrder(null);
    }
  };

  const handlePaymentMethodChange = async (orderId: string, newMethod: string) => {
    const res = await updateOrderPaymentMethodAction(orderId, newMethod);
    if (res.success) {
      alert('Payment method updated');
      refreshActiveOrders();
    } else {
      alert('Failed to update payment method');
    }
  };

  useEffect(() => {
    (async () => {
      const methodsRes = await getCompanyPaymentMethodsAction();
      if (methodsRes.success && methodsRes.methods.length > 0) {
        setPaymentMethods(methodsRes.methods.map((m) => m.name));
      }
    })();
  }, []);

  const title =
    station === 'drink' ? 'Drinks Display' : station === 'food' ? 'Kitchen Display' : 'Kitchen Display';

  const queueCount = stationFilteredOrders.filter(o => o.status === 'PREPARING' || o.status === 'READY').length;

  const itemFilter = (order: Order) => {
    if (!order.items) return [];
    if (station === 'drink') return order.items.filter(isDrinkItem);
    if (station === 'food') return order.items.filter((it) => !isDrinkItem(it));
    return order.items;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {station === 'all' && newOrderNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#D95D1E] p-4 min-w-[320px] max-w-[90vw] flex items-center gap-4">
            <div className="bg-[#D95D1E]/10 p-2 rounded-lg">
              <Bell className="text-[#D95D1E]" size={24} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-lg mb-0.5">New Order Received! 🍽️</div>
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
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-5 md:pt-6 pb-4 md:pb-2">
        <h2 className="text-lg font-bold text-gray-900">Active preparation</h2>
        <p className="text-sm text-gray-500 mt-1">
          {queueCount} order{queueCount !== 1 ? 's' : ''} in queue
        </p>
        <StaffQuickTips station={station} onRefresh={() => void refreshActiveOrders()} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:hidden mt-0">
        <LiveOrdersTabsMobile
          columns={columns}
          getOrdersByStatus={getOrdersByStatus}
          updateOrderStatus={updateOrderStatus}
          onCancelClick={handleCancelClick}
          onPaymentMethodChange={handlePaymentMethodChange}
          paymentMethods={paymentMethods}
        />
      </div>

      <div className="overflow-x-auto px-6 pb-6 mt-4 hidden md:block">
        <div className="flex gap-4 h-full min-w-[max-content]">
          {columns.map(col => (
            <div key={col.id} className="w-80 flex flex-col h-full">
              <div className={`flex-1 rounded-xl border-2 ${col.borderColor} ${col.bgColor} flex flex-col min-h-[500px]`}>
                <div className="p-4 flex items-center gap-3">
                  <col.icon size={18} className="text-gray-600" />
                  <h3 className="font-semibold text-gray-800">{col.title}</h3>
                  <span className="ml-auto bg-white/80 px-2.5 py-0.5 rounded-md text-sm font-medium text-gray-600 border border-gray-200">
                    {col.id === 'PREPARING' ? ordersByStatus.PREPARING.length : ordersByStatus.READY.length}
                  </span>
                </div>

                <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto custom-scrollbar">
                  {(col.id === 'PREPARING' ? ordersByStatus.PREPARING : ordersByStatus.READY).map(order => (
                    <div key={order.id} className="p-4 rounded-xl shadow-sm border bg-white border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-xl text-gray-900">#{order.orderNumber}</span>
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
                            {paymentMethods.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>

                      {station === 'all' && order.status === 'PREPARING' && (order.drinkStationStatus !== undefined || order.foodStationStatus !== undefined) && (
                        <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
                          {stationBadgeText(order)}
                        </div>
                      )}

                      {order.note && (
                        <div className="bg-yellow-50 text-yellow-800 p-2 rounded-lg text-sm mb-3 border border-yellow-200">
                          <span className="font-bold block text-xs uppercase mb-1">Note:</span>
                          {order.note}
                        </div>
                      )}

                      <div className="space-y-1 mb-4">
                        {(() => {
                          const items = itemFilter(order);
                          if (items.length === 0) {
                            return <div className="text-xs text-gray-400 italic">No item details available</div>;
                          }
                          return items.map((item: any, idx: number) => (
                          <div key={idx} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                            <div className="flex justify-between items-start text-sm">
                              <div className="flex gap-2">
                                <span className="font-bold text-gray-900">{item.quantity}x</span>
                                <div className="flex flex-col">
                                  <span className="text-gray-800 font-medium">{item.name}</span>
                                  {item.options && (
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                      {Object.entries(item.options).map(([key, value]) => {
                                        if (key === 'tag' || key === 'bundleLabel' || key === '__optionIds' || key === 'itemDiscount') return null;
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
                                      {item.options.itemDiscount?.label ? (
                                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight border border-emerald-100">
                                          Discount: {String(item.options.itemDiscount.label)}
                                        </span>
                                      ) : null}
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
                          ));
                        })()}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 mb-3">
                        <div className="text-xs text-gray-500">
                          {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-lg font-bold text-[#D95D1E]">₱{order.total.toFixed(2)}</div>
                      </div>

                      {col.id === 'PREPARING' && (
                        station === 'drink' ? (
                          order.drinkStationStatus === 'READY' ? (
                            <StationReadyBadge label="Drinks marked ready" />
                          ) : (
                            <button
                              onClick={() => updateStationStatus(order.id, 'drink')}
                              className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                            >
                              Mark Drinks Ready →
                            </button>
                          )
                        ) : station === 'food' ? (
                          order.foodStationStatus === 'READY' ? (
                            <StationReadyBadge label="Food marked ready" />
                          ) : (
                            <button
                              onClick={() => updateStationStatus(order.id, 'food')}
                              className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                            >
                              Mark Food Ready →
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="w-full py-2 bg-green-50 text-green-600 font-bold text-sm rounded-lg hover:bg-green-100 transition"
                          >
                            Mark Ready →
                          </button>
                        )
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

                  {(col.id === 'PREPARING' ? ordersByStatus.PREPARING.length : ordersByStatus.READY.length) === 0 && (
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

      <div className="mx-4 md:mx-6 my-2 border-t border-gray-200" />

      {station === 'all' && <ActivityLogSection />}

      <CancelConfirmModal
        isOpen={cancelModalOrder !== null}
        order={cancelModalOrder}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelModalOrder(null)}
      />
    </div>
  );
}


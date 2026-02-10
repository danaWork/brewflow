'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from './CartContext';
import { useTable } from './TableContext';
import {
  createOrderAction,
  getActiveOrdersAction,
  updateOrderStatusAction,
} from '@/app/actions/orders';
import { getSessionAction } from '@/app/actions/auth';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  table: string;
  tableId?: string;
  timestamp: Date;
  paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA';
}

interface OrderContextType {
  userOrders: Order[];
  activeOrders: Order[];
  createOrder: (items: CartItem[], total: number, paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA') => Promise<{ id: string } | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  dismissOrder: (orderId: string) => void;
  refreshActiveOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  const { tableId: currentTableId, tableName: currentTableName, branchId: currentBranchId } = useTable();

  const refreshActiveOrders = useCallback(async () => {
    // Both customers and staff might use this, but staff definitely need it for dashboard.
    // Customers might use it to see their own active orders if we implemented that.

    // For staff/owner dashboard, we get the branchId from session.
    const session = await getSessionAction();
    const branchId = session?.user?.branchId || currentBranchId;

    if (!branchId) return;

    const result = await getActiveOrdersAction(branchId);

    if (!result.success || !result.orders) {
      console.error('Error fetching orders:', result.error);
      return;
    }

    const orders: Order[] = result.orders.map((o) => ({
      id: o.id,
      status: o.status as OrderStatus,
      items: [], // Items are in a separate table now, would need a join/fetch if really needed here.
      total: o.totalAmount,
      table: o.tableNumber || 'Unknown Table',
      tableId: o.tableId || undefined,
      timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
      paymentMethod: (o.paymentMethod as any) || 'CASH'
    }));

    setActiveOrders(orders);
  }, [currentBranchId]);

  useEffect(() => {
    const savedUserOrders = localStorage.getItem('coffee-shop-user-orders');
    if (savedUserOrders) {
      try {
        const parsed = JSON.parse(savedUserOrders);
        const fixed = parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
        setUserOrders(fixed);
      } catch (e) { }
    }

    refreshActiveOrders();

    const interval = setInterval(refreshActiveOrders, 10000);
    return () => clearInterval(interval);
  }, [refreshActiveOrders]);

  useEffect(() => {
    localStorage.setItem('coffee-shop-user-orders', JSON.stringify(userOrders));
  }, [userOrders]);

  const createOrder = async (items: CartItem[], total: number, paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA') => {
    try {
      if (!currentBranchId || !currentTableId) {
        console.error('Missing branchId or tableId');
        return null;
      }

      const result = await createOrderAction({
        branchId: currentBranchId,
        tableId: currentTableId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          priceAtTime: item.price
        })),
        totalAmount: total,
        paymentMethod,
      });

      if (!result.success || !result.order) {
        console.error('Error creating order:', result.error);
        return null;
      }

      const orderData = result.order;
      const newOrder: Order = {
        id: orderData.id,
        status: 'PENDING',
        items: items,
        total,
        table: currentTableName || 'Unknown Table',
        tableId: currentTableId,
        timestamp: new Date(),
        paymentMethod
      };

      setUserOrders(prev => [newOrder, ...prev]);
      refreshActiveOrders();

      return { id: orderData.id };
    } catch (e) {
      console.error('Failed to create order:', e);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setActiveOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));
    setUserOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));

    const result = await updateOrderStatusAction(orderId, status);
    if (!result.success) {
      console.error('Error updating order status:', result.error);
    }
  };

  const dismissOrder = (orderId: string) => {
    setUserOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <OrderContext.Provider value={{
      userOrders,
      activeOrders,
      createOrder,
      updateOrderStatus,
      dismissOrder,
      refreshActiveOrders
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

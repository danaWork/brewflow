'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from './CartContext';
import { useTable } from './TableContext';
import {
  createOrderAction,
  getActiveOrdersAction,
  updateOrderStatusAction,
  OrderData
} from '@/app/actions/orders';
import { getTables } from '@/app/actions/tables';

export type OrderStatus = 'payment' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderItem = CartItem;

export interface Order {
  id: string;
  orderNumber?: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  table: string;
  tableId?: string;
  timestamp: Date;
  specialInstructions?: string;
  paymentMethod: string;
}

interface OrderContextType {
  userOrders: Order[];
  activeOrders: Order[];
  createOrder: (items: CartItem[], total: number, paymentMethod: string, specialInstructions?: string) => Promise<{ id: string; orderNumber: number } | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  dismissOrder: (orderId: string) => void;
  refreshActiveOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  const { tableId: currentTableId, tableName: currentTableName } = useTable();

  const refreshActiveOrders = useCallback(async () => {
    const result = await getActiveOrdersAction();

    if (!result.success || !result.orders) {
      console.error('Error fetching orders:', result.error);
      return;
    }

    const orders: Order[] = result.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderStatus,
      items: (o.items as OrderItem[]) || [],
      total: typeof o.total === 'string' ? parseFloat(o.total) : o.total,
      table: o.tableName || 'Unknown Table',
      tableId: o.tableId || undefined,
      timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
      specialInstructions: o.specialInstructions || undefined,
      paymentMethod: o.paymentMethod || 'Cash'
    }));


    setActiveOrders(orders);
  }, []);

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

    // Note: Realtime removed for Cloudflare Pages/Neon DB simplification. 
    // Could be implemented via polling or Cloudflare Pub/Sub if needed.
    const interval = setInterval(refreshActiveOrders, 10000); // Simple polling fallback
    return () => clearInterval(interval);
  }, [refreshActiveOrders]);

  useEffect(() => {
    localStorage.setItem('coffee-shop-user-orders', JSON.stringify(userOrders));
  }, [userOrders]);

  const createOrder = async (items: CartItem[], total: number, paymentMethod: string, specialInstructions?: string) => {
    try {
      let tableId: string | null = null;
      let tableName = currentTableName || 'Unknown Table';

      if (currentTableId) {
        const { tables } = await getTables();
        const foundTable = tables.find(t => t.qrCode === currentTableId);
        if (foundTable) {
          tableId = foundTable.id;
          tableName = foundTable.name;
        }
      }

      const result = await createOrderAction({
        tableId,
        items,
        total,
        paymentMethod,
        specialInstructions,
      });

      if (!result.success || !result.order) {
        console.error('Error creating order:', result.error);
        return null;
      }

      const orderData = result.order;
      const newOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        status: 'payment',
        items: items,
        total,
        table: tableName,
        tableId: tableId || undefined,
        timestamp: new Date(),
        specialInstructions,
        paymentMethod
      };

      setUserOrders(prev => [newOrder, ...prev]);
      refreshActiveOrders();

      return { id: orderData.id, orderNumber: orderData.orderNumber };
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

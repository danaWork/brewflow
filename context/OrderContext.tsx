'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from './CartContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type OrderStatus = 'payment' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderItem = CartItem;

export interface Order {
  id: string;
  orderNumber?: number; // Sequential order number for display
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  table: string;
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

  // Fetch active orders from Supabase
  const refreshActiveOrders = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    
    // @ts-ignore - Supabase types not correctly inferring
    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(name)')
      .in('status', ['payment', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    const ordersData = data as any[] || [];
    const orders: Order[] = ordersData.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number, // Sequential order number
      status: o.status as OrderStatus,
      items: o.items || [],
      total: parseFloat(o.total),
      table: o.tables?.name || 'Unknown',
      timestamp: new Date(o.created_at),
      specialInstructions: o.special_instructions,
      paymentMethod: o.payment_method || 'Cash'
    }));

    setActiveOrders(orders);
  }, []);

  // Initial load and realtime subscription
  useEffect(() => {
    // Load user orders from local storage
    const savedUserOrders = localStorage.getItem('coffee-shop-user-orders');
    if (savedUserOrders) {
      try {
        const parsed = JSON.parse(savedUserOrders);
        const fixed = parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
        setUserOrders(fixed);
      } catch (e) {}
    }

    // Fetch active orders from database
    refreshActiveOrders();

    // REALTIME SUBSCRIPTION
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime INSERT:', payload);
          const newOrder = {
            id: payload.new.id,
            status: payload.new.status,
            items: payload.new.items,
            total: parseFloat(payload.new.total),
            table: 'Table 1',
            timestamp: new Date(payload.new.created_at),
            specialInstructions: payload.new.special_instructions,
            paymentMethod: payload.new.payment_method || 'Cash'
          } as Order;

          setActiveOrders(prev => [newOrder, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime UPDATE:', payload);
          const updatedStatus = payload.new.status as OrderStatus;
          const orderId = payload.new.id;

          // If status is completed/cancelled, remove from active
          if (['completed', 'cancelled'].includes(updatedStatus)) {
            setActiveOrders(prev => prev.filter(o => o.id !== orderId));
          } else {
            setActiveOrders(prev => prev.map(o =>
              o.id === orderId ? { ...o, status: updatedStatus } : o
            ));
          }
          setUserOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: updatedStatus } : o
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshActiveOrders]);

  // Persist user orders to localStorage
  useEffect(() => {
    localStorage.setItem('coffee-shop-user-orders', JSON.stringify(userOrders));
  }, [userOrders]);

  // Create order directly via Supabase
  const createOrder = async (items: CartItem[], total: number, paymentMethod: string, specialInstructions?: string) => {
    if (!isSupabaseConfigured) {
      console.error('Supabase not configured');
      return null;
    }

    try {
      // @ts-ignore - Supabase types not correctly inferring
      const tableResult = await supabase
        .from('tables')
        .select('id')
        .eq('qr_code', 'table-1')
        .single();

      // @ts-ignore
      const tableId = tableResult.data ? (tableResult.data as any).id : null;

      // @ts-ignore - Supabase types not correctly inferring
      const { data, error } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          status: 'payment',
          total: total.toString(),
          items: items as any,
          special_instructions: specialInstructions,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return null;
      }

      const orderData = data as any;
      const newOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.order_number, // Include order number for display
        status: 'payment',
        items: items,
        total,
        table: 'Table 1',
        timestamp: new Date(),
        specialInstructions,
        paymentMethod
      };

      setUserOrders(prev => [newOrder, ...prev]);
      // Note: activeOrders will update via realtime subscription

      return { id: orderData.id, orderNumber: orderData.order_number };
    } catch (e) {
      console.error('Failed to create order:', e);
      return null;
    }
  };

  // Update order status via Supabase
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Optimistic UI update
    setActiveOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));
    setUserOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status } : o
    ));

    // Persist to database
    if (isSupabaseConfigured) {
      // @ts-ignore
      const { error } = await supabase
        .from('orders')
        // @ts-ignore
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        // Could revert optimistic update here if needed
      }
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

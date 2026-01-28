'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from './CartContext'; // Import reuse
import { createOrder as createOrderAction } from '@/app/actions/order'; // Import real action
import { supabase } from '@/lib/supabase';

export type OrderStatus = 'payment' | 'preparing' | 'ready' | 'completed';

// Reuse CartItem as OrderItem structure to ensure fidelity
export type OrderItem = CartItem;

export interface Order {
  id: string; // e.g. "#046"
  status: OrderStatus;
  items: OrderItem[];
  total: number; // Stored as a snapshot
  table: string;
  timestamp: Date;
  specialInstructions?: string; // Add this
}

interface OrderContextType {
  userOrders: Order[]; // Multiple orders for the current user
  activeOrders: Order[]; // For owner view (global mock)
  createOrder: (items: CartItem[], total: number, specialInstructions?: string) => Promise<string | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  dismissOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]); // Mock owner view

  // Hydrate from local storage for persistence across refreshes
  // Hydrate from local storage for persistence across refreshes
  useEffect(() => {
    // Load local storage first (simulated history)
    const savedUserOrders = localStorage.getItem('coffee-shop-user-orders');
    if (savedUserOrders) {
        try {
            const parsed = JSON.parse(savedUserOrders);
            const fixed = parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
            setUserOrders(fixed);
        } catch (e) {}
    }
    const savedActive = localStorage.getItem('coffee-shop-active-orders');
    if (savedActive) {
        try {
            const parsed = JSON.parse(savedActive);
            const fixed = parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
            setActiveOrders(fixed);
        } catch (e) {}
    }

    // REALTIME SUBSCRIPTION
    // If supabase is not initialized (missing keys), skip subscription
    if (!supabase) return;

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
            table: 'Table 1', // In real app, fetch table name
            timestamp: new Date(payload.new.created_at),
            specialInstructions: payload.new.special_instructions
          } as Order;

          setActiveOrders(prev => [newOrder, ...prev]);
          // Note: In a real app we'd filter if this order belongs to current user
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime UPDATE:', payload);
          const updatedStatus = payload.new.status;
          const orderId = payload.new.id;

          setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedStatus } : o));
          setUserOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updatedStatus } : o));
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  // Persist changes
  useEffect(() => {
    localStorage.setItem('coffee-shop-user-orders', JSON.stringify(userOrders));
  }, [userOrders]);

  useEffect(() => {
      localStorage.setItem('coffee-shop-active-orders', JSON.stringify(activeOrders));
  }, [activeOrders]);

  const createOrder = async (items: CartItem[], total: number, specialInstructions?: string) => {
    // Generate a shorter ID for display, e.g. #047
    const id = `#0${Math.floor(Math.random() * 89) + 10}`; 
    
    const newOrder: Order = {
        id,
        status: 'payment',
        items: items, 
        total,
        table: 'Table 1',
        timestamp: new Date(),
        specialInstructions
    };
    
    // Call Server Action (Fire and forget or await?)
    try {
       const res = await createOrderAction(items, total, 'table-1', specialInstructions); 
       if (res.success && res.orderId) {
           // In a real app we'd use the server ID
       }
    } catch (e) {
        console.error("Failed to sync order to server", e);
    }

    // Append to list instead of replace
    setUserOrders(prev => [newOrder, ...prev]); // Newest first
    setActiveOrders(prev => [newOrder, ...prev]);
    
    return id;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
      // Update global list (Owner View)
      setActiveOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status } : o
      ));

      // Update user specific orders
      setUserOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, status } : o
      ));
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
        dismissOrder
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

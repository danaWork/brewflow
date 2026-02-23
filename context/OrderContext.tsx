'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from './CartContext';
import { useTable } from '@/context/TableContext';
import {
  createOrderAction,
  getActiveOrdersAction,
  updateOrderStatusAction,
  getOrdersStatusAction,
} from '@/app/actions/orders';
import { getSessionAction } from '@/app/actions/auth';

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  table: string;
  tableId?: string;
  timestamp: Date;
  paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA';
  note?: string;
}

interface OrderContextType {
  userOrders: Order[];
  activeOrders: Order[];
  createOrder: (items: CartItem[], total: number, paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA', note?: string) => Promise<{ id: string; orderNumber: number } | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  dismissOrder: (orderId: string) => void;
  refreshActiveOrders: () => Promise<void>;
  isLoading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [userOrders, setUserOrders] = useState<Order[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('coffee-shop-user-orders');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }));
    } catch (e) {
      return [];
    }
  });
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userOrdersRef = useRef<Order[]>([]);
  const sessionRef = useRef<{ branchId: string | null; timestamp: number } | null>(null);
  const isRefreshingRef = useRef(false);

  const { tableId: currentTableId, tableName: currentTableName, branchId: currentBranchId } = useTable();

  // Keep ref in sync with state
  useEffect(() => {
    userOrdersRef.current = userOrders;
  }, [userOrders]);

  const refreshActiveOrders = useCallback(async () => {
    // Prevent concurrent calls
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      // Both customers and staff might use this, but staff definitely need it for dashboard.
      // Customers might use it to see their own active orders if we implemented that.

      // Always prefer the session branchId (staff kitchen dashboard).
      // This prevents stale localStorage from a customer session on the same
      // device routing kitchen orders to the wrong shop.
      let branchId: string | null = null;

      const now = Date.now();
      const cachedSession = sessionRef.current;

      // Use cached session if it's fresh (less than 30 seconds old)
      if (cachedSession && (now - cachedSession.timestamp) < 30000) {
        branchId = cachedSession.branchId;
      } else {
        const session = await getSessionAction();
        branchId = session?.user?.branchId || null;
        sessionRef.current = { branchId, timestamp: now };
      }

      // Fallback to TableContext branchId for unauthenticated customers
      if (!branchId) {
        branchId = currentBranchId;
      }

      if (!branchId) {
        isRefreshingRef.current = false;
        // If we can't get branchId, we can't load orders, so we stop loading
        setIsLoading(false);
        return;
      }

      const result = await getActiveOrdersAction(branchId);

      if (!result.success || !result.orders) {
        console.error('Error fetching orders:', result.error);
        isRefreshingRef.current = false;
        setIsLoading(false);
        return;
      }

      const orders: Order[] = (result.orders as any[]).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status as OrderStatus,
        items: o.items || [],
        total: o.totalAmount,
        table: o.tableNumber || 'Unknown Table',
        tableId: o.tableId || undefined,
        timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
        paymentMethod: (o.paymentMethod as any) || 'CASH'
      }));

      setActiveOrders(orders);
      setIsLoading(false);

      // Individually sync userOrders statuses, especially for those that might have been COMPLETED
      // Use ref to avoid dependency on userOrders which would cause infinite loop
      const currentUserOrders = userOrdersRef.current;
      if (currentUserOrders.length > 0) {
        const userOrderIds = currentUserOrders.map(o => o.id);
        const statusResult = await getOrdersStatusAction(userOrderIds);

        if (statusResult.success && statusResult.orders) {
          setUserOrders(prev => prev.map(userOrder => {
            const match = statusResult.orders?.find(so => so.id === userOrder.id);
            if (match && match.status !== userOrder.status) {
              return { ...userOrder, status: match.status as OrderStatus };
            }
            return userOrder;
          }));
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [currentBranchId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Initial refresh
    refreshActiveOrders().then(() => {
      // Only set up interval if we have a branchId (either from table context or session)
      if (isMounted) {
        const hasBranchId = sessionRef.current?.branchId || currentBranchId;
        if (hasBranchId) {
          intervalId = setInterval(refreshActiveOrders, 10000);
        }
      }
    });

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshActiveOrders, currentBranchId]);

  useEffect(() => {
    localStorage.setItem('coffee-shop-user-orders', JSON.stringify(userOrders));
  }, [userOrders]);

  const createOrder = async (items: CartItem[], total: number, paymentMethod: 'CASH' | 'GCASH' | 'PAYMAYA', note?: string) => {
    try {
      if (!currentBranchId || !currentTableId) {
        console.error('Missing branchId or tableId');
        return null;
      }

      // Flatten items and their extras for the database
      const itemsToPrepare: any[] = [];
      items.forEach(item => {
        // Add main item
        itemsToPrepare.push({
          productId: item.productId,
          name: item.name, // Pass name for optimistic update
          quantity: item.quantity,
          priceAtTime: item.price,
          customizations: {
             ...item.options,
             bundleLabel: item.bundleLabel,
             tag: item.tag
          }
        });

        // Add extras if any
        if (item.extras && item.extras.length > 0) {
          item.extras.forEach(extra => {
            const extraQty = extra.quantity || 1;
            itemsToPrepare.push({
              productId: extra.productId,
              name: extra.name, // Pass name for optimistic update
              quantity: extraQty, // DECOUPLED: Use absolute quantity
              priceAtTime: extra.price,
              customizations: {
                ...extra.options,
                tag: extra.tag || 'EXTRA'
              }
            });
          });
        }
      });

      const result = await createOrderAction({
        branchId: currentBranchId,
        tableId: currentTableId,
        items: itemsToPrepare,
        totalAmount: total,
        paymentMethod,
        note,
      });

      if (!result.success || !result.order) {
        console.error('Error creating order:', result.error);
        return null;
      }

      const orderData = result.order;
      const newOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        status: 'PENDING',
        items: itemsToPrepare.map(item => ({
          id: `${item.productId}-${Date.now()}`,
          productId: item.productId,
          name: item.name, 
          price: item.priceAtTime,
          quantity: item.quantity,
          options: item.customizations,
          bundleLabel: item.customizations?.bundleLabel,
          tag: item.customizations?.tag
        })),
        total,
        table: currentTableName || 'Unknown Table',
        tableId: currentTableId,
        timestamp: new Date(),
        paymentMethod,
        note
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
      refreshActiveOrders,
      isLoading
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

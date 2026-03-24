"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { CartItem } from "./CartContext";
import { useTable } from "@/context/TableContext";
import {
  createOrderAction,
  getActiveOrdersAction,
  updateOrderStatusAction,
  getOrdersStatusAction,
  updateOrderPaymentStatusAction,
  updatePOSOrderAction,
} from "@/app/actions/orders";
import { getSessionAction } from "@/app/actions/auth";

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  table: string;
  tableId?: string;
  timestamp: Date;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PAID";
  discountAmount?: number;
  discountName?: string | null;
  note?: string;
  cancellationReason?: string | null;
}

interface OrderContextType {
  userOrders: Order[];
  activeOrders: Order[];
  createOrder: (
    items: CartItem[],
    total: number,
    paymentMethod: string,
    note?: string,
  ) => Promise<
    | { id: string; orderNumber: number }
    | { success: false; error: string }
    | null
  >;
  updateOrder: (
    orderId: string,
    items: CartItem[],
    subtotalAmount: number,
    discountAmount: number,
    discountName: string | null,
    totalAmount: number,
    paymentMethod: string,
    paymentStatus: "UNPAID" | "PAID",
    status: OrderStatus,
    note?: string,
  ) => Promise<{ success: boolean }>;
  updateOrderStatus: (orderId: string, status: OrderStatus, cancellationReason?: string) => Promise<void>;
  updateOrderPaymentStatus: (
    orderId: string,
    status: "UNPAID" | "PAID",
  ) => Promise<void>;
  dismissOrder: (orderId: string) => void;
  refreshActiveOrders: () => Promise<void>;
  isLoading: boolean;
  /** Set when a user order was updated by staff (e.g. from POS); clear after showing notification */
  orderUpdatedOrderId: string | null;
  clearOrderUpdatedNotification: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [userOrders, setUserOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("coffee-shop-user-orders");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Filter out items that are already COMPLETED or CANCELLED from previous sessions
      return parsed
        .map((o: any) => ({ ...o, timestamp: new Date(o.timestamp) }))
        .filter(
          (o: Order) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
        );
    } catch (e) {
      return [];
    }
  });
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderUpdatedOrderId, setOrderUpdatedOrderId] = useState<string | null>(
    null,
  );
  const userOrdersRef = useRef<Order[]>([]);
  const sessionRef = useRef<{
    branchId: string | null;
    timestamp: number;
  } | null>(null);
  const isRefreshingRef = useRef(false);

  const {
    tableId: currentTableId,
    tableName: currentTableName,
    branchId: currentBranchId,
  } = useTable();

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
      if (cachedSession && now - cachedSession.timestamp < 30000) {
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
        console.error("Error fetching orders:", result.error);
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
        table: o.tableNumber || "Unknown Table",
        tableId: o.tableId || undefined,
        timestamp: o.createdAt ? new Date(o.createdAt) : new Date(),
        paymentMethod: (o.paymentMethod as any) || "CASH",
        paymentStatus: o.paymentStatus || "UNPAID",
        discountAmount: o.discountAmount,
        discountName: o.discountName,
        note: o.note,
        cancellationReason: o.cancellationReason ?? null,
      }));

      setActiveOrders(orders);
      setIsLoading(false);

      // Sync userOrders with full server data so table side sees manager updates (items, total, status)
      const currentUserOrders = userOrdersRef.current;
      let orderUpdatedNotifyId: string | null = null;
      if (currentUserOrders.length > 0 && orders.length > 0) {
        const ordersById = new Map(orders.map((o: Order) => [o.id, o]));
        const updatedUserOrders = currentUserOrders.map((userOrder) => {
          const serverOrder = ordersById.get(userOrder.id) as Order | undefined;
          if (!serverOrder) return userOrder;
          const serverItems: CartItem[] = (serverOrder.items || []).map(
            (item: any, idx: number) => ({
              id: item.id ?? `${item.productId ?? "custom"}-${idx}`,
              productId: item.productId ?? "",
              name: item.name ?? "Unknown",
              price:
                typeof item.price === "number" ? item.price : (item.price ?? 0),
              quantity: item.quantity ?? 1,
              options: item.options,
              bundleLabel: item.options?.bundleLabel,
              tag: item.options?.tag,
            }),
          );
          const itemsChanged =
            JSON.stringify(userOrder.items) !== JSON.stringify(serverItems);
          const totalChanged = userOrder.total !== serverOrder.total;
          if (itemsChanged || totalChanged) {
            orderUpdatedNotifyId = serverOrder.id;
          }
          return {
            id: serverOrder.id,
            orderNumber: serverOrder.orderNumber,
            status: serverOrder.status,
            items: serverItems,
            total: serverOrder.total,
            table: serverOrder.table,
            tableId: serverOrder.tableId,
            timestamp: serverOrder.timestamp,
            paymentMethod: serverOrder.paymentMethod,
            paymentStatus: serverOrder.paymentStatus,
            discountAmount: serverOrder.discountAmount,
            discountName: serverOrder.discountName,
            note: serverOrder.note,
            cancellationReason: serverOrder.cancellationReason,
          };
        });
        setUserOrders(updatedUserOrders);
        if (orderUpdatedNotifyId) {
          setOrderUpdatedOrderId(orderUpdatedNotifyId);
        }
      }

      // Sync status for user orders that might be completed/cancelled (no longer in active list)
      const userOrderIds = currentUserOrders.map((o) => o.id);
      const statusResult = await getOrdersStatusAction(userOrderIds);
      if (statusResult.success && statusResult.orders) {
        setUserOrders((prev) =>
          prev.map((userOrder) => {
            const match = statusResult.orders?.find(
              (so: { id: string; status: string }) => so.id === userOrder.id,
            );
            if (match && match.status !== userOrder.status) {
              return {
                ...userOrder,
                status: match.status as OrderStatus,
                cancellationReason: match.cancellationReason ?? userOrder.cancellationReason,
              };
            }
            return userOrder;
          }),
        );
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
    localStorage.setItem("coffee-shop-user-orders", JSON.stringify(userOrders));
  }, [userOrders]);

  const createOrder = async (
    items: CartItem[],
    total: number,
    paymentMethod: string,
    note?: string,
  ) => {
    try {
      if (!currentBranchId || !currentTableId) {
        console.error("Missing branchId or tableId");
        return null;
      }

      // Flatten items and their extras for the database
      const itemsToPrepare: any[] = [];
      items.forEach((item) => {
        // Add main item
        itemsToPrepare.push({
          productId: item.productId,
          name: item.name, // Pass name for optimistic update
          quantity: item.quantity,
          priceAtTime: item.price,
          customizations: {
            ...item.options,
            bundleLabel: item.bundleLabel,
            tag: item.tag,
          },
        });

        // Add extras if any
        if (item.extras && item.extras.length > 0) {
          item.extras.forEach((extra) => {
            const extraQty = extra.quantity || 1;
            itemsToPrepare.push({
              productId: extra.productId,
              name: extra.name, // Pass name for optimistic update
              quantity: extraQty, // DECOUPLED: Use absolute quantity
              priceAtTime: extra.price,
              customizations: {
                ...extra.options,
                tag: extra.tag || "EXTRA",
              },
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
        const message =
          (result as { error?: string }).error || "Failed to create order";
        return { success: false as const, error: message };
      }

      const orderData = result.order;
      const newOrder: Order = {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        status: "PENDING",
        items: itemsToPrepare.map((item) => ({
          id: `${item.productId}-${Date.now()}`,
          productId: item.productId,
          name: item.name,
          price: item.priceAtTime,
          quantity: item.quantity,
          options: item.customizations,
          bundleLabel: item.customizations?.bundleLabel,
          tag: item.customizations?.tag,
        })),
        total,
        table: currentTableName || "Unknown Table",
        tableId: currentTableId,
        timestamp: new Date(),
        paymentMethod,
        paymentStatus: "UNPAID",
        discountAmount: 0,
        discountName: null,
        note: note,
      };

      setUserOrders((prev) => [newOrder, ...prev]);
      refreshActiveOrders();

      return { id: orderData.id, orderNumber: orderData.orderNumber };
    } catch (e) {
      console.error("Failed to create order:", e);
      return {
        success: false as const,
        error: "Something went wrong. Please try again.",
      };
    }
  };

  const updateOrder = async (
    orderId: string,
    items: CartItem[],
    subtotalAmount: number,
    discountAmount: number,
    discountName: string | null,
    totalAmount: number,
    paymentMethod: string,
    paymentStatus: "UNPAID" | "PAID",
    status: OrderStatus,
    note?: string,
  ) => {
    try {
      const itemsToPrepare: any[] = [];
      items.forEach((item) => {
        itemsToPrepare.push({
          productId: item.productId,
          customName: item.customName,
          quantity: item.quantity,
          priceAtTime: item.price,
          customizations: {
            ...item.options,
            bundleLabel: item.bundleLabel,
            tag: item.tag,
          },
        });
        if (item.extras && item.extras.length > 0) {
          item.extras.forEach((extra) => {
            const extraQty = extra.quantity || 1;
            itemsToPrepare.push({
              productId: extra.productId,
              customName: null,
              quantity: extraQty,
              priceAtTime: extra.price,
              customizations: {
                ...extra.options,
                tag: extra.tag || "EXTRA",
              },
            });
          });
        }
      });

      const result = await updatePOSOrderAction({
        orderId,
        items: itemsToPrepare,
        subtotalAmount,
        discountAmount,
        discountName,
        totalAmount,
        paymentMethod,
        paymentStatus,
        status,
        note,
      });

      if (result.success) {
        refreshActiveOrders();
      }
      return result;
    } catch (e) {
      console.error("Failed to update order:", e);
      return { success: false };
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, cancellationReason?: string) => {
    const reasonPatch = status === "CANCELLED" ? { cancellationReason: cancellationReason ?? null } : {};
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...reasonPatch } : o)),
    );
    setUserOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, ...reasonPatch } : o)),
    );

    const result = await updateOrderStatusAction(orderId, status, cancellationReason);
    if (!result.success) {
      console.error("Error updating order status:", result.error);
    }
  };

  const updateOrderPaymentStatus = async (
    orderId: string,
    paymentStatus: "UNPAID" | "PAID",
  ) => {
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o)),
    );
    setUserOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o)),
    );

    const result = await updateOrderPaymentStatusAction(orderId, paymentStatus);
    if (!result.success) {
      console.error("Error updating payment status:", result.error);
    }
  };

  const dismissOrder = (orderId: string) => {
    setUserOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const clearOrderUpdatedNotification = () => {
    setOrderUpdatedOrderId(null);
  };

  return (
    <OrderContext.Provider
      value={{
        userOrders,
        activeOrders,
        createOrder,
        updateOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        dismissOrder,
        refreshActiveOrders,
        isLoading,
        orderUpdatedOrderId,
        clearOrderUpdatedNotification,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}

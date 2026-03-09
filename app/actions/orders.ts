"use server";

import { db } from "@/lib/db";
import {
  orders as ordersSchema,
  tables as tablesSchema,
  orderItems as orderItemsSchema,
  products as productsSchema,
} from "@/db/schema";
import { eq, inArray, desc, and, gte, lte, or, sql, ilike } from "drizzle-orm";
export interface OrderData {
  id: string;
  orderNumber: number;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  totalAmount: number;
  tableId: string;
  tableNumber: string;
  createdAt: Date;
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA" | null;
  paymentStatus: "UNPAID" | "PAID";
}

function getStartOfOperationalDay(): Date {
  const now = new Date();
  // Manila is UTC+8
  const MANILA_OFFSET = 8 * 60 * 60 * 1000;
  const manilaTime = new Date(now.getTime() + MANILA_OFFSET);

  let year = manilaTime.getUTCFullYear();
  let month = manilaTime.getUTCMonth();
  let date = manilaTime.getUTCDate();
  let hour = manilaTime.getUTCHours();

  // The operational day starts at 6:00 AM Manila time.
  // If it's before 6:00 AM, we are still on the previous day's operational day.
  if (hour < 6) {
    date = date - 1;
  }

  // Construct nominal Manila 6:00 AM in UTC
  const startOfOpDayManila = new Date(Date.UTC(year, month, date, 6, 0, 0, 0));

  // Convert back to absolute UTC by subtracting the offset
  return new Date(startOfOpDayManila.getTime() - MANILA_OFFSET);
}

export async function createOrderAction(data: {
  branchId: string;
  tableId: string;
  items: {
    productId: string;
    quantity: number;
    priceAtTime: number;
    customizations?: any;
  }[];
  totalAmount: number;
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  note?: string;
}) {
  try {
    if (!data.branchId || !data.tableId) {
      return {
        success: false,
        error: "Missing table or branch. Please scan the table QR code again.",
      };
    }
    if (!data.items?.length) {
      return { success: false, error: "Order must have at least one item." };
    }
    const totalAmount = Number(data.totalAmount);
    if (isNaN(totalAmount) || totalAmount < 0) {
      return { success: false, error: "Invalid order total." };
    }
    const startOfOperationalDay = getStartOfOperationalDay();

    // Calculate the next order number for this branch for today
    const [latestOrder] = await db
      .select({ orderNumber: ordersSchema.orderNumber })
      .from(ordersSchema)
      .where(
        and(
          eq(ordersSchema.branchId, data.branchId),
          gte(ordersSchema.createdAt, startOfOperationalDay),
        ),
      )
      .orderBy(desc(ordersSchema.orderNumber))
      .limit(1);

    const nextOrderNumber =
      latestOrder && latestOrder.orderNumber ? latestOrder.orderNumber + 1 : 1;

    const validItems = data.items.filter(
      (
        item,
      ): item is {
        productId: string;
        quantity: number;
        priceAtTime: number;
        customizations?: any;
      } =>
        Boolean(
          item?.productId &&
          typeof item.quantity === "number" &&
          typeof item.priceAtTime === "number",
        ),
    );
    if (validItems.length !== data.items.length) {
      return {
        success: false,
        error: "Some items are invalid. Please refresh and try again.",
      };
    }

    const productIds = [...new Set(validItems.map((i) => i.productId))];
    const existingProducts = await db
      .select({ id: productsSchema.id })
      .from(productsSchema)
      .where(inArray(productsSchema.id, productIds));
    const existingIds = new Set(existingProducts.map((p) => p.id));
    const missingIds = productIds.filter((id) => !existingIds.has(id));
    console.log("missingIds", missingIds);
    console.log("existingIds", existingIds);
    console.log("productIds", productIds);
    console.log("validItems", validItems);
    if (missingIds.length > 0) {
      return {
        success: false,
        error:
          "One or more items are no longer available. Please update your cart and try again.",
      };
    }

    const insertedOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(ordersSchema)
        .values({
          branchId: data.branchId,
          tableId: data.tableId,
          orderNumber: nextOrderNumber,
          status: "PENDING",
          totalAmount: String(totalAmount),
          paymentMethod: data.paymentMethod,
          note: data.note ?? null,
        })
        .returning();
      if (!order) throw new Error("Failed to create order");
      await tx.insert(orderItemsSchema).values(
        validItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: String(Number(item.priceAtTime)),
          customizations:
            item.customizations && typeof item.customizations === "object"
              ? JSON.stringify(item.customizations)
              : typeof item.customizations === "string"
                ? item.customizations
                : null,
        })),
      );
      return order;
    });

    return { success: true, order: insertedOrder };
  } catch (error: any) {
    const pgCode = error?.cause?.code ?? error?.code;
    const message = error?.message || "Failed to create order";
    const userMessage =
      pgCode === "23503"
        ? "One or more items are no longer available or the table is invalid. Please update your cart or scan the table QR code again."
        : "Unable to create order. Please try again.";
    console.error("createOrderAction error:", {
      message,
      code: pgCode,
      detail: error?.cause?.detail ?? error?.detail,
    });
    return { success: false, error: userMessage };
  }
}

export async function getActiveOrdersAction(branchId: string) {
  try {
    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(ordersSchema.branchId, branchId),
        inArray(ordersSchema.status, ["PENDING", "PREPARING", "READY"]),
      ),
      with: {
        table: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(ordersSchema.createdAt)],
    });

    // Fallback: If note is missing due to stale schema in db.query, fetch it manually in a single batch
    let enrichedOrders = activeOrders;
    const missingNoteIds = activeOrders
      .filter((o: any) => o.note === undefined)
      .map((o) => o.id);

    if (missingNoteIds.length > 0) {
      try {
        const notesRaw = await db
          .select({ id: ordersSchema.id, note: ordersSchema.note })
          .from(ordersSchema)
          .where(inArray(ordersSchema.id, missingNoteIds));

        const notesMap = new Map(notesRaw.map((r) => [r.id, r.note]));
        enrichedOrders = activeOrders.map((o: any) => {
          if (o.note === undefined) {
            return { ...o, note: notesMap.get(o.id) || null };
          }
          return o;
        });
      } catch (e) {
        console.error("Failed to batch fetch notes:", e);
      }
    }

    console.log("Fetched active orders count:", enrichedOrders.length);

    return {
      success: true,
      orders: enrichedOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status as
          | "PENDING"
          | "PREPARING"
          | "READY"
          | "COMPLETED"
          | "CANCELLED",
        totalAmount: parseFloat(o.totalAmount as string),
        tableId: o.tableId,
        tableNumber: o.table?.tableNumber || "Unknown Table",
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus as "UNPAID" | "PAID",
        discountAmount: o.discountAmount ? parseFloat(o.discountAmount as string) : 0,
        discountName: o.discountName,
        note: o.note,
        items: o.items.map((item: any) => ({
          productId: item.productId,
          name: item.customName || item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: parseFloat(item.priceAtTime as string),
          options: item.customizations
            ? JSON.parse(item.customizations)
            : undefined,
        })),
      })),
    };
  } catch (error) {
    console.error("getActiveOrdersAction error:", error);
    return { success: false, error: "Failed to fetch active orders" };
  }
}

export async function getPastOrdersAction(
  branchId: string,
  options?: {
    page?: number;
    limit?: number;
    dateFilter?: string; // YYYY-MM-DD
    searchQuery?: string;
  },
) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(ordersSchema.branchId, branchId),
      inArray(ordersSchema.status, ["COMPLETED", "CANCELLED"]),
    ];

    if (options?.dateFilter) {
      // Options date filter comes in like "2026-02-27"
      // The user wanted standard calendar days based on Manila time
      // So we construct a boundary from midnight Manila to midnight next day Manila
      const [yearStr, monthStr, dayStr] = options.dateFilter.split("-");
      if (yearStr && monthStr && dayStr) {
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);

        const MANILA_OFFSET = 8 * 60 * 60 * 1000;

        const startOfDayManila = new Date(
          Date.UTC(year, month, day, 0, 0, 0, 0),
        );
        const endOfDayManila = new Date(
          Date.UTC(year, month, day + 1, 0, 0, 0, 0),
        );

        const startOfDayUTC = new Date(
          startOfDayManila.getTime() - MANILA_OFFSET,
        );
        const endOfDayUTC = new Date(endOfDayManila.getTime() - MANILA_OFFSET);

        conditions.push(gte(ordersSchema.createdAt, startOfDayUTC));
        conditions.push(lte(ordersSchema.createdAt, endOfDayUTC));
      }
    }

    if (options?.searchQuery) {
      const query = `%${options.searchQuery}%`;

      // First, find all tables matching the search query
      const matchingTables = await db
        .select({ id: tablesSchema.id })
        .from(tablesSchema)
        .where(sql`${tablesSchema.tableNumber} ILIKE ${query}`);

      const tableIds = matchingTables.map((t) => t.id);

      if (tableIds.length > 0) {
        conditions.push(
          or(
            ilike(sql`${ordersSchema.orderNumber}::text`, query),
            inArray(ordersSchema.tableId, tableIds),
          ) as any
        );
      } else {
        conditions.push(ilike(sql`${ordersSchema.orderNumber}::text`, query) as any);
      }
    }

    const pastOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        table: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(ordersSchema.createdAt)],
      limit,
      offset,
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(ordersSchema)
      .where(and(...conditions));

    return {
      success: true,
      totalCount: count,
      orders: pastOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status as "COMPLETED" | "CANCELLED",
        totalAmount: parseFloat(o.totalAmount as string),
        tableId: o.tableId,
        tableNumber: o.table?.tableNumber || "Unknown Table",
        createdAt: o.createdAt,
        completedAt: o.completedAt,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus as "UNPAID" | "PAID",
        discountAmount: o.discountAmount ? parseFloat(o.discountAmount as string) : 0,
        discountName: o.discountName,
        note: o.note,
        items: o.items.map((item: any) => ({
          productId: item.productId,
          name: item.customName || item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: parseFloat(item.priceAtTime as string),
          options: item.customizations
            ? JSON.parse(item.customizations)
            : undefined,
        })),
      })),
    };
  } catch (error) {
    console.error("getPastOrdersAction error:", error);
    return { success: false, error: "Failed to fetch activity log" };
  }
}

import { deductInventoryForOrder } from "./inventory";

export async function updateOrderStatusAction(
  orderId: string,
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED",
) {
  try {
    if (status === "PREPARING") {
      const deductionResult = await deductInventoryForOrder(orderId);
      if (!deductionResult.success) {
        console.error("Inventory deduction failed:", deductionResult.error);
        // Optionally return error or proceed with warning.
        // For now, we proceed but log it, or we could block.
        // Let's block to ensure data consistency.
        return {
          success: false,
          error: "Failed to deduct inventory: " + deductionResult.error,
        };
      }
    }

    await db
      .update(ordersSchema)
      .set({
        status,
        acceptedAt: status === "PREPARING" ? new Date() : undefined,
        readyAt: status === "READY" ? new Date() : undefined,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      })
      .where(eq(ordersSchema.id, orderId));
    return { success: true };
  } catch (error) {
    console.error("updateOrderStatusAction error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function getOrdersStatusAction(orderIds: string[]) {
  try {
    if (orderIds.length === 0) return { success: true, orders: [] };

    const result = await db
      .select({
        id: ordersSchema.id,
        status: ordersSchema.status,
      })
      .from(ordersSchema)
      .where(inArray(ordersSchema.id, orderIds));

    return {
      success: true,
      orders: result,
    };
  } catch (error) {
    console.error("getOrdersStatusAction error:", error);
    return { success: false, error: "Failed to fetch order statuses" };
  }
}

async function getOrCreatePOSTable(branchId: string) {
  const existing = await db.query.tables.findFirst({
    where: and(
      eq(tablesSchema.branchId, branchId),
      eq(tablesSchema.tableNumber, "Walk-In (POS)"),
    ),
  });
  if (existing) return existing.id;

  const [newTable] = await db
    .insert(tablesSchema)
    .values({
      branchId,
      tableNumber: "Walk-In (POS)",
      qrIdentifier: `pos-walkin-${branchId.substring(0, 8)}`,
    })
    .returning();

  return newTable.id;
}

export async function createPOSOrderAction(data: {
  branchId: string;
  items: {
    productId: string | null;
    customName: string | null;
    quantity: number;
    priceAtTime: number;
    customizations?: any;
  }[];
  subtotalAmount: number;
  discountAmount: number;
  discountName: string | null;
  totalAmount: number;
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  note?: string;
}) {
  try {
    const startOfOperationalDay = getStartOfOperationalDay();
    const tableId = await getOrCreatePOSTable(data.branchId);

    const [latestOrder] = await db
      .select({ orderNumber: ordersSchema.orderNumber })
      .from(ordersSchema)
      .where(
        and(
          eq(ordersSchema.branchId, data.branchId),
          gte(ordersSchema.createdAt, startOfOperationalDay),
        ),
      )
      .orderBy(desc(ordersSchema.orderNumber))
      .limit(1);

    const nextOrderNumber =
      latestOrder && latestOrder.orderNumber ? latestOrder.orderNumber + 1 : 1;

    const [insertedOrder] = await db
      .insert(ordersSchema)
      .values({
        branchId: data.branchId,
        tableId: tableId,
        orderNumber: nextOrderNumber,
        status: "PENDING", // Send to kitchen
        subtotalAmount: data.subtotalAmount.toString(),
        discountAmount: data.discountAmount.toString(),
        discountName: data.discountName,
        totalAmount: data.totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: "PAID", // Automatically marked as PAID
        note: data.note,
      })
      .returning();

    if (data.items.length > 0) {
      await db.insert(orderItemsSchema).values(
        data.items.map((item) => ({
          orderId: insertedOrder.id,
          productId: item.productId,
          customName: item.customName,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime.toString(),
          customizations: item.customizations
            ? JSON.stringify(item.customizations)
            : null,
        })),
      );
    }

    return { success: true, order: insertedOrder };
  } catch (error: any) {
    console.error("createPOSOrderAction error:", error);
    return { success: false, error: "Unable to save order. Please try again." };
  }
}

export async function updateOrderPaymentMethodAction(
  orderId: string,
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA",
) {
  try {
    await db
      .update(ordersSchema)
      .set({ paymentMethod })
      .where(eq(ordersSchema.id, orderId));
    return { success: true };
  } catch (error) {
    console.error("updateOrderPaymentMethodAction error:", error);
    return { success: false, error: "Failed to update payment method" };
  }
}

export async function updateOrderPaymentStatusAction(
  orderId: string,
  paymentStatus: "UNPAID" | "PAID",
) {
  try {
    await db
      .update(ordersSchema)
      .set({ paymentStatus })
      .where(eq(ordersSchema.id, orderId));
    return { success: true };
  } catch (error) {
    console.error("updateOrderPaymentStatusAction error:", error);
    return { success: false, error: "Failed to update payment status" };
  }
}

export async function updatePOSOrderAction(data: {
  orderId: string;
  items: {
    productId: string | null;
    customName: string | null;
    quantity: number;
    priceAtTime: number;
    customizations?: any;
  }[];
  subtotalAmount: number;
  discountAmount: number;
  discountName: string | null;
  totalAmount: number;
  paymentMethod: "CASH" | "GCASH" | "PAYMAYA";
  paymentStatus: "UNPAID" | "PAID";
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  note?: string;
}) {
  try {
    // Delete existing items for the order
    await db
      .delete(orderItemsSchema)
      .where(eq(orderItemsSchema.orderId, data.orderId));

    // Update the order totals and status
    await db
      .update(ordersSchema)
      .set({
        subtotalAmount: data.subtotalAmount.toString(),
        discountAmount: data.discountAmount.toString(),
        discountName: data.discountName,
        totalAmount: data.totalAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        status: data.status,
        note: data.note,
        acceptedAt:
          data.status === "PREPARING" || data.status === "COMPLETED"
            ? new Date()
            : undefined,
      })
      .where(eq(ordersSchema.id, data.orderId));

    // Insert new items
    if (data.items.length > 0) {
      await db.insert(orderItemsSchema).values(
        data.items.map((item) => ({
          orderId: data.orderId,
          productId: item.productId,
          customName: item.customName,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime.toString(),
          customizations: item.customizations
            ? JSON.stringify(item.customizations)
            : null,
        })),
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("updatePOSOrderAction error:", error);
    return {
      success: false,
      error: "Unable to update order. Please try again.",
    };
  }
}

"use server";

import { db } from "@/lib/db";
import { branches, companyPaymentMethods } from "@/db/schema";
import { and, asc, eq, max } from "drizzle-orm";
import { getUserSession } from "./auth";
import { revalidatePath } from "next/cache";

const DEFAULT_PAYMENT_METHODS = ["CASH", "GCASH", "PAYMAYA"];

const normalizePaymentMethodName = (name: string) => name.trim().toUpperCase();

export async function getCompanyPaymentMethodsAction() {
  const session = await getUserSession();
  if (!session?.companyId) return { success: false as const, error: "Unauthorized" };

  let methods = await db.query.companyPaymentMethods.findMany({
    where: and(
      eq(companyPaymentMethods.companyId, session.companyId),
      eq(companyPaymentMethods.isActive, true),
    ),
    orderBy: [asc(companyPaymentMethods.sortOrder), asc(companyPaymentMethods.createdAt)],
  });

  if (methods.length === 0) {
    await db.insert(companyPaymentMethods).values(
      DEFAULT_PAYMENT_METHODS.map((name, idx) => ({
        companyId: session.companyId!,
        name,
        sortOrder: idx,
      })),
    );
    methods = await db.query.companyPaymentMethods.findMany({
      where: and(
        eq(companyPaymentMethods.companyId, session.companyId),
        eq(companyPaymentMethods.isActive, true),
      ),
      orderBy: [asc(companyPaymentMethods.sortOrder), asc(companyPaymentMethods.createdAt)],
    });
  }

  return {
    success: true as const,
    methods: methods.map((m) => ({ id: m.id, name: m.name })),
  };
}

export async function getBranchPaymentMethodsAction(branchId: string) {
  if (!branchId) return { success: false as const, error: "Branch is required" };
  const [branch] = await db
    .select({ companyId: branches.companyId })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch?.companyId) return { success: false as const, error: "Branch not found" };

  let methods = await db.query.companyPaymentMethods.findMany({
    where: and(
      eq(companyPaymentMethods.companyId, branch.companyId),
      eq(companyPaymentMethods.isActive, true),
    ),
    orderBy: [asc(companyPaymentMethods.sortOrder), asc(companyPaymentMethods.createdAt)],
  });

  if (methods.length === 0) {
    await db.insert(companyPaymentMethods).values(
      DEFAULT_PAYMENT_METHODS.map((name, idx) => ({
        companyId: branch.companyId,
        name,
        sortOrder: idx,
      })),
    );
    methods = await db.query.companyPaymentMethods.findMany({
      where: and(
        eq(companyPaymentMethods.companyId, branch.companyId),
        eq(companyPaymentMethods.isActive, true),
      ),
      orderBy: [asc(companyPaymentMethods.sortOrder), asc(companyPaymentMethods.createdAt)],
    });
  }

  return {
    success: true as const,
    methods: methods.map((m) => ({ id: m.id, name: m.name })),
  };
}

export async function addCompanyPaymentMethodAction(nameRaw: string) {
  const session = await getUserSession();
  if (!session?.companyId) return { success: false as const, error: "Unauthorized" };

  const name = normalizePaymentMethodName(nameRaw);
  if (!name) return { success: false as const, error: "Payment method is required" };
  if (name.length > 40) return { success: false as const, error: "Payment method is too long" };

  const existing = await db.query.companyPaymentMethods.findMany({
    where: and(
      eq(companyPaymentMethods.companyId, session.companyId),
      eq(companyPaymentMethods.isActive, true),
    ),
  });
  if (existing.some((m) => m.name.toUpperCase() === name)) {
    return { success: false as const, error: "Payment method already exists" };
  }

  const [row] = await db
    .select({ maxSort: max(companyPaymentMethods.sortOrder) })
    .from(companyPaymentMethods)
    .where(eq(companyPaymentMethods.companyId, session.companyId));

  const sortOrder = (row?.maxSort ?? -1) + 1;
  await db.insert(companyPaymentMethods).values({
    companyId: session.companyId,
    name,
    sortOrder,
    isActive: true,
  });

  revalidatePath("/owner/pos");
  return { success: true as const };
}

export async function removeCompanyPaymentMethodAction(methodId: string) {
  const session = await getUserSession();
  if (!session?.companyId) return { success: false as const, error: "Unauthorized" };

  const activeMethods = await db.query.companyPaymentMethods.findMany({
    where: and(
      eq(companyPaymentMethods.companyId, session.companyId),
      eq(companyPaymentMethods.isActive, true),
    ),
  });

  if (activeMethods.length <= 1) {
    return { success: false as const, error: "At least one payment method is required" };
  }

  await db
    .update(companyPaymentMethods)
    .set({ isActive: false })
    .where(
      and(
        eq(companyPaymentMethods.id, methodId),
        eq(companyPaymentMethods.companyId, session.companyId),
      ),
    );

  revalidatePath("/owner/pos");
  return { success: true as const };
}

'use server';

import { db } from '@/lib/db';
import { tables as tablesSchema } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface TableData {
  id: string;
  tableNumber: string;
  qrIdentifier: string;
}

export async function syncTables(branchId: string, count: number): Promise<{ success: boolean; tables: TableData[]; error?: string }> {
  if (count < 1 || count > 50) {
    return { success: false, tables: [], error: 'Table count must be between 1 and 50' };
  }

  try {
    const existingTables = await db.select().from(tablesSchema).where(eq(tablesSchema.branchId, branchId)).orderBy(asc(tablesSchema.qrIdentifier));

    const existingIdentifiers = new Set(existingTables.map((t) => t.qrIdentifier));
    const tablesToCreate: { branchId: string; tableNumber: string; qrIdentifier: string }[] = [];

    for (let i = 1; i <= count; i++) {
      const identifier = `table-${i}`;
      if (!existingIdentifiers.has(identifier)) {
        tablesToCreate.push({
          branchId: branchId,
          tableNumber: `Table ${i}`,
          qrIdentifier: identifier,
        });
      }
    }

    if (tablesToCreate.length > 0) {
      await db.insert(tablesSchema).values(tablesToCreate);
    }

    const allTables = await db.select().from(tablesSchema).where(eq(tablesSchema.branchId, branchId)).orderBy(asc(tablesSchema.qrIdentifier));

    const resultTables: TableData[] = allTables
      .map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        qrIdentifier: t.qrIdentifier,
      }));

    return { success: true, tables: resultTables };
  } catch (e) {
    console.error('syncTables error:', e);
    return { success: false, tables: [], error: 'Failed to sync tables' };
  }
}

export async function getTables(branchId: string): Promise<{ success: boolean; tables: TableData[]; error?: string }> {
  try {
    const data = await db.select().from(tablesSchema).where(eq(tablesSchema.branchId, branchId)).orderBy(asc(tablesSchema.qrIdentifier));

    const tables: TableData[] = data.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      qrIdentifier: t.qrIdentifier,
    }));

    return { success: true, tables };
  } catch (e) {
    console.error('getTables error:', e);
    return { success: false, tables: [], error: 'Failed to fetch tables' };
  }
}

export async function deleteTable(tableId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(tablesSchema).where(eq(tablesSchema.id, tableId));
    return { success: true };
  } catch (e) {
    console.error('deleteTable error:', e);
    return { success: false, error: 'Failed to delete table' };
  }
}

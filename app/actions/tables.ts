'use server';

import { db } from '@/lib/db';
import { tables as tablesSchema } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface TableData {
  id: string;
  name: string;
  qrCode: string;
}

/**
 * Sync tables in database - ensures tables 1 to count exist
 */
export async function syncTables(count: number): Promise<{ success: boolean; tables: TableData[]; error?: string }> {
  if (count < 1 || count > 50) {
    return { success: false, tables: [], error: 'Table count must be between 1 and 50' };
  }

  try {
    // Get existing tables
    const existingTables = await db.select().from(tablesSchema).orderBy(asc(tablesSchema.qrCode));

    const existingQrCodes = new Set(existingTables.map((t) => t.qrCode));
    const tablesToCreate: { name: string; qrCode: string }[] = [];

    // Determine which tables need to be created
    for (let i = 1; i <= count; i++) {
      const qrCode = `table-${i}`;
      if (!existingQrCodes.has(qrCode)) {
        tablesToCreate.push({
          name: `Table ${i}`,
          qrCode: qrCode,
        });
      }
    }

    // Create missing tables
    if (tablesToCreate.length > 0) {
      await db.insert(tablesSchema).values(tablesToCreate);
    }

    // Fetch all tables after sync
    const allTables = await db.select().from(tablesSchema).orderBy(asc(tablesSchema.qrCode));

    // Filter to only return tables 1-count and transform to our format
    const resultTables: TableData[] = allTables
      .filter((t) => {
        const num = parseInt(t.qrCode.replace('table-', ''), 10);
        return !isNaN(num) && num >= 1 && num <= count;
      })
      .map((t) => ({
        id: t.id,
        name: t.name,
        qrCode: t.qrCode,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.qrCode.replace('table-', ''), 10);
        const bNum = parseInt(b.qrCode.replace('table-', ''), 10);
        return aNum - bNum;
      });

    return { success: true, tables: resultTables };
  } catch (e) {
    console.error('syncTables error:', e);
    return { success: false, tables: [], error: 'Failed to sync tables' };
  }
}

/**
 * Get all tables from database
 */
export async function getTables(): Promise<{ tables: TableData[]; error?: string }> {
  try {
    const data = await db.select().from(tablesSchema).orderBy(asc(tablesSchema.qrCode));

    const tables: TableData[] = data
      .map((t) => ({
        id: t.id,
        name: t.name,
        qrCode: t.qrCode,
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.qrCode.replace('table-', ''), 10);
        const bNum = parseInt(b.qrCode.replace('table-', ''), 10);
        return aNum - bNum;
      });

    return { tables };
  } catch (e) {
    console.error('getTables error:', e);
    return { tables: [], error: 'Failed to fetch tables' };
  }
}

/**
 * Delete a table by ID
 */
export async function deleteTable(tableId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(tablesSchema).where(eq(tablesSchema.id, tableId));
    return { success: true };
  } catch (e) {
    console.error('deleteTable error:', e);
    return { success: false, error: 'Failed to delete table' };
  }
}


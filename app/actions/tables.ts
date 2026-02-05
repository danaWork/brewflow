'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

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

  const supabase = await createSupabaseServerClient();

  try {
    // Get existing tables
    const { data: existingTables, error: fetchError } = await supabase
      .from('tables')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      return { success: false, tables: [], error: fetchError.message };
    }

    const existingQrCodes = new Set((existingTables || []).map((t: any) => t.qr_code));
    const tablesToCreate: { name: string; qr_code: string }[] = [];

    // Determine which tables need to be created
    for (let i = 1; i <= count; i++) {
      const qrCode = `table-${i}`;
      if (!existingQrCodes.has(qrCode)) {
        tablesToCreate.push({
          name: `Table ${i}`,
          qr_code: qrCode,
        });
      }
    }

    // Create missing tables
    if (tablesToCreate.length > 0) {
      console.log('Creating tables:', tablesToCreate);
      const { data: insertedData, error: insertError } = await supabase
        .from('tables')
        .insert(tablesToCreate)
        .select();

      console.log('Insert result:', { insertedData, insertError });

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, tables: [], error: insertError.message };
      }
    }

    // Fetch all tables after sync
    const { data: allTables, error: finalFetchError } = await supabase
      .from('tables')
      .select('*')
      .order('qr_code', { ascending: true });

    if (finalFetchError) {
      return { success: false, tables: [], error: finalFetchError.message };
    }

    // Filter to only return tables 1-count and transform to our format
    const tables: TableData[] = (allTables || [])
      .filter((t: any) => {
        const num = parseInt(t.qr_code.replace('table-', ''), 10);
        return !isNaN(num) && num >= 1 && num <= count;
      })
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        qrCode: t.qr_code,
      }))
      .sort((a: TableData, b: TableData) => {
        const aNum = parseInt(a.qrCode.replace('table-', ''), 10);
        const bNum = parseInt(b.qrCode.replace('table-', ''), 10);
        return aNum - bNum;
      });

    return { success: true, tables };
  } catch (e) {
    console.error('syncTables error:', e);
    return { success: false, tables: [], error: 'Failed to sync tables' };
  }
}

/**
 * Get all tables from database
 */
export async function getTables(): Promise<{ tables: TableData[]; error?: string }> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('qr_code', { ascending: true });

    if (error) {
      return { tables: [], error: error.message };
    }

    const tables: TableData[] = (data || [])
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        qrCode: t.qr_code,
      }))
      .sort((a: TableData, b: TableData) => {
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
  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('deleteTable error:', e);
    return { success: false, error: 'Failed to delete table' };
  }
}

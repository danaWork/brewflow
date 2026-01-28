import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runRLSPolicies() {
  console.log('🔐 Applying RLS policies to Supabase...\n');

  // Use the same connection as Drizzle
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'rls-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ RLS policies applied successfully!\n');
    console.log('Tables now have Row Level Security enabled:');
    console.log('  • categories (read-only)');
    console.log('  • products (read-only)');
    console.log('  • modifiers (read-only)');
    console.log('  • product_modifiers (read-only)');
    console.log('  • product_relations (read-only)');
    console.log('  • tables (read-only)');
    console.log('  • orders (read/write for demo)');
    console.log('\n📝 Update policies in rls-policies.sql when you add authentication.');

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Some policies already exist. This is fine if you ran this before.');
      console.log('   To reset, drop policies first in Supabase SQL Editor.');
    } else {
      console.error('❌ Error applying RLS policies:', error.message);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runRLSPolicies();

// One-time script: Set isQuickCartItem = true for all existing water-bottle products
// Run with: npx tsx scripts/fix-quick-cart-default.ts

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
  const result = await db.execute(sql`
    UPDATE products
    SET is_quick_cart_item = true
    WHERE (
      (LOWER(name) LIKE '%water%' AND LOWER(name) LIKE '%bottle%')
      OR (LOWER(name) LIKE '%water%' AND LOWER(name) LIKE '%bottled%')
      OR LOWER(name) = 'water'
    )
    AND is_quick_cart_item = false
  `);
  console.log('Updated rows:', result.rowCount ?? result.rows?.length ?? '?');
  await pool.end();
}

main().catch(console.error);

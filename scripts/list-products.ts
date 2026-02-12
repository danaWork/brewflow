import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function listProducts() {
  console.log('🔍 Listing products...');
  try {
    const products = await db.select().from(schema.products);
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('❌ Failed to list products:', error);
  }
}

listProducts();

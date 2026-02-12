import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function findProd() {
  const products = await db.select().from(schema.products);
  for (const p of products) {
    console.log(`${p.name}: ${p.id}`);
  }
}

findProd();

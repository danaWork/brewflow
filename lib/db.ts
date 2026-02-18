import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost/placeholder';
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost/placeholder';
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });



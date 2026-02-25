import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { not, eq, sql as dsql } from 'drizzle-orm';
import * as schema from '../db/schema';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function clearDb() {
  console.log('🧹 Starting database cleanup...');

  try {
    console.log('Breaking circular dependencies...');
    await db.execute(dsql`UPDATE modifier_groups SET default_option_id = NULL`);
    await db.execute(dsql`UPDATE product_modifier_links SET default_modifier_option_id = NULL`);

    console.log('Clearing activity logs...');
    await db.delete(schema.activityLogs);

    console.log('Clearing order item modifiers...');
    await db.delete(schema.orderItemModifiers);

    console.log('Clearing order items...');
    await db.delete(schema.orderItems);

    console.log('Clearing orders...');
    await db.delete(schema.orders);

    console.log('Clearing tables...');
    await db.delete(schema.tables);

    console.log('Clearing product ingredients...');
    await db.delete(schema.productIngredients);

    console.log('Clearing inventory items...');
    await db.delete(schema.inventoryItems);

    console.log('Clearing promotion items...');
    await db.delete(schema.promotionItems);

    console.log('Clearing promotions...');
    await db.delete(schema.promotions);

    console.log('Clearing branch product availability...');
    await db.delete(schema.branchProductAvailability);

    console.log('Clearing product modifier links...');
    await db.delete(schema.productModifierLinks);

    console.log('Clearing modifier options...');
    await db.delete(schema.modifierOptions);

    console.log('Clearing modifier groups...');
    await db.delete(schema.modifierGroups);

    console.log('Clearing products...');
    await db.delete(schema.products);

    console.log('Clearing categories...');
    await db.delete(schema.categories);

    console.log('Clearing password reset tokens...');
    await db.delete(schema.passwordResetTokens);

    console.log('Clearing non-admin users...');
    await db.delete(schema.users).where(not(eq(schema.users.role, 'SUPERADMIN')));

    console.log('Clearing branches...');
    await db.delete(schema.branches);

    console.log('✅ DB cleanup completed successfully! Admin users preserved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB cleanup failed:', error);
    process.exit(1);
  }
}

clearDb();

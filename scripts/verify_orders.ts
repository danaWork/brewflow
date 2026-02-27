import 'dotenv/config';
import { db } from '../lib/db';
import { orders } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

async function verifyOrderNumbers() {
    try {
        console.log('Fetching branches...');
        const allBranches = await db.query.branches.findMany();
        
        for (const branch of allBranches) {
            const latestOrders = await db.select({ orderNumber: orders.orderNumber })
                .from(orders)
                .where(eq(orders.branchId, branch.id))
                .orderBy(desc(orders.orderNumber))
                .limit(3);
            
            console.log(`Branch ${branch.branchName}: latest order numbers:`, latestOrders.map(o => o.orderNumber));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyOrderNumbers();

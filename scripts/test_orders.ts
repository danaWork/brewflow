import 'dotenv/config';
import { db } from '../lib/db';
import { orders, branches, tables } from '../db/schema';
import { createOrderAction } from '../app/actions/orders';
import { eq } from 'drizzle-orm';

async function testOrderNumbers() {
    try {
        console.log('Fetching branches...');
        const allBranches = await db.query.branches.findMany();
        if (allBranches.length < 2) {
            console.log('Need at least 2 branches to test properly.');
            return;
        }

        const branch1 = allBranches[0];
        const branch2 = allBranches[1];

        const table1List = await db.query.tables.findMany({ where: (tables, { eq }) => eq(tables.branchId, branch1.id), limit: 1 });
        const table2List = await db.query.tables.findMany({ where: (tables, { eq }) => eq(tables.branchId, branch2.id), limit: 1 });

        const table1 = table1List[0];
        const table2 = table2List[0];

        if (!table1 || !table2) {
            console.log('Need tables in both branches to test.');
            return;
        }

        console.log('Creating first order in Branch 1...');
        const o1 = await createOrderAction({
            branchId: branch1.id,
            tableId: table1.id,
            items: [],
            totalAmount: 100,
            paymentMethod: 'CASH',
            note: 'Test Order 1'
        });
        console.log('Order 1 result:', o1.success ? `Created Order #${o1.order?.orderNumber}` : o1.error);

        console.log('Creating second order in Branch 1...');
        const o2 = await createOrderAction({
            branchId: branch1.id,
            tableId: table1.id,
            items: [],
            totalAmount: 200,
            paymentMethod: 'CASH',
            note: 'Test Order 2'
        });
        console.log('Order 2 result:', o2.success ? `Created Order #${o2.order?.orderNumber}` : o2.error);

        console.log('Creating first order in Branch 2...');
        const o3 = await createOrderAction({
            branchId: branch2.id,
            tableId: table2.id,
            items: [],
            totalAmount: 150,
            paymentMethod: 'CASH',
            note: 'Test Order 3'
        });
        console.log('Order 3 result:', o3.success ? `Created Order #${o3.order?.orderNumber}` : o3.error);

        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testOrderNumbers();

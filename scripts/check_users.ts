import 'dotenv/config';
import { db } from '../lib/db';
import { users, branches, companies } from '../db/schema';
import { desc } from 'drizzle-orm';
import fs from 'fs';

async function checkNewUsers() {
    try {
        const latestUsers = await db.select({
            email: users.email,
            role: users.role,
            companyId: users.companyId,
            branchId: users.branchId,
        }).from(users).orderBy(desc(users.createdAt)).limit(5);

        fs.writeFileSync('users.json', JSON.stringify(latestUsers, null, 2), 'utf8');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkNewUsers();

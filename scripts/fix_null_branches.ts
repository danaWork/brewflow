import 'dotenv/config';
import { db } from '../lib/db';
import { users, branches } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

async function fixNullBranches() {
    try {
        console.log('Finding users with null branchId...');
        const usersToFix = await db.select()
            .from(users)
            .where(and(eq(users.role, 'BRANCH_MANAGER'), isNull(users.branchId)));

        console.log(`Found ${usersToFix.length} users to fix.`);

        for (const user of usersToFix) {
            console.log(`Fixing user ${user.email} (Company: ${user.companyId})...`);
            
            // Find the first branch for this company
            const [companyBranch] = await db.select({ id: branches.id })
                .from(branches)
                .where(eq(branches.companyId, user.companyId))
                .limit(1);

            if (companyBranch) {
                await db.update(users)
                    .set({ branchId: companyBranch.id })
                    .where(eq(users.id, user.id));
                console.log(`  -> Assigned branchId: ${companyBranch.id}`);
            } else {
                console.log(`  -> Warning: No branch found for company ${user.companyId}`);
            }
        }

        console.log('Done fixing null branches.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixNullBranches();

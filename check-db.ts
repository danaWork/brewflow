import { db } from './lib/db';
import { users, branches } from './db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ email: u.email, role: u.role, branchId: u.branchId })));
  
  const allBranches = await db.select().from(branches);
  console.log("Branches:", allBranches.map(b => ({ id: b.id, name: b.branchName })));
  process.exit(0);
}

main().catch(console.error);

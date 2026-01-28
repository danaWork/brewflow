require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('Testing DB connection...');
// Log masked URL to verify it's loaded
const url = process.env.DATABASE_URL;
console.log('URL loaded:', url ? 'Yes' : 'No');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url,
    },
  },
});

async function main() {
  try {
    const tables = await prisma.table.count();
    console.log('Successfully connected! Table count:', tables);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

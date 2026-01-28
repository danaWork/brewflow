import { db } from '@/lib/db';
import MenuClient from '@/components/customer/MenuClient';
import { eq, desc } from 'drizzle-orm';
import { products as productsSchema, tables as tablesSchema } from '@/db/schema';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  // Fetch data
  let categoriesData = [];
  let productsData = [];
  let currentTable = null;

  try {
    // Fetch Table
    // Assuming tableId in URL matches qrCode in DB (or is a valid identifier)
    // We try to find by qrCode first
    currentTable = await db.query.tables.findFirst({
        where: eq(tablesSchema.qrCode, tableId)
    });

    // If not found, maybe valid UUID? (Skipping for now, assuming QR code match)
    
    // Drizzle Fetch
    categoriesData = await db.query.categories.findMany();
    
    // Fetch products with ordering
    const productsRaw = await db.query.products.findMany({
      orderBy: [desc(productsSchema.isSignature)]
    });
    
    // Transform decimal strings to numbers for serialization
    productsData = productsRaw.map(p => ({
      ...p,
      price: parseFloat(p.price), // Drizzle returns decimal as string usually
      createdAt: p.createdAt?.toISOString(),
      // updatedAt was not in schema, ignoring
    }));

  } catch (error) {
    console.error("Failed to fetch menu data (Drizzle):", error);
  }

  return (
    <MenuClient 
      tableId={tableId}
      tableName={currentTable?.name || `Table ${tableId}`}
      categories={categoriesData}
      products={productsData}
    />
  );
}

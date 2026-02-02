import { createSupabaseServerClient } from '@/lib/supabase-server';
import MenuClient from '@/components/customer/MenuClient';

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch data from Supabase
  let categoriesData: any[] = [];
  let productsData: any[] = [];
  let tableName = `Table ${tableId}`;

  try {
    // Fetch Table by QR code
    const { data: tableData } = await supabase
      .from('tables')
      .select('name')
      .eq('qr_code', tableId)
      .single();
    
    if (tableData) {
      tableName = (tableData as any).name;
    }

    // Fetch categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*');
    
    categoriesData = (categories as any[]) || [];

    // Fetch products ordered by signature first
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('is_signature', { ascending: false });

    // Transform to expected format
    if (products) {
      productsData = (products as any[]).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        description: p.description,
        image: p.image,
        isSignature: p.is_signature,
        categoryId: p.category_id,
        createdAt: p.created_at,
      }));
    }

  } catch (error) {
    console.error("Failed to fetch menu data:", error);
  }

  return (
    <MenuClient
      tableId={tableId}
      tableName={tableName}
      categories={categoriesData}
      products={productsData}
    />
  );
}

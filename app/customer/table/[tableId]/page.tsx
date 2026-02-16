import MenuClient from '@/components/customer/MenuClient';
import { getMenuData } from '@/app/actions/menu';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = await params;

  const result = await getMenuData(tableId);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load menu data. Please try again later.</p>
      </div>
    );
  }

  return (
    <MenuClient
      tableId={result.tableId || tableId}
      tableName={result.tableName || `Table ${tableId}`}
      branchId={result.branchId || ''}
      categories={result.categories || []}
      products={result.products || []}
      promotions={result.promotions || []}
    />
  );
}

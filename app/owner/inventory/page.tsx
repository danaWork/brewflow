import { Package } from 'lucide-react';
import { getUserSession } from '@/app/actions/auth';
import { getInventoryItemsAction } from '@/app/actions/inventory';
import InventoryList from '@/components/inventory/InventoryList';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { redirect } from 'next/navigation';

export default async function InventoryPage() {
  const session = await getUserSession();
  if (!session || !['SUPERADMIN', 'BRANCH_MANAGER'].includes(session.role)) {
    redirect('/login');
  }

  const branchId = session.branchId || ''; // Handle superadmin case if needed, but for now assume linked branch
  if (!branchId && session.role !== 'SUPERADMIN') {
      return <div>Error: No branch assigned</div>;
  }
  // If superadmin, might need to select branch. For MVP assume branchId is present for manager.

  const { items, error } = await getInventoryItemsAction(branchId);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-500">Track stock levels and costs</p>
        </div>
        <AddInventoryModal branchId={branchId} />
      </div>

      {error ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
      ) : (
        <InventoryList initialItems={items || []} branchId={branchId} />
      )}
    </div>
  );
}


import { getMenuCategories, getModifierGroups } from '@/app/actions/menu-management';
import { getInventoryItemsAction } from '@/app/actions/inventory';
import { getUserSession } from '@/app/actions/auth';
import MenuManagementClient from './MenuManagementClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MenuCategoriesPage() {
  const session = await getUserSession();
  if (!session || !['SUPERADMIN', 'BRANCH_MANAGER'].includes(session.role)) {
    redirect('/login');
  }
  
  const branchId = session.branchId || '';

  const [categories, modifierGroups, inventoryRes] = await Promise.all([
    getMenuCategories(),
    getModifierGroups(),
    getInventoryItemsAction(branchId)
  ]);

  return (
    <div className="p-4 md:p-8">
      <MenuManagementClient 
        initialCategories={categories} 
        modifierGroups={modifierGroups}
        inventoryItems={inventoryRes.items || []}
        branchId={branchId}
      />
    </div>
  );
}

import type { ComponentProps } from 'react';
import { getMenuCategories, getModifierGroups } from '@/app/actions/menu-management';
import { getInventoryItemsAction } from '@/app/actions/inventory';
import { getUserSession } from '@/app/actions/auth';
import MenuManagementClient from './MenuManagementClient';
import { redirect } from 'next/navigation';
import { requireManagerRole } from '@/lib/roleGuard';

export const dynamic = 'force-dynamic';

export default async function MenuCategoriesPage() {
  await requireManagerRole();
  const session = await getUserSession();
  if (!session) {
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
        initialCategories={categories as any} 
        modifierGroups={modifierGroups as any}
        inventoryItems={inventoryRes.items || []}
        branchId={branchId}
      />
    </div>
  );
}

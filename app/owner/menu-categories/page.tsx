import { getMenuCategories, getModifierGroups } from '@/app/actions/menu-management';
import MenuManagementClient from './MenuManagementClient';

export const dynamic = 'force-dynamic';

export default async function MenuCategoriesPage() {
  const categories = await getMenuCategories();
  const modifierGroups = await getModifierGroups();

  return (
    <div className="p-4 md:p-8">
      <MenuManagementClient 
        initialCategories={categories} 
        modifierGroups={modifierGroups}
      />
    </div>
  );
}

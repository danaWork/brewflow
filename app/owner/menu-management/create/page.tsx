import { requireManagerRole } from '@/lib/roleGuard';

export default async function CreateMenuItemPage() {
  await requireManagerRole();
  return (
    <div>
      <h1>Create Menu Item</h1>
      <p>Add a new item to your menu</p>
    </div>
  );
}

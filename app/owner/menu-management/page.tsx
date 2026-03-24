import { requireManagerRole } from '@/lib/roleGuard';

export default async function MenuManagementPage() {
  await requireManagerRole();
  return (
    <div>
      <h1>Menu Management</h1>
      <p>Create, edit, and delete menu items</p>
    </div>
  );
}

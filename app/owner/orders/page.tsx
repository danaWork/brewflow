import { requireManagerRole } from '@/lib/roleGuard';

export default async function OwnerOrdersPage() {
  await requireManagerRole();
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Active Orders</h1>
      <p className="text-gray-500">Manage incoming orders</p>
    </div>
  );
}

import PromotionsTabs from './_components/PromotionsTabs';
import { getSessionAction } from '@/app/actions/auth';
import { getProductsAction, getPromotionsAction } from '@/app/actions/promotions';
import { requireManagerRole } from '@/lib/roleGuard';
import { redirect } from 'next/navigation';

export default async function PromotionsPage() {
  await requireManagerRole();
  const session = await getSessionAction();
  if (!session?.user?.branchId) {
    redirect('/login');
  }

  const branchId = session.user.branchId;
  const [productsRes, promotionsRes] = await Promise.all([
    getProductsAction(branchId),
    getPromotionsAction(branchId),
  ]);

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 md:p-8">
      <PromotionsTabs
        initialProducts={productsRes.data || []}
        initialPromotions={promotionsRes.data || []}
        branchId={branchId}
      />
    </div>
  );
}

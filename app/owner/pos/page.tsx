import { Metadata } from 'next';
import { POSClient } from '@/components/owner/pos/POSClient';
import { getMenuCategories } from '@/app/actions/menu-management';
import { getUserSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'POS Terminal',
};

export const revalidate = 0;

export default async function POSPage() {
  const session = await getUserSession();
  if (!session || !session.branchId) {
    redirect('/login');
  }

  const categories = await getMenuCategories();

  return <POSClient categories={categories as any} branchId={session.branchId} />;
}

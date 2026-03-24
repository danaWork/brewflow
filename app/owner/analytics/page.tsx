import { Metadata } from 'next';
import { OwnerAnalytics } from '@/components/owner/OwnerAnalytics';
import { getOwnerAnalytics } from '@/app/actions/owner';
import { getUserSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { requireManagerRole } from '@/lib/roleGuard';

export const metadata: Metadata = {
  title: 'Analytics',
};

export const revalidate = 0;

export default async function AnalyticsPage() {
  await requireManagerRole();
  const session = await getUserSession();

  if (!session?.branchId) {
    redirect('/login');
  }

  const analytics = await getOwnerAnalytics(session.branchId);

  return <OwnerAnalytics analytics={analytics} />;
}

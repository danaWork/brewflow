import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { StatCards } from '@/components/admin/StatCards';
import { ShopList } from '@/components/admin/ShopList';
import { UsersTab } from '@/components/admin/UsersTab';
import { AdminActionButtons } from '@/components/admin/AdminActionButtons';
import { UpsellAnalytics } from '@/components/admin/UpsellAnalytics';
import { getAdminOverviewStats, getAllShops, getAdminUsers, getUpsellAnalytics } from '@/app/actions/admin';
import { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const { tab = 'overview' } = await searchParams;
  const titles: Record<string, string> = {
    overview: 'Overview',
    users: 'Manage Users',
    analytics: 'Analytics',
    activity: 'Activity Log',
  };
  return { title: titles[tab] || 'Dashboard' };
}

export const revalidate = 0;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'overview' } = await searchParams;

  const stats = await getAdminOverviewStats();
  const shops = await getAllShops();
  const adminUsers = await getAdminUsers();
  const upsellStats = await getUpsellAnalytics();

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />

        <AdminTabs />

        {tab === 'overview' && (
          <>
            <StatCards stats={stats} />
            <AdminActionButtons shops={shops} />
            <ShopList shops={shops} />
          </>
        )}

        {tab === 'users' && (
          <>
            <AdminActionButtons shops={shops} />
            <UsersTab users={adminUsers} />
          </>
        )}

        {(tab === 'analytics') && (
          <UpsellAnalytics stats={upsellStats} />
        )}

        {tab === 'activity' && (
          <div className="bg-white rounded-[32px] p-20 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-medium italic">Tab content under construction...</p>
          </div>
        )}
      </div>
    </div>
  );
}

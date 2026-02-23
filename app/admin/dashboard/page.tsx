import { DashboardHeader } from '@/components/admin/DashboardHeader';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { StatCards } from '@/components/admin/StatCards';
import { ShopList } from '@/components/admin/ShopList';
import { UsersTab } from '@/components/admin/UsersTab';
import { AdminActionButtons } from '@/components/admin/AdminActionButtons';
import { UpsellAnalytics } from '@/components/admin/UpsellAnalytics';
import { getAdminOverviewStats, getAllShops, getAdminUsers, getUpsellAnalytics } from '@/app/actions/admin';
import { Metadata } from 'next';

import { getActivityLogs } from '@/app/actions/admin';
import { ActivityLog } from '@/components/admin/ActivityLog';

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
  searchParams: Promise<{ tab?: string; shopId?: string; action?: string; date?: string }>;
}) {
  const { tab = 'overview', shopId, action, date } = await searchParams;

  const stats = await getAdminOverviewStats();
  const shops = await getAllShops();
  const adminUsers = await getAdminUsers();
  const upsellStats = await getUpsellAnalytics();

  const activityLogs = tab === 'activity'
    ? await getActivityLogs({
      shopId,
      action,
      startDate: date ? new Date(date) : undefined,
      endDate: date ? new Date(new Date(date).setHours(23, 59, 59, 999)) : undefined
    })
    : [];

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-10">
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
          <ActivityLog logs={activityLogs} shops={shops} />
        )}
      </div>
    </div>
  );
}

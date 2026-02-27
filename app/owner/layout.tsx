import { Metadata } from 'next';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import OwnerMobileNav from '@/components/owner/OwnerMobileNav';
import NotificationDropdown from '@/components/owner/NotificationDropdown';
import { getUserSession } from '@/app/actions/auth';
import { db } from '@/lib/db';
import { branches } from '@/db/schema';
import { eq } from 'drizzle-orm';
export const metadata: Metadata = {
  title: 'Shop Dashboard',
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();
  
  let shopName = 'Admin Panel';
  if (session?.branchId) {
    const branchInfo = await db.query.branches.findFirst({
      where: eq(branches.id, session.branchId),
      columns: { branchName: true }
    });
    if (branchInfo) {
      shopName = branchInfo.branchName;
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — overflow-visible so the toggle pill can poke out */}
      <aside className="hidden md:flex shrink-0 overflow-visible relative z-20">
        <OwnerSidebar shopName={shopName} branchId={session?.branchId || ''} />
      </aside>
      {/* Mobile top nav */}
      <div className="md:hidden shrink-0 w-full relative z-30 flex items-center bg-white border-b border-gray-200">
        <div className="flex-[3]"><OwnerMobileNav shopName={shopName} branchId={session?.branchId || ''} /></div>
        {session?.branchId && (
          <div className="pr-4 flex-shrink-0">
            <NotificationDropdown branchId={session.branchId} />
          </div>
        )}
      </div>
      <main className="flex-1 overflow-auto min-w-0 relative">
        {/* Desktop notification dropdown */}
        {session?.branchId && (
          <div className="hidden md:block absolute top-6 right-8 z-50">
            <NotificationDropdown branchId={session.branchId} />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

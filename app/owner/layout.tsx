import { Metadata } from 'next';
import OwnerSidebar from '@/components/owner/OwnerSidebar';
import OwnerMobileNav from '@/components/owner/OwnerMobileNav';

export const metadata: Metadata = {
  title: 'Shop Dashboard',
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-50">
      <aside className="hidden md:flex shrink-0">
        <OwnerSidebar />
      </aside>
      <div className="md:hidden shrink-0 w-full">
        <OwnerMobileNav />
      </div>
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}

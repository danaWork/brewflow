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
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar — overflow-visible so the toggle pill can poke out */}
      <aside className="hidden md:flex shrink-0 overflow-visible relative z-20">
        <OwnerSidebar />
      </aside>
      {/* Mobile top nav */}
      <div className="md:hidden shrink-0 w-full">
        <OwnerMobileNav />
      </div>
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}

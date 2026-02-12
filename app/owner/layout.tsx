import { Metadata } from 'next';
import OwnerSidebar from '@/components/owner/OwnerSidebar';

export const metadata: Metadata = {
  title: 'Shop Dashboard',
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <OwnerSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

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
    <div className="flex min-h-screen bg-gray-50">
      <OwnerSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

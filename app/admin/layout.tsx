import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-app">
      {/* Admin app navigation/sidebar */}
      <main>{children}</main>
    </div>
  );
}

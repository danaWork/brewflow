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

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="owner-app">
      {/* Owner app navigation/sidebar */}
      <main>{children}</main>
    </div>
  );
}

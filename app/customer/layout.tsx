export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="customer-app min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}

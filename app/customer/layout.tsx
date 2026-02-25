import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#D95D1E",
};

export const metadata: Metadata = {
  title: "Customer Order",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Customer Order",
  },
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="customer-app min-h-screen bg-[#D95D1E]">
      <div className="min-h-screen bg-gray-50 flex flex-col">
          <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

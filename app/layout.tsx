import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({ subsets: ["latin"] });

const BASE_URL = "https://brewflowdemo.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "BrewFlow — Coffee Shop Ordering, Simplified",
    template: "%s | BrewFlow",
  },
  description:
    "BrewFlow is a modern coffee shop management platform. Real-time orders, QR table menus, menu & promotions management, and sales insights — all in one dashboard.",
  keywords: [
    "coffee shop ordering",
    "QR code menu",
    "restaurant management",
    "real-time orders",
    "brew flow",
    "café POS",
    "table ordering system",``
  ],
  authors: [{ name: "BrewFlow" }],
  creator: "BrewFlow",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "BrewFlow",
    title: "BrewFlow — Coffee Shop Ordering, Simplified",
    description:
      "Real-time orders, QR table menus, and everything you need to run your coffee shop from one dashboard.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BrewFlow — Modern Coffee Shop Ordering Platform",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BrewFlow — Coffee Shop Ordering, Simplified",
    description:
      "Real-time orders, QR table menus, and everything you need to run your coffee shop from one dashboard.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  themeColor: "#D46215",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

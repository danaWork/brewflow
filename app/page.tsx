import Link from "next/link";
import {
  Coffee,
  QrCode,
  LayoutDashboard,
  Zap,
  BarChart3,
  ShoppingBag,
  ArrowRight,
  Smartphone,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg -ml-1 p-1.5 transition-colors hover:bg-orange-50/50"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#D46215] rounded-xl flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              BrewFlow
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-[#D46215] transition-colors py-2 px-3 rounded-lg hover:bg-orange-50/50 -mr-1"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Customer callout — first thing visitors see */}
        <section
          className="border-b border-orange-100/80 bg-gradient-to-r from-[#D46215]/10 via-orange-50/60 to-amber-50/40"
          aria-label="Customer ordering"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-orange-100 shrink-0">
                  <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-[#D46215]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base sm:text-lg">
                    Here to order?
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 mt-0.5">
                    Scan the <span className="font-medium text-gray-800">QR code at your table</span> with your phone to browse the menu and order.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 sm:border-l sm:border-gray-200 sm:pl-5">
                <Smartphone className="w-5 h-5 shrink-0" />
                <span className="text-xs sm:text-sm">No app download needed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Hero — for shop owners */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,98,21,0.06),transparent)] pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 text-center relative">
            <p className="text-sm font-semibold text-[#D46215] uppercase tracking-wider mb-3 sm:mb-4">
              For shop owners
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-gray-900 tracking-tight max-w-3xl mx-auto leading-[1.15]">
              Coffee shop ordering,{" "}
              <span className="text-[#D46215]">simplified</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              Real-time orders, QR menus, and everything you need to run your shop from one dashboard.
            </p>
            <div className="mt-8 sm:mt-10">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-[#D46215] hover:bg-[#B75311] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-base sm:text-lg active:scale-[0.98]"
              >
                Log in to dashboard
                <ArrowRight className="w-5 h-5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200/80 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
              Everything you need to run your shop
            </h2>
            <p className="text-gray-600 text-center max-w-lg mx-auto mb-10 sm:mb-14 text-sm sm:text-base">
              One platform for orders, menu, and insights.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="group p-5 sm:p-6 rounded-2xl bg-gray-50/80 hover:bg-orange-50/40 border border-transparent hover:border-orange-100 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-200/60 transition-colors">
                  <Zap className="w-6 h-6 text-[#D46215]" aria-hidden />
                </div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Real-time orders</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Orders appear instantly. Update status and keep customers in the loop.
                </p>
              </div>
              <div className="group p-5 sm:p-6 rounded-2xl bg-gray-50/80 hover:bg-blue-50/60 border border-transparent hover:border-blue-100 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200/60 transition-colors">
                  <QrCode className="w-6 h-6 text-blue-600" aria-hidden />
                </div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">QR table ordering</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Customers scan, browse the menu, and order from their table. No app to download.
                </p>
              </div>
              <div className="group p-5 sm:p-6 rounded-2xl bg-gray-50/80 hover:bg-amber-50/60 border border-transparent hover:border-amber-100 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200/60 transition-colors">
                  <ShoppingBag className="w-6 h-6 text-amber-600" aria-hidden />
                </div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Menu & promotions</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Full menu, modifiers, sizes, and bundles. Run promotions and perfect pairs.
                </p>
              </div>
              <div className="group p-5 sm:p-6 rounded-2xl bg-gray-50/80 hover:bg-emerald-50/60 border border-transparent hover:border-emerald-100 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200/60 transition-colors">
                  <BarChart3 className="w-6 h-6 text-emerald-600" aria-hidden />
                </div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Insights</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Revenue, upsell analytics, and activity logs to understand your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-200/80 bg-gradient-to-b from-orange-50/80 to-amber-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 md:py-24 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#D46215] rounded-2xl shadow-lg mb-6" aria-hidden>
              <LayoutDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Ready to run your shop?
            </h2>
            <p className="mt-3 text-gray-600 max-w-md mx-auto text-sm sm:text-base">
              Log in to manage orders, menus, and more from your dashboard.
            </p>
            <Link
              href="/login"
              className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-[#D46215] hover:bg-[#B75311] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-base sm:text-lg active:scale-[0.98]"
            >
              Log in
              <ArrowRight className="w-5 h-5" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200/80 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#D46215]" aria-hidden />
                <span className="font-semibold text-gray-900">BrewFlow</span>
              </div>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-500 hover:text-[#D46215] transition-colors"
              >
                Log in
              </Link>
            </div>
            <p className="mt-4 sm:mt-6 text-xs text-gray-400 text-center sm:text-left">
              © {new Date().getFullYear()} BrewFlow. Modern coffee shop ordering.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

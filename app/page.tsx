import Link from "next/link";
import { QrCode, ShoppingBag, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3">
            BrewFlow
          </h1>
          <p className="text-lg text-gray-600">
            Modern coffee shop ordering system (demo)
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 text-left mb-8">
          
          {/* Owner Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col h-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Shop Owner
            </h2>
            <p className="text-sm text-gray-500 mb-5 flex-grow">
              Manage incoming orders, update order statuses, and generate QR codes for tables.
            </p>
            <Link 
              href="/owner" 
              target="_blank"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] transform"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Scan QR Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col h-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Scan QR Code
            </h2>
            <p className="text-sm text-gray-500 mb-5 flex-grow">
              Customers scan the QR code at their table to browse the menu and place orders.
            </p>
            <Link 
              href="/customer/table/table-1" 
              target="_blank"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98] transform"
            >
              Demo Table 1 →
            </Link>
          </div>

        </div>

        {/* Features */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-gray-700">Realtime Updates Enabled</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">50+</p>
              <p className="text-xs text-gray-500">Tables Supported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">⚡</p>
              <p className="text-xs text-gray-500">Instant Sync</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">📱</p>
              <p className="text-xs text-gray-500">Mobile First</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

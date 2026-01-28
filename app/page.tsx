import Link from "next/link";
import { AlertCircle, Clock, MonitorSmartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-stone-200">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 mb-3 sm:mb-4">
          BrewFlow Demo
        </h1>
        <p className="text-base sm:text-lg text-stone-600 mb-6 sm:mb-8">
          Welcome to the Coffee Shop Demo. For the best experience, open these links in two separate tabs to simulate the realtime workflow.
        </p>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 text-left mb-8">
          
          {/* Owner Card */}
          <div className="bg-orange-50 p-5 sm:p-6 rounded-xl border border-orange-100 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg sm:text-xl font-semibold text-orange-800 mb-2">
              Step 1: Shop Owner
            </h2>
            <p className="text-sm text-stone-600 mb-4 flex-grow">
              Open this to see incoming orders from customers.
            </p>
            <Link 
              href="/owner" 
              target="_blank"
              className="inline-flex items-center justify-center w-full py-3 sm:py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-95 transform"
            >
              Open Owner Dashboard
            </Link>
          </div>

          {/* Customer Card */}
          <div className="bg-blue-50 p-5 sm:p-6 rounded-xl border border-blue-100 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800 mb-2">
              Step 2: Customer
            </h2>
            <p className="text-sm text-stone-600 mb-4 flex-grow">
              Simulate a customer ordering from Table 1.
            </p>
            <Link 
              href="/customer/table/1" 
              target="_blank"
              className="inline-flex items-center justify-center w-full py-3 sm:py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base active:scale-95 transform"
            >
              Open Menu (Table 1)
            </Link>
          </div>

        </div>

        {/* Notes Section */}
        <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 text-left space-y-3">
            <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Demo Limitations
            </h3>
            
            <div className="flex gap-3 text-sm text-stone-600">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-stone-400" />
                <p><strong className="text-stone-700">Cold Start:</strong> The database may take a few seconds to wake up on the first request. Things might not load instantly!</p>
            </div>

            <div className="flex gap-3 text-sm text-stone-600">
                <MonitorSmartphone className="w-4 h-4 mt-0.5 flex-shrink-0 text-stone-400" />
                <p><strong className="text-stone-700">Realtime Sync:</strong> Unavailable in this stage</p>
            </div>
        </div>
      </div>
    </div>
  );
}

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="bg-gray-100 p-6 rounded-full inline-block mb-6">
          <BarChart3 size={48} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-500 max-w-md">
          View sales reports, revenue insights, and performance metrics. Coming soon!
        </p>
      </div>
    </div>
  );
}

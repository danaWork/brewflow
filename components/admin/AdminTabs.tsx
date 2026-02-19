'use client';

import { LayoutGrid, BarChart3, Users, History } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'analytics', label: 'Upsell Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'activity', label: 'Activity Log', icon: History }
];

export function AdminTabs() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const handleTabChange = (tabId: string) => {
        router.push(`/admin/dashboard?tab=${tabId}`);
    };

    return (
        <div className="flex bg-gray-100/80 p-1 rounded-xl w-fit mb-8">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

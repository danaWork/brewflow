'use client';

import { Coffee, LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <header className="flex justify-between items-center gap-4 mb-6 md:mb-10 p-0">
            <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg border border-orange-100 bg-orange-50 shrink-0">
                    <Coffee className="text-[#D46215]" size={24} />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">Manage Shops</h1>
            </div>

            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 md:px-4 text-gray-600 hover:text-red-600 font-medium transition-colors shrink-0 min-h-[44px]"
            >
                <LogOut size={20} />
                Logout
            </button>
        </header>
    );
}

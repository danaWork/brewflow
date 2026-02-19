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
        <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg border border-orange-100 bg-orange-50">
                    <Coffee className="text-[#D46215]" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Manage Shops</h1>
            </div>

            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
                <LogOut size={20} />
                Logout
            </button>
        </header>
    );
}

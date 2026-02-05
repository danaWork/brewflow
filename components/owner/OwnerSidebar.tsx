'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ClipboardList, 
  QrCode, 
  Tag, 
  BarChart3, 
  UtensilsCrossed, 
  Package,
  Coffee
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Business / Operations',
    items: [
      { label: 'Live Orders', href: '/owner/live-orders', icon: ClipboardList },
      { label: 'QR Codes', href: '/owner/qr-codes', icon: QrCode },
    ],
  },
  {
    title: 'Marketing / Revenue',
    items: [
      { label: 'Promotions', href: '/owner/promotions', icon: Tag },
      { label: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Menu Management',
    items: [
      { label: 'Menu & Categories', href: '/owner/menu-categories', icon: UtensilsCrossed },
      { label: 'Inventory', href: '/owner/inventory', icon: Package },
    ],
  },
];

export default function OwnerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-[#FDFBF9] border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFEBE0] p-2 rounded-xl">
            <Coffee size={24} className="text-[#D95D1E]" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">BrewFlow</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {group.title}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href === '/owner/live-orders' && pathname === '/owner');
                const Icon = item.icon;
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-[#D95D1E] text-white shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

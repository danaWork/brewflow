'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ClipboardList,
  QrCode,
  Tag,
  BarChart3,
  UtensilsCrossed,
  Package,
  Coffee,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
    title: 'Operations',
    items: [
      { label: 'Live Orders', href: '/owner/live-orders', icon: ClipboardList },
      { label: 'QR Codes', href: '/owner/qr-codes', icon: QrCode },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Promotions', href: '/owner/promotions', icon: Tag },
      { label: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Menu',
    items: [
      { label: 'Menu & Categories', href: '/owner/menu-categories', icon: UtensilsCrossed },
      { label: 'Inventory', href: '/owner/inventory', icon: Package },
    ],
  },
];

const STORAGE_KEY = 'brewflow-sidebar-collapsed';

export default function OwnerSidebar() {
  const pathname = usePathname();

  // Start from a server-safe default; hydrate from localStorage on mount
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <aside
      className={`
        relative min-h-screen bg-[#FDFBF9] border-r border-gray-200 flex flex-col
        transition-[width] duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-60'}
      `}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-gray-200 flex items-center gap-3 overflow-hidden">
        <div className="bg-[#FFEBE0] p-2 rounded-xl shrink-0">
          <Coffee size={22} className="text-[#D95D1E]" />
        </div>
        {/* Text fades + slides out when collapsed */}
        <div
          className={`
            overflow-hidden transition-all duration-300
            ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}
        >
          <h1 className="font-bold text-gray-900 text-base whitespace-nowrap">BrewFlow</h1>
          <p className="text-xs text-gray-500 whitespace-nowrap">Admin Panel</p>
        </div>
      </div>

      {/* ── Navigation Groups ───────────────────────────────────────────── */}
      <nav className="flex-1 py-4 space-y-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="px-3">
            {/* Group label – hidden when collapsed */}
            <h2
              className={`
                text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2
                overflow-hidden whitespace-nowrap transition-all duration-300
                ${collapsed ? 'h-0 mb-0 opacity-0' : 'h-auto opacity-100'}
              `}
            >
              {group.title}
            </h2>

            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === '/owner/live-orders' && pathname === '/owner');
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all
                        ${collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'}
                        ${isActive
                          ? 'bg-[#D95D1E] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}
                      />

                      {/* Label */}
                      <span
                        className={`
                          overflow-hidden whitespace-nowrap transition-all duration-300
                          ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                        `}
                      >
                        {item.label}
                      </span>

                      {/* Tooltip shown in collapsed mode */}
                      {collapsed && (
                        <span
                          className="
                            pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                            bg-gray-900 text-white text-xs font-medium whitespace-nowrap
                            opacity-0 group-hover:opacity-100
                            transition-opacity duration-150 shadow-lg z-50
                          "
                        >
                          {item.label}
                          {/* little arrow */}
                          <span className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Logout ─────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={async () => {
            const { logout } = await import('@/app/actions/auth');
            await logout();
            window.location.href = '/login';
          }}
          title={collapsed ? 'Logout' : undefined}
          className={`
            group relative flex items-center gap-3 w-full rounded-lg text-sm font-medium
            text-red-600 hover:bg-red-50 transition-all
            ${collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'}
          `}
        >
          <LogOut size={18} className="shrink-0" />
          <span
            className={`
              overflow-hidden whitespace-nowrap transition-all duration-300
              ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
            `}
          >
            Logout
          </span>

          {/* Tooltip for logout in collapsed mode */}
          {collapsed && (
            <span
              className="
                pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                bg-gray-900 text-white text-xs font-medium whitespace-nowrap
                opacity-0 group-hover:opacity-100
                transition-opacity duration-150 shadow-lg z-50
              "
            >
              Logout
              <span className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </span>
          )}
        </button>
      </div>

      {/* ── Collapse toggle button ──────────────────────────────────────── */}
      {/* Only rendered after hydration so there's no flash on first paint */}
      {mounted && (
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            absolute -right-3 top-[72px]
            flex items-center justify-center
            w-6 h-6 rounded-full
            bg-white border border-gray-200 shadow-sm
            text-gray-500 hover:text-[#D95D1E] hover:border-[#D95D1E]
            transition-all duration-200 z-10
          "
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      )}
    </aside>
  );
}

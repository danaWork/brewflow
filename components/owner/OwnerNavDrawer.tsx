'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  LogOut,
  X,
} from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import { useState, useEffect } from 'react';
import { getPromotionsStockStatusAction } from '@/app/actions/promotions';
import { getInventoryStockStatusAction } from '@/app/actions/inventory';
import { getMobileNavGroups } from '@/components/owner/ownerNavConfig';

interface OwnerNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  role?: string;
}

export default function OwnerNavDrawer({ isOpen, onClose, branchId, role }: OwnerNavDrawerProps) {
  const navGroups = getMobileNavGroups(role);
  const pathname = usePathname();
  const [hasPromoOutOfStock, setHasPromoOutOfStock] = useState(false);
  const [hasInventoryLowStock, setHasInventoryLowStock] = useState(false);

  useEffect(() => {
    if (isOpen && branchId) {
      const checkStock = async () => {
        const [promoRes, invRes] = await Promise.all([
          getPromotionsStockStatusAction(branchId),
          getInventoryStockStatusAction(branchId)
        ]);
        
        if (promoRes.success) {
          setHasPromoOutOfStock(!!promoRes.hasOutOfStock);
        }
        if (invRes.success) {
          setHasInventoryLowStock(!!invRes.hasLowStock);
        }
      };
      checkStock();
    }
  }, [isOpen, branchId]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between gap-3 pb-5 border-b border-gray-200 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFEBE0] p-2 rounded-xl">
              <Coffee size={24} className="text-[#D95D1E]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">BrewFlow</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto pt-1">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                {group.title}
              </h3>
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
                        onClick={onClose}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-[#D95D1E] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                        <span className="flex-1">{item.label}</span>
                        {item.label === 'Promotions' && hasPromoOutOfStock && (
                          <div className="flex items-center justify-center w-4 h-4 bg-red-600 text-white rounded-full ring-2 ring-white">
                            <span className="text-[10px] font-bold">!</span>
                          </div>
                        )}
                        {item.label === 'Inventory' && hasInventoryLowStock && (
                          <div className="flex items-center justify-center w-4 h-4 bg-red-600 text-white rounded-full ring-2 ring-white">
                            <span className="text-[10px] font-bold">!</span>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="pt-5 border-t border-gray-200 mt-2">
          <button
            type="button"
            onClick={async () => {
              onClose();
              const { logout } = await import('@/app/actions/auth');
              await logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </Drawer>
  );
}

import type { ComponentType } from 'react';
import {
  ClipboardList,
  QrCode,
  Tag,
  BarChart3,
  UtensilsCrossed,
  Package,
  Calculator,
  Settings,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const desktopNavGroups: NavGroup[] = [
  {
    title: 'Point of Sale',
    items: [
      { label: 'POS Terminal', href: '/owner/pos', icon: Calculator },
      { label: 'Receipts', href: '/owner/pos/receipts', icon: ClipboardList },
    ],
  },
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
  {
    title: 'Settings',
    items: [{ label: 'Shop Settings', href: '/owner/settings', icon: Settings }],
  },
];

/** Mobile drawer uses slightly different group titles for historical parity */
export const mobileNavGroups: NavGroup[] = [
  {
    title: 'Point of Sale',
    items: [
      { label: 'POS Terminal', href: '/owner/pos', icon: Calculator },
      { label: 'Receipts', href: '/owner/pos/receipts', icon: ClipboardList },
    ],
  },
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
  {
    title: 'Settings',
    items: [{ label: 'Shop Settings', href: '/owner/settings', icon: Settings }],
  },
];

export function getDesktopNavGroups(role: string | undefined): NavGroup[] {
  if (role === 'KITCHEN_STAFF') {
    return [
      {
        title: 'Point of Sale',
        items: [
          { label: 'POS Terminal', href: '/owner/pos', icon: Calculator },
          { label: 'Receipts', href: '/owner/pos/receipts', icon: ClipboardList },
        ],
      },
      {
        title: 'Operations',
        items: [{ label: 'Live Orders', href: '/owner/live-orders', icon: ClipboardList }],
      },
    ];
  }
  return desktopNavGroups;
}

export function getMobileNavGroups(role: string | undefined): NavGroup[] {
  if (role === 'KITCHEN_STAFF') {
    return [
      {
        title: 'Point of Sale',
        items: [
          { label: 'POS Terminal', href: '/owner/pos', icon: Calculator },
          { label: 'Receipts', href: '/owner/pos/receipts', icon: ClipboardList },
        ],
      },
      {
        title: 'Operations',
        items: [{ label: 'Live Orders', href: '/owner/live-orders', icon: ClipboardList }],
      },
    ];
  }
  return mobileNavGroups;
}

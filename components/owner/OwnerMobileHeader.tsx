'use client';

import { Coffee, Menu } from 'lucide-react';

interface OwnerMobileHeaderProps {
  onMenuClick: () => void;
}

export default function OwnerMobileHeader({ onMenuClick }: OwnerMobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-[#FDFBF9] border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="bg-[#FFEBE0] p-2 rounded-xl">
          <Coffee size={24} className="text-[#D95D1E]" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">BrewFlow</h1>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
    </header>
  );
}

import { Coffee, Cookie, UtensilsCrossed } from 'lucide-react';

interface TypeToggleProps {
  activeType: 'drinks' | 'snacks' | 'meals';
  onToggle: (type: 'drinks' | 'snacks' | 'meals') => void;
}

export default function TypeToggle({ activeType, onToggle }: TypeToggleProps) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-white w-full">
      <button
        onClick={() => onToggle('drinks')}
        className={`
          flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm w-full min-w-0
          ${activeType === 'drinks'
            ? 'bg-[#D95D1E] text-white shadow-sm border border-black' // Custom orange color from image
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
        `}
      >
        <Coffee size={18} strokeWidth={2.5} />
        <span>Drinks</span>
      </button>

      <button
        onClick={() => onToggle('snacks')}
        className={`
          flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm w-full min-w-0
          ${activeType === 'snacks'
            ? 'bg-[#D95D1E] text-white shadow-sm border border-black' 
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
        `}
      >
        <Cookie size={18} strokeWidth={2.5} />
        <span>Snacks</span>
      </button>

      <button
        onClick={() => onToggle('meals')}
        className={`
          flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm w-full min-w-0
          ${activeType === 'meals'
            ? 'bg-[#D95D1E] text-white shadow-sm border border-black'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
        `}
      >
        <UtensilsCrossed size={18} strokeWidth={2.5} />
        <span>Meals</span>
      </button>
    </div>
  );
}

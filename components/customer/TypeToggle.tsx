import { Coffee, Cookie } from 'lucide-react';

interface TypeToggleProps {
  activeType: 'drinks' | 'snacks';
  onToggle: (type: 'drinks' | 'snacks') => void;
}

export default function TypeToggle({ activeType, onToggle }: TypeToggleProps) {
  return (
    <div className="flex gap-3 px-4 py-2 bg-white">
      <button
        onClick={() => onToggle('drinks')}
        className={`
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm
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
          flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm
          ${activeType === 'snacks'
            ? 'bg-[#D95D1E] text-white shadow-sm border border-black' 
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
        `}
      >
        <Cookie size={18} strokeWidth={2.5} />
        <span>Snacks</span>
      </button>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils'; // Assuming there's a utils file, if not I'll stick to standard template or create it. 
// Wait, I haven't checked for utils. I'll check lib structure.
// If not present, I'll inline the class logic or create lib/utils.ts

interface Category {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  activeType: 'drinks' | 'snacks';
}

export default function CategoryFilter({ categories, activeCategoryId, onSelectCategory, activeType }: CategoryFilterProps) {
  return (
    <div className="flex overflow-x-auto pb-4 pt-2 gap-3 no-scrollbar px-4 scroll-smooth">
      <button
        onClick={() => onSelectCategory('all')}
        className={`
          whitespace-nowrap px-4 py-2 rounded-lg text-[13px] font-bold transition-colors
          ${activeCategoryId === 'all' 
            ? 'bg-[#F1F5F9] text-gray-900 border border-black' 
            : 'bg-white text-gray-600'}
        `}
      >
        {activeType === 'drinks' ? 'All Drinks' : 'All Snacks'}
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`
            whitespace-nowrap px-4 py-2 rounded-lg text-[13px] font-bold transition-colors
            ${activeCategoryId === category.id
              ? 'bg-[#D95D1E] text-white shadow-md border border-black' 
              : 'bg-white text-gray-600'}
          `}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, ChevronDown, Check, Package, X } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    basePrice: string;
    imageUrl: string | null;
    categoryName: string;
    categoryType: string;
}

interface CrossSellSelectProps {
    values: string[];
    options: Product[];
    onChange: (productIds: string[]) => void;
    placeholder?: string;
}

export default forwardRef<{ open: () => void }, CrossSellSelectProps>(function CrossSellSelect({ values, options, onChange, placeholder = "Choose items..." }, ref) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        open: () => setIsOpen(true)
    }));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (productId: string) => {
        const newValues = values.includes(productId)
            ? values.filter(v => v !== productId)
            : values.length < 2
                ? [...values, productId]
                : values; // Max 2 items
        onChange(newValues);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:border-orange-200 transition-colors"
            >
                <div className="flex flex-wrap gap-1 items-center">
                    {values.length === 0 ? (
                        <span className="text-gray-400">{placeholder}</span>
                    ) : (
                        <span className="text-sm">{values.length} item{values.length !== 1 ? 's' : ''} selected</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full bg-gray-50 border-none rounded-lg pl-9 pr-4 py-2.5 text-xs focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = values.includes(opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => toggleOption(opt.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${isSelected
                                                ? 'bg-orange-50'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {opt.imageUrl ? (
                                                <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={16} className="text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-gray-900 truncate">{opt.name}</div>
                                            <div className="text-[10px] text-gray-400">₱{parseFloat(opt.basePrice).toFixed(2)}</div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-8 text-center text-xs text-gray-400 italic">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

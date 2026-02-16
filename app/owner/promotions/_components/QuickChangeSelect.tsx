'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    basePrice: string;
}

interface QuickChangeSelectProps {
    value: string;
    options: Product[];
    onChange: (productId: string) => void;
}

export default function QuickChangeSelect({ value, options, onChange }: QuickChangeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedProduct = options.find(o => o.id === value);

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

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg px-4 py-2 text-sm text-gray-700 transition-colors"
            >
                <span className="truncate">{selectedProduct?.name || 'Select Item'}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="w-full bg-gray-50 border-none rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-orange-500/20 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${value === opt.id
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="truncate">{opt.name}</span>
                                    {value === opt.id && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-400 italic">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export default function Drawer({ 
  isOpen, 
  onClose, 
  children, 
  title,
  showCloseButton = true 
}: DrawerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div 
        className={`
          relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden 
          flex flex-col max-h-[85vh] sm:max-h-[90vh]
          transition-transform duration-300 ease-out transform
          ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

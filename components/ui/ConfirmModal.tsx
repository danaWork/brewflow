'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  variant?: 'primary' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm', 
  message, 
  variant = 'primary',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setShow(true);
    } else {
      document.body.style.overflow = 'unset';
      setTimeout(() => setShow(false), 200);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen && !show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div  
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Card */}
      <div 
        className={`
          relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-200
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" /> {/* Handle bar look */}
        
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-base mb-6">{message}</p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl border border-gray-300 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 text-white font-bold py-3.5 rounded-xl border border-black transition-colors ${
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#D95D1E] hover:bg-[#c2521a]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'info' | 'danger';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Yes, I'm sure",
    cancelText = 'Cancel',
    type = 'warning'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const colors = {
        warning: 'bg-orange-50 text-orange-500',
        info: 'bg-blue-50 text-blue-500',
        danger: 'bg-red-50 text-red-500'
    };

    const btnColors = {
        warning: 'bg-orange-500 hover:bg-orange-600',
        info: 'bg-blue-500 hover:bg-blue-600',
        danger: 'bg-red-500 hover:bg-red-600'
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-5 sm:p-6 text-center space-y-4">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colors[type]}`}>
                        <AlertCircle size={24} />
                    </div>

                    <div className="space-y-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 break-words">{message}</p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm min-h-[44px] sm:min-h-0 ${btnColors[type]}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-0"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

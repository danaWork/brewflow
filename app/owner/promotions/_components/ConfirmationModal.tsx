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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center space-y-4">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${colors[type]}`}>
                        <AlertCircle size={24} />
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500">{message}</p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm ${btnColors[type]}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

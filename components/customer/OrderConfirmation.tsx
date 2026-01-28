'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTable } from '@/context/TableContext';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderConfirmation({ isOpen, onClose, orderId }: OrderConfirmationProps) {
  const router = useRouter();
  const { tableId } = useTable();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
         
         {/* Success Icon */}
         <div className="mx-auto w-20 h-20 bg-[#00B050] rounded-full flex items-center justify-center mb-6 shadow-green-200 shadow-lg">
             <Check className="text-white w-10 h-10" strokeWidth={3} />
         </div>

         <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
         <p className="text-gray-500 mb-8 max-w-[200px] mx-auto leading-relaxed">
             Your order has been received and is being prepared.
         </p>

         {/* Receipt Card Look */}
         <div className="bg-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ORDER NUMBER</p>
             <p className="text-3xl font-bold text-[#D95D1E] mb-2">{orderId}</p>
             <p className="text-sm text-gray-400">Payment: Cash</p>
             
             <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-gray-500 text-sm">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                 You ordered from table {tableId || '1'}
             </div>
         </div>

         <button
            onClick={() => {
                onClose();
                router.push(`/customer/table/${tableId || '1'}`);
            }}
            className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg border-2 border-gray-900 hover:bg-[#c4531b] transition-colors active:scale-95"
         >
            Order More
         </button>

      </div>
    </div>
  );
}


'use client';

import { Minus, Plus, X, Package, Droplet } from 'lucide-react';
import Image from 'next/image';
import { CartItem as CartItemType, useCart } from '@/context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const isBundle = item.extras && item.extras.length > 0;


  // Helper for Quantity Controls
  const QuantityControls = ({ id, qty, isSmall = false, onUpdate }: { id: string, qty: number, isSmall?: boolean, onUpdate?: (delta: number) => void }) => (
    <div className="flex items-center gap-3">
        <button 
           onClick={() => onUpdate ? onUpdate(-1) : updateQuantity(id, -1)}
           className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-100 active:scale-95 transition-all ${isSmall ? 'w-8 h-8' : 'w-10 h-10'}`}
        >
           <Minus size={isSmall ? 14 : 16} />
        </button>
        <span className={`font-bold text-gray-900 text-center ${isSmall ? 'w-4 text-base' : 'w-6 text-lg'}`}>{qty}</span>
        <button 
           onClick={() => onUpdate ? onUpdate(1) : updateQuantity(id, 1)}
           className={`flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-900 hover:bg-gray-50 active:scale-95 transition-all ${isSmall ? 'w-8 h-8' : 'w-10 h-10'}`}
        >
            <Plus size={isSmall ? 14 : 16} />
        </button>
    </div>
  );

  // Determine bundle type
  const hasExtras = item.extras && item.extras.length > 0;
  const isNamedBundle = !!item.bundleLabel; // e.g. "Perfect Pair Bundle"

  // 1. UNIFIED CARD LAYOUT (Named Bundle)
  if (isNamedBundle) {
      return (
        <div className="bg-orange-50 rounded-3xl p-5 shadow-sm border border-orange-100">
            {/* Badge */}
            <div className="mb-4">
                 <span className="inline-flex items-center gap-2 bg-gray-200/50 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                    <Package size={14} className="text-[#D95D1E]" />
                    {item.bundleLabel}
                 </span>
            </div>

            {/* Main Item */}
            <div className="flex gap-4 relative">
                <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                   {item.image ? (
                     <Image src={item.image} alt={item.name} fill className="object-cover" />
                   ) : item.name.toLowerCase().includes('water') ? (
                     <Droplet className="text-blue-400" size={28} />
                   ) : null}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                            <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-1">
                                {Object.entries(item.options || {})
                                    .filter(([key]) => key !== '__optionIds')
                                    .map(([key, value]) => (
                                    <span key={key} className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">
                                        {key}: {String(value)}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Remove Bundle Button (Top Right) */}
                        <button 
                            onClick={() => removeItem(item.id)}
                            className="text-gray-300 hover:text-gray-500 p-1"
                        >
                            <X size={18} />
                        </button>
                     </div>

                     <div className="flex justify-between items-end mt-2">
                         <QuantityControls id={item.id} qty={item.quantity} />
                         <span className="font-bold text-gray-900 text-xl">
                            ₱{(item.price * item.quantity).toFixed(2)}
                         </span>
                     </div>
                </div>
            </div>

            {/* Divider */}
            {hasExtras && <div className="my-5 border-t border-dashed border-orange-200/50" />}

            {/* Extras */}
            {item.extras?.map((extra, idx) => (
                  <div key={idx} className={`flex gap-4 relative ${idx > 0 ? 'mt-6 pt-6 border-t border-dashed border-orange-200/50' : 'mt-0'}`}>
                       <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-black/5 flex items-center justify-center">
                          {extra.image ? (
                            <Image src={extra.image} alt={extra.name} fill className="object-cover" />
                          ) : extra.name.toLowerCase().includes('water') ? (
                            <Droplet className="text-blue-400" size={28} />
                          ) : null}
                       </div>
                       
                       <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold text-gray-900 text-base">{extra.name}</h4>
                          </div>

                          <div className="flex justify-between items-end mt-2">
                              <div className="text-gray-500 font-medium text-sm flex items-center h-8">
                                  Qty: {extra.quantity || 1}
                              </div>
                              
                              <div className="text-right leading-none">
                                  <div className="text-gray-300 line-through text-xs mb-1">
                                      ₱{(extra.price * 1.25 * (extra.quantity || 1)).toFixed(2)}
                                  </div>
                                  <div className="text-[#00B050] font-bold text-lg">
                                      ₱{(extra.price * (extra.quantity || 1)).toFixed(2)}
                                  </div>
                              </div>
                          </div>
                       </div>
                  </div>
             ))}
        </div>
      );
  }

  // 2. STANDARD / SPLIT LAYOUT (Single Item or Frequent Extras)
  return (
    <div className="space-y-[-12px] group">
      
      {/* 1. MAIN ITEM CARD */}
      <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative z-10 ${hasExtras ? 'rounded-b-none border-b-0 pb-8' : ''}`}>
          <div className="flex gap-4 relative">
            <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
               {item.image ? (
                 <Image src={item.image} alt={item.name} fill className="object-cover" />
               ) : item.name.toLowerCase().includes('water') ? (
                 <Droplet className="text-blue-400" size={32} />
               ) : null}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                            <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-1">
                                {Object.entries(item.options || {})
                                    .filter(([key]) => key !== '__optionIds')
                                    .map(([key, value]) => (
                                    <span key={key} className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">
                                        {key}: {String(value)}
                                    </span>
                                ))}
                            </div>
                    </div>
                    
                    <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-gray-500 p-1"
                    >
                        <X size={18} />
                    </button>
                 </div>

                 <div className="flex justify-between items-end mt-2">
                     <QuantityControls id={item.id} qty={item.quantity} />
                     <span className="font-bold text-gray-900 text-xl">
                        ₱{(item.price * item.quantity).toFixed(2)}
                     </span>
                 </div>
            </div>
          </div>
      </div>

      {/* 2. EXTRAS / BUNDLE ATTACHMENT CARD */}
      {hasExtras && (
        <div className="bg-orange-50 rounded-2xl rounded-t-none p-5 pt-6 shadow-sm border border-orange-100 border-t-0 relative z-0 border-l-4 border-l-[#D95D1E]">
             {item.extras?.map((extra, idx) => (
                  <div key={idx} className={`flex gap-4 relative ${idx > 0 ? 'mt-6 pt-6 border-t border-dashed border-orange-200/50' : 'mt-2'}`}>
                       <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-black/5 flex items-center justify-center">
                          {extra.image ? (
                            <Image src={extra.image} alt={extra.name} fill className="object-cover" />
                          ) : extra.name.toLowerCase().includes('water') ? (
                            <Droplet className="text-blue-400" size={28} />
                          ) : null}
                       </div>
                       
                       <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 flex-wrap">
                                 <span className="bg-[#D95D1E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                   TOGETHER
                                 </span>
                                 <h4 className="font-bold text-gray-900 text-base">{extra.name}</h4>
                              </div>
                              
                              <button 
                                  className="text-gray-300 p-1 invisible"
                                  title="Remove this item"
                              >
                                  <X size={16} />
                              </button>
                          </div>

                          <div className="flex justify-between items-end mt-2">
                              <div className="text-gray-500 font-medium text-sm flex items-center h-10">
                                  Qty: {extra.quantity || 1}
                              </div>
                              
                              <div className="text-right leading-none">
                                  <div className="text-gray-300 line-through text-xs mb-1">
                                      ₱{(extra.price * 1.25 * (extra.quantity || 1)).toFixed(2)}
                                  </div>
                                  <div className="text-[#00B050] font-bold text-lg">
                                      ₱{(extra.price * (extra.quantity || 1)).toFixed(2)}
                                  </div>
                              </div>
                          </div>
                       </div>
                  </div>
             ))}
        </div>
      )}
    </div>
  );
}

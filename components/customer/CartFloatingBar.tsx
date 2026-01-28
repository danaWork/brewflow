'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';

export default function CartFloatingBar() {
  const { cartCount, cartTotal } = useCart();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-40">
      <Link 
        href="/customer/cart"
        className="flex items-center justify-between bg-white text-gray-900 shadow-xl rounded-xl p-4 border border-gray-100 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
             <Image 
               src="/icons/cart-3-svgrepo-com.svg" 
               alt="Cart" 
               width={32} 
               height={32} 
             />
             <div className="absolute -top-1 -right-1 bg-[#D95D1E] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white">
               {cartCount}
             </div>
             <span className="sr-only">items in cart</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">View Cart</span>
        </div>
        
        <span className="font-bold text-lg text-gray-900">
          ₱{cartTotal.toFixed(2)}
        </span>
      </Link>
    </div>
  );
}

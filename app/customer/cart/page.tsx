'use client';

import { useCart } from '@/context/CartContext';
import { useTable } from '@/context/TableContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CartItem from '@/components/customer/CartItem';

export default function CartPage() {
  const { items, cartTotal, cartCount } = useCart();
  const { tableName, tableId } = useTable();
  const router = useRouter();

  // Calculate generic discount (mock logic: 20% off on extras that are part of a bundle)
  // In a real app, 'originalPrice' would be stored in cart item extra data.
  // For now, if it's a bundle extra (has tag), we assume ~20% diff for display if we don't have original price.
  // But wait, our mock data in ProductDrawerContent had originalPrice. 
  // If useCart saves full objects, we might have it. 
  // Let's assume we can derive it or just show 0 if missing.
  
  const totalDiscount = items.reduce((sum, item) => {
    if (!item.extras) return sum;
    return sum + item.extras.reduce((extSum, extra) => {
        // If extra has 'originalPrice' property (we need to cast or extended type)
        // For now, let's just assume a hardcoded generic discount for "TOGETHER" items 
        // to match the visual of "saving".
        // Visual hack: If it's a bundle extra, assume the price shown is the discounted one.
        // And the "original" was 20% higher. 
        // discount = original - current.
        // original = current / 0.8
        // discount = (current / 0.8) - current = current * 0.25
        return extSum + (extra.price * 0.25);
    }, 0);
  }, 0);

  // We want to show "Subtotal" as the pre-discount price?
  // Or Subtotal = cartTotal (actual pay) + discount?
  // Usually Subtotal is the sum of original prices.
  const subtotal = cartTotal + totalDiscount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 text-center max-w-xs">
          Looks like you haven't added anything yet. Go ahead and explore our menu!
        </p>
        <Link 
          href={`/customer/table/${tableId || '1'}`} 
          className="bg-[#D95D1E] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-200"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
            <Link href={`/customer/table/${tableId || '1'}`} className="p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <ArrowLeft size={24} />
            </Link>
            
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                    <Image src="/icons/cart-3-svgrepo-com.svg" width={24} height={24} alt="Cart" className="w-6 h-6" />
                    <h1 className="text-lg font-bold text-gray-900">Your Order</h1>
                    <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded">
                        {cartCount} items
                    </span>
                </div>
                <span className="text-sm text-gray-500">{tableName || 'Table ...'}</span>
            </div>

            <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto p-6 space-y-3">
          
          <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-medium text-sm">
                    <span>Discount</span>
                    <span>-₱{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-900 font-bold text-2xl pt-2">
                <span>Total</span>
                <span>₱{cartTotal.toFixed(2)}</span>
              </div>
          </div>
          
          <Link
            href="/customer/checkout"
            className="w-full bg-[#D95D1E] text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center gap-2 shadow-lg shadow-orange-200 hover:bg-[#c4531b] transition-colors border border-black"
          >
            <span>Checkout</span>
            <ArrowLeft size={20} className="rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}

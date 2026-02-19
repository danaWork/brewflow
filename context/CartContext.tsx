'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type CartItem = {
  id: string; // Unique ID for the cart item (productID + options)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: Record<string, any>; // For size, milk, sweetness etc.
  extras?: CartItem[]; // Bundled items
  bundleLabel?: string; // e.g. "Perfect Pair Bundle"
  tag?: string; // e.g. "TOGETHER"
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  updateExtraQuantity: (itemId: string, extraIndex: number, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('coffee-shop-cart');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  });

  // Save to LocalStorage whenever items change
  useEffect(() => {
    localStorage.setItem('coffee-shop-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Create a unique ID based on product and options
      const cartItemId = `${newItem.productId}-${Date.now()}`;
      
      // Ensure extras have quantity initialized if not present
      const extrasWithQty = newItem.extras?.map(e => ({ ...e, quantity: e.quantity || 1 })) || [];

      return [...prev, { ...newItem, id: cartItemId, extras: extrasWithQty }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const updateExtraQuantity = (itemId: string, extraIndex: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.extras) {
           const newExtras = [...item.extras];
           const currentQty = newExtras[extraIndex].quantity || 1;
           const newQty = Math.max(0, currentQty + delta);

           if (newQty === 0) {
               newExtras.splice(extraIndex, 1);
           } else {
               newExtras[extraIndex] = { ...newExtras[extraIndex], quantity: newQty };
           }
           return { ...item, extras: newExtras };
        }
        return item;
      })
    );
  };

  const clearCart = () => setItems([]);

  // DECOUPLED TOTAL CALCULATION
  // Main Item Cost = price * quantity
  // Extras Cost = Sum(extra.price * extra.quantity) -- INDEPENDENT of Main Item Quantity
  const cartTotal = items.reduce((sum, item) => {
    const mainItemTotal = item.price * item.quantity;
    const extrasTotal = item.extras?.reduce((acc, ex) => acc + (ex.price * (ex.quantity || 1)), 0) || 0;
    return sum + mainItemTotal + extrasTotal;
  }, 0);

  // Cart Count Loop
  const mapCount = (item: CartItem): number => {
      const extrasCount = item.extras?.reduce((acc, ex) => acc + (ex.quantity || 1), 0) || 0;
      return item.quantity + extrasCount;
  }
  const cartCount = items.reduce((sum, item) => sum + mapCount(item), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateExtraQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

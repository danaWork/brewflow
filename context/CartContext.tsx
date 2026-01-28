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
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('coffee-shop-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage whenever items change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('coffee-shop-cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Create a unique ID based on product and options
      // Simple hash or random string suffices for now
      const cartItemId = `${newItem.productId}-${Date.now()}`;
      
      // Check if exact same item exists (optional optimization)
      // For now, we just add as new line item
      return [...prev, { ...newItem, id: cartItemId }];
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

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, item) => {
    const extrasTotal = item.extras?.reduce((acc, ex) => acc + ex.price, 0) || 0;
    return sum + (item.price + extrasTotal) * item.quantity;
  }, 0);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
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

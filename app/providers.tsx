'use client';

import { OrderProvider } from '@/context/OrderContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { TableProvider } from '@/context/TableContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TableProvider>
        <CartProvider>
          <OrderProvider>
            {children}
          </OrderProvider>
        </CartProvider>
      </TableProvider>
    </AuthProvider>
  );
}

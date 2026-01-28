import { CartProvider } from '@/context/CartContext';
import { TableProvider } from '@/context/TableContext';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TableProvider>
      <CartProvider>
        <div className="customer-app min-h-screen bg-gray-50">
          <main>{children}</main>
        </div>
      </CartProvider>
    </TableProvider>
  );
}

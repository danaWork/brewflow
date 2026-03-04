'use client';

import { OrderProvider } from '@/context/OrderContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <OrderProvider>
            {children}
        </OrderProvider>
    );
}

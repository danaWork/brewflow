import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Promotions',
};

export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

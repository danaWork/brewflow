import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Live Orders',
};

export default function LiveOrdersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

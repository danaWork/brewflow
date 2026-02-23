import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Menu',
};

export default function TableLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

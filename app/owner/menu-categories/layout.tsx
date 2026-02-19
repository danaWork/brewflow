import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Menu & Categories',
};

export default function MenuCategoriesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

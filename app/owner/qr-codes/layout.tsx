import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'QR Codes',
};

export default function QRCodesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Access your BrewFlow shop management dashboard.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

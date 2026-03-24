import { requireManagerRole } from '@/lib/roleGuard';

export default async function QrCodesLayout({ children }: { children: React.ReactNode }) {
    await requireManagerRole();
    return <>{children}</>;
}

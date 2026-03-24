import { redirect } from 'next/navigation';
import { getUserSession } from '@/app/actions/auth';

/**
 * Ensures the user is logged in and may access manager-only shop dashboard routes.
 * Kitchen staff are redirected to Live Orders.
 */
export async function requireManagerRole() {
    const session = await getUserSession();

    if (!session) {
        redirect('/login');
    }

    if (session.role === 'KITCHEN_STAFF') {
        redirect('/owner/live-orders');
    }
}

/** Shop settings and staff management: branch managers only (not kitchen staff or superadmin). */
export async function requireBranchManagerShopSettings() {
    const session = await getUserSession();

    if (!session) {
        redirect('/login');
    }

    if (session.role === 'KITCHEN_STAFF') {
        redirect('/owner/live-orders');
    }

    if (session.role !== 'BRANCH_MANAGER') {
        redirect('/owner/analytics');
    }

    if (!session.branchId) {
        redirect('/owner/analytics');
    }
}

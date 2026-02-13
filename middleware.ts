import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const session = await getSession();
    const path = request.nextUrl.pathname;

    if (!session && (path.startsWith('/admin') || path.startsWith('/owner') || path.startsWith('/staff'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session && path === '/login') {
        const role = session.user.role;
        if (role === 'SUPERADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        if (role === 'BRANCH_MANAGER') return NextResponse.redirect(new URL('/owner/analytics', request.url));
        if (role === 'KITCHEN_STAFF') return NextResponse.redirect(new URL('/staff/orders', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/owner/:path*', '/staff/:path*', '/login'],
};

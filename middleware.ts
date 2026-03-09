import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTenantFromHost, getRootDomain } from '@/lib/tenant';

export async function middleware(request: NextRequest) {
    const session = await getSession();
    const path = request.nextUrl.pathname;
    const host = request.nextUrl.host;
    const tenant = getTenantFromHost(host);

    // Shop host: do not allow /admin (redirect to admin host)
    if (tenant.type === 'shop' && path.startsWith('/admin')) {
        const protocol = request.nextUrl.protocol;
        const adminOrigin = `${protocol}//admin.${getRootDomain()}`;
        return NextResponse.redirect(new URL(path || '/admin/dashboard', adminOrigin));
    }

    // Admin host: do not allow /owner or /staff (they must use their shop subdomain)
    if (tenant.type === 'admin' && (path.startsWith('/owner') || path.startsWith('/staff'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Protect dashboard routes: require session
    if (!session && (path.startsWith('/admin') || path.startsWith('/owner') || path.startsWith('/staff'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Post-login redirect when already logged in and hitting /login
    if (session && path === '/login') {
        const role = session.user.role;
        if (role === 'SUPERADMIN') {
            const adminOrigin = tenant.type === 'admin'
                ? request.nextUrl.origin
                : `${request.nextUrl.protocol}//admin.${getRootDomain()}`;
            return NextResponse.redirect(new URL('/admin/dashboard', adminOrigin));
        }
        if (role === 'BRANCH_MANAGER') return NextResponse.redirect(new URL('/owner/analytics', request.url));
        if (role === 'KITCHEN_STAFF') return NextResponse.redirect(new URL('/staff/orders', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/owner/:path*', '/staff/:path*', '/login'],
};

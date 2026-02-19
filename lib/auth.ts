import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function getKey() {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        // During build time, Next.js might evaluate this. 
        // We throw only if we are actually trying to use it.
        // Or we can return a dummy key if it's not production.
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET is not set in environment variables');
        }
        return new TextEncoder().encode('debug_secret_key_only_for_build');
    }
    return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getKey());
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, getKey(), {
        algorithms: ['HS256'],
    });
    return payload;
}

export async function login(user: { id: string; email: string; role: string; branchId: string | null; companyId: string }) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user, expires });

    (await cookies()).set('session', session, { expires, httpOnly: true });
}

export async function logout() {
    (await cookies()).set('session', '', { expires: new Date(0) });
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (e) {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    try {
        const parsed = await decrypt(session);
        parsed.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const res = NextResponse.next();
        res.cookies.set({
            name: 'session',
            value: await encrypt(parsed),
            httpOnly: true,
            expires: parsed.expires,
        });
        return res;
    } catch (e) {
        return;
    }
}

'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, companies, branches, passwordResetTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { login, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTenantFromHost } from '@/lib/tenant';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    const host = (await headers()).get('host') ?? '';
    const tenant = getTenantFromHost(host);

    if (tenant.type === 'admin') {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return { error: 'Invalid credentials' };
        }
        if (user.role !== 'SUPERADMIN') {
            return { error: 'Use your shop URL to sign in' };
        }
        await login({
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
            companyId: user.companyId,
        });
        redirect('/admin/dashboard');
    }

    // Shop host: resolve company by subdomain, then user by email + companyId
    if (tenant.type === 'shop' && tenant.subdomain) {
        const [company] = await db.select().from(companies).where(eq(companies.subdomain, tenant.subdomain)).limit(1);
        if (!company) {
            return { error: 'Invalid credentials' };
        }
        const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.companyId, company.id))).limit(1);
        if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
            return { error: 'Invalid credentials' };
        }
        await login({
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
            companyId: user.companyId,
        });
        const role = user.role;
        if (role === 'BRANCH_MANAGER') redirect('/owner/analytics');
        if (role === 'KITCHEN_STAFF') redirect('/owner/live-orders');
        redirect('/');
    }

    return { error: 'Invalid credentials' };
}

export async function seedAction() {
    const [existing] = await db.select().from(users).limit(1);
    if (existing) return { message: 'Already seeded' };

    const [company] = await db.insert(companies).values({
        name: 'BrewFlow HQ',
        subdomain: 'hq',
        contactEmail: 'hq@brewflow.com',
    }).returning();

    const [branch] = await db.insert(branches).values({
        companyId: company.id,
        branchName: 'Main Branch',
        address: 'Makati, Philippines',
    }).returning();

    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) {
        return { message: 'Error: SEED_ADMIN_PASSWORD not set in .env' };
    }

    const passwordHash = bcrypt.hashSync(seedPassword, 10);

    await db.insert(users).values([
        {
            companyId: company.id,
            email: 'admin@brewflow.com',
            passwordHash,
            role: 'SUPERADMIN',
        },
        {
            companyId: company.id,
            branchId: branch.id,
            email: 'manager@brewflow.com',
            passwordHash,
            role: 'BRANCH_MANAGER',
        },
        {
            companyId: company.id,
            branchId: branch.id,
            email: 'staff@brewflow.com',
            passwordHash,
            role: 'KITCHEN_STAFF',
        }
    ]);

    return { message: 'Seeded successfully' };
}

export async function getSessionAction() {
    const session = await getSession();
    return session;
}

import { logout as authLogout } from '@/lib/auth';

export async function logout() {
    return await authLogout();
}

export async function getUserSession() {
    const session = await getSession();
    if (!session || !session.user) return null;

    return {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        branchId: session.user.branchId,
        companyId: session.user.companyId,
    };
}

export async function resetPasswordWithToken(token: string, newPasswordPlain: string) {
    try {
        const [resetToken] = await db.select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token))
            .limit(1);

        if (!resetToken) {
            return { success: false, error: 'Invalid or expired token' };
        }

        if (new Date() > resetToken.expiresAt) {
            await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));
            return { success: false, error: 'Token has expired' };
        }

        const passwordHash = bcrypt.hashSync(newPasswordPlain, 10);

        await db.update(users)
            .set({ passwordHash })
            .where(eq(users.id, resetToken.userId));

        // Delete the used token
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, resetToken.id));

        return { success: true };
    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, error: 'Internal server error' };
    }
}

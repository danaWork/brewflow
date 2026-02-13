'use server';

import { db } from '@/lib/db';
import { users, companies, branches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { login, getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

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
    if (role === 'SUPERADMIN') redirect('/admin/dashboard');
    if (role === 'BRANCH_MANAGER') redirect('/owner/analytics');
    if (role === 'KITCHEN_STAFF') redirect('/staff/orders');

    redirect('/');
}

export async function seedAction() {
    const [existing] = await db.select().from(users).limit(1);
    if (existing) return { message: 'Already seeded' };

    const [company] = await db.insert(companies).values({
        name: 'BrewFlow HQ',
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

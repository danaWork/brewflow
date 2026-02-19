import { db } from '@/lib/db';
import { activityLogs } from '@/db/schema';

export async function logActivity(
    shopId: string | null,
    userId: string,
    action: string,
    details?: any
) {
    try {
        await db.insert(activityLogs).values({
            shopId: shopId,
            userId: userId,
            action: action,
            details: details ? JSON.stringify(details) : null,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

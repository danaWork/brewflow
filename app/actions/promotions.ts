'use server';

import { logActivity } from '@/lib/activity';
import { getUserSession } from './auth';

// Placeholder for future promotions table
// For now, we'll just log the activity

export async function createPromotion(
    branchId: string,
    promotionData: {
        name: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        startDate: Date;
        endDate: Date;
        applicableProducts?: string[];
    }
) {
    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // TODO: Insert into promotions table when created
        // For now, just log the activity

        await logActivity(
            branchId,
            session.userId,
            'Promotion Created',
            {
                promotionName: promotionData.name,
                discountType: promotionData.discountType,
                discountValue: promotionData.discountValue,
                startDate: promotionData.startDate.toISOString(),
                endDate: promotionData.endDate.toISOString(),
                productCount: promotionData.applicableProducts?.length || 0,
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error creating promotion:', error);
        return { success: false, error: 'Failed to create promotion' };
    }
}

export async function updatePromotion(
    branchId: string,
    promotionId: string,
    updates: {
        name?: string;
        discountValue?: number;
        endDate?: Date;
    }
) {
    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // TODO: Update promotions table when created

        await logActivity(
            branchId,
            session.userId,
            'Promotion Updated',
            {
                promotionId,
                updates,
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error updating promotion:', error);
        return { success: false, error: 'Failed to update promotion' };
    }
}

export async function deletePromotion(branchId: string, promotionId: string) {
    try {
        const session = await getUserSession();
        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        // TODO: Delete from promotions table when created

        await logActivity(
            branchId,
            session.userId,
            'Promotion Deleted',
            {
                promotionId,
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return { success: false, error: 'Failed to delete promotion' };
    }
}

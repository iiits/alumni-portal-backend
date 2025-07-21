import { Request, Response } from 'express';
import { apiError, apiSuccess } from '../utils/apiResponses';
import {
    getEventAnalytics,
    getJobAnalytics,
    getReferralAnalytics,
    getUserAnalytics,
} from './helpers/adminAnalyticsHelper';

// Get admin dashboard analytics
// TODO: Add active users count when session management is implemented
export const getDashboardAnalytics = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const [userStats, eventStats, referralStats, jobStats] =
            await Promise.all([
                getUserAnalytics(),
                getEventAnalytics(),
                getReferralAnalytics(),
                getJobAnalytics(),
            ]);

        const analytics = {
            users: userStats,
            events: eventStats,
            referrals: referralStats,
            jobs: jobStats,
        };

        apiSuccess(
            res,
            analytics,
            'Dashboard analytics retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch dashboard analytics',
        );
    }
};

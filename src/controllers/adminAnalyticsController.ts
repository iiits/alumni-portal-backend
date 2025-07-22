import { Request, Response } from 'express';
import { apiError, apiSuccess } from '../utils/apiResponses';
import {
    getEventAnalytics,
    getJobAnalytics,
    getLoginAnalytics,
    getReferralAnalytics,
    getUserAnalytics,
} from './helpers/adminAnalyticsHelper';
import { getDetailedUserAnalytics } from './helpers/detailedUserAnalyticsHelper';

// Get admin dashboard analytics
export const getDashboardAnalytics = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const [userStats, eventStats, referralStats, jobStats, loginStats] =
            await Promise.all([
                getUserAnalytics(),
                getEventAnalytics(),
                getReferralAnalytics(),
                getJobAnalytics(),
                getLoginAnalytics(),
            ]);

        const analytics = {
            users: userStats,
            events: eventStats,
            referrals: referralStats,
            jobs: jobStats,
            logins: loginStats,
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

// Get detailed user analytics
export const getDetailedAnalyticsUsers = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const detailedStats = await getDetailedUserAnalytics();

        apiSuccess(
            res,
            detailedStats,
            'Detailed user analytics retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch detailed user analytics',
        );
    }
};

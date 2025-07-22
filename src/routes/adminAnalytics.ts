import express from 'express';
import {
    getDashboardAnalytics,
    getDetailedAnalyticsAlumni,
    getDetailedAnalyticsContacts,
    getDetailedAnalyticsEvents,
    getDetailedAnalyticsJobs,
    getDetailedAnalyticsReferrals,
    getDetailedAnalyticsUsers,
} from '../controllers/adminAnalyticsController';
import { protect, requireVerified } from '../middleware/auth';
import { requireRole, UserRole } from '../middleware/rbac';

const router = express.Router();

// Get admin dashboard analytics
router.get(
    '/dashboard',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDashboardAnalytics,
);

// Get detailed user analytics
router.get(
    '/users-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsUsers,
);

// Get detailed alumni analytics
router.get(
    '/alumni-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsAlumni,
);

// Get detailed event analytics
router.get(
    '/events-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsEvents,
);

// Get detailed job analytics
router.get(
    '/jobs-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsJobs,
);

// Get detailed referral analytics
router.get(
    '/referrals-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsReferrals,
);

// Get detailed contact analytics
router.get(
    '/contacts-analytics',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getDetailedAnalyticsContacts,
);

export default router;

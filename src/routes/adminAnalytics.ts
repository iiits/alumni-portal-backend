import express from 'express';
import {
    getDashboardAnalytics,
    getDetailedAnalyticsAlumni,
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

export default router;

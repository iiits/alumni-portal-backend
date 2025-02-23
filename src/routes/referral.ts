import express from 'express';
import {
    createReferral,
    deleteReferral,
    getFilteredReferrals,
    getReferrals,
    getUserReferrals,
    updateReferral,
} from '../controllers/referralController';
import { protect, requireVerified } from '../middleware/auth';
import { UserRole, requireRole } from '../middleware/rbac';

const router = express.Router();

// Get all referrals (with filters)
router.get(
    '/filter',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getFilteredReferrals,
);

// Get all referrals
router.get(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getReferrals,
);

// Get user's referrals
router.get(
    '/user/:userId',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getUserReferrals,
);

// Create referral (Alumni/Admin only)
router.post(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    createReferral,
);

// Update referral (Original poster/Admin)
router.put(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    updateReferral,
);

// Delete referral (Original poster/Admin)
router.delete(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    deleteReferral,
);

export default router;

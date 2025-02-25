import express from 'express';
import {
    createReferral,
    deleteReferral,
    getFilteredReferrals,
    getReferrals,
    getUserReferrals,
    updateReferral,
} from '../controllers/referralController';
import {
    createSubmission,
    deleteSubmission,
    getReferralSubmissions,
    getUserSubmissions,
    updateSubmissionStatus,
} from '../controllers/referralSubmissionController';
import { protect, requireVerified } from '../middleware/auth';
import { UserRole, requireRole } from '../middleware/rbac';

const router = express.Router();

// :::: Referral Routes ::::

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
    requireRole(UserRole.ALUMNI),
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

// :::: Referral Submission Routes ::::

// Create submission (Students only)
router.post(
    '/submissions',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    createSubmission,
);

// Update submission status (Original poster/Admin)
router.put(
    '/submissions/:id/status',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    updateSubmissionStatus,
);

// Get user's submissions
router.get(
    '/submissions/user',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getUserSubmissions,
);

// Get all submissions for a referral (Original poster/Admin only)
router.get(
    '/submissions/:referralId',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    getReferralSubmissions,
);

// Delete submission (Admin only)
router.delete(
    '/submissions/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    deleteSubmission,
);

export default router;

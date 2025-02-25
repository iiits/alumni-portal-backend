import express from 'express';
import {
    createJobPosting,
    deleteJobPosting,
    getAllJobPostings,
    getFilteredJobPostings,
    getUserJobPostings,
    updateJobPosting,
} from '../controllers/jobController';
import { protect, requireVerified } from '../middleware/auth';
import { UserRole, requireRole } from '../middleware/rbac';

const router = express.Router();

// Get all jobs (with filters)
router.get(
    '/filter',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getFilteredJobPostings,
);

// Get all jobs (admin only)
router.get(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getAllJobPostings,
);

// Get user's job postings (Alumni/Admin only)
router.get(
    '/user/:userId',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    getUserJobPostings,
);

// Create job posting (Alumni/Admin only)
router.post(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    createJobPosting,
);

// Update job posting
router.put(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    updateJobPosting,
);

// Delete job posting
router.delete(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    deleteJobPosting,
);

export default router;

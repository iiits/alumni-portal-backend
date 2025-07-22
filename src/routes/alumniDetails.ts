import express from 'express';
import {
    createAlumniDetails,
    deleteAlumniDetails,
    getAlumniDetails,
    getAlumniDetailsById,
    updateAlumniDetails,
    verifyAlumniDetails,
} from '../controllers/alumniDetailsController';
import { protect, requireVerified } from '../middleware/auth';
import { requireRole, UserRole } from '../middleware/rbac';
const router = express.Router();

// Create a new alumni details entry
router.post(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    createAlumniDetails,
);

// Get all alumni details
router.get('/', protect, requireRole(UserRole.ADMIN), getAlumniDetails);

// Get a single alumni details entry by ID
router.get(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    getAlumniDetailsById,
);

// Update an alumni details entry by ID
router.put(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ALUMNI),
    updateAlumniDetails,
);

// Delete an alumni details entry by ID
router.delete(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    deleteAlumniDetails,
);

// Toggle alumni verification status
router.patch(
    '/:id/verify/:verified',
    protect,
    requireRole(UserRole.ADMIN),
    requireVerified,
    verifyAlumniDetails,
);

export default router;

import express from 'express';
import {
    adminUpdateUser,
    deleteUser,
    getMyProfile,
    getUserById,
    getUsers,
    updateUser,
} from '../controllers/userController';
import { protect, requireVerified } from '../middleware/auth';
import { UserRole, requireRole } from '../middleware/rbac';

const router = express.Router();

router.get(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getUsers,
);

router.get(
    '/me',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getMyProfile,
);

router.get(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getUserById,
);

router.put(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    updateUser,
);

// Admin route to update sensitive user information
router.patch(
    '/admin/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    adminUpdateUser,
);

router.delete(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    deleteUser,
);

export default router;

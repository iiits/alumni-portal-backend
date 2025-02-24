import express from 'express';
import {
    createEvent,
    deleteEvent,
    getEvents,
    getFilteredEvents,
    updateEvent,
} from '../controllers/eventController';
import { protect, requireVerified } from '../middleware/auth';
import { UserRole, requireRole } from '../middleware/rbac';

const router = express.Router();

router.get(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    getEvents,
);

router.get(
    '/filter',
    protect,
    requireVerified,
    requireRole(UserRole.STUDENT),
    getFilteredEvents,
);

router.post(
    '/',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    createEvent,
);

router.put(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    updateEvent,
);

router.delete(
    '/:id',
    protect,
    requireVerified,
    requireRole(UserRole.ADMIN),
    deleteEvent,
);

export default router;

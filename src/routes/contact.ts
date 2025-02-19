import express from 'express';
import {
    getAllContactForms,
    getContactFormForUser,
    submitContactForm,
} from '../controllers/contactController';
import { protect } from '../middleware/auth';
import { requireRole, UserRole } from '../middleware/rbac';

const router = express.Router();

// Submit a contact form
router.post('/', protect, requireRole(UserRole.STUDENT), submitContactForm);

// Get all contact form entries
router.get('/', protect, requireRole(UserRole.ADMIN), getAllContactForms);

// Get all contact form entries for a user
router.get(
    '/user',
    protect,
    requireRole(UserRole.STUDENT),
    getContactFormForUser,
);

export default router;

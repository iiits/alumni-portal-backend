import express from 'express';
import {
    getAllContactForms,
    getContactFormForUser,
    submitContactForm,
} from '../controllers/contactController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Submit a contact form
router.post('/', protect, submitContactForm);

// Get all contact form entries
router.get('/', protect, getAllContactForms);

// Get all contact form entries for a user
router.get('/user', protect, getContactFormForUser);

export default router;

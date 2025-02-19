import express from 'express';
import { submitContactForm } from '../controllers/contactController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/contactus', protect, submitContactForm);

export default router;

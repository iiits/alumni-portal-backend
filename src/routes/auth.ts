import express from 'express';
import {
    getMe,
    login,
    register,
    resendVerificationEmail,
    verifyEmail,
} from '../controllers/authController';
import { protect, requireVerified } from '../middleware/auth';
import { verificationLimiter } from '../middleware/verificationLimiter';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, requireVerified, getMe);
router.post(
    '/resend-verification',
    verificationLimiter,
    resendVerificationEmail,
);
router.post('/verify-email', verificationLimiter, verifyEmail);

export default router;

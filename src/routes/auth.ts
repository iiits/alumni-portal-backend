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

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

// Get the current user
router.get('/me', protect, requireVerified, getMe);

// Resend verification email
router.post(
    '/resend-verification',
    verificationLimiter,
    resendVerificationEmail,
);

// Verify email
router.post('/verify-email', verificationLimiter, verifyEmail);

export default router;

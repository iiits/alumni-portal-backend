import express from 'express';
import adminAnalyticsRoutes from './adminAnalytics';
import alumniDetailsRoutes from './alumniDetails';
import authRoutes from './auth';
import contactRoutes from './contact';
import eventRoutes from './event';
import jobRoutes from './job';
import referralRoutes from './referral';
import userRoutes from './user';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/alumni-details', alumniDetailsRoutes);
router.use('/admin', adminAnalyticsRoutes);

router.use('/contactus', contactRoutes);
router.use('/events', eventRoutes);

router.use('/referrals', referralRoutes);
router.use('/jobs', jobRoutes);

export default router;

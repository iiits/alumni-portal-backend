import express from 'express';
import alumniDetailsRoutes from './alumniDetails';
import authRoutes from './auth';
import contactRoutes from './contact';
import eventRoutes from './event';
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

router.use('/contactus', contactRoutes);
router.use('/events', eventRoutes);

export default router;

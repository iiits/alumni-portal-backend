import express from 'express';
import alumniDetailsRoutes from './alumniDetails';
import authRoutes from './auth';
import contactRoutes from './contact';
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/contactus', contactRoutes);
router.use('/alumni-details', alumniDetailsRoutes);

export default router;

import express from 'express';
import authRoutes from './auth';
import contactRoutes from './contact'
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/', contactRoutes)
export default router;

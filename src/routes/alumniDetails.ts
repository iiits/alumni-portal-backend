import express from 'express';
import { 
    createAlumniDetails,
    getAlumniDetails,
    updateAlumniDetails,
    deleteAlumniDetails,
    getAlumniDetailsById } 
from '../controllers/alumniDetailsController';
import { protect } from '../middleware/auth';
import { requireVerified } from '../middleware/alumniVeification';
const router = express.Router();

// Create a new alumni details entry
router.post('/',createAlumniDetails);

// Get all alumni details
router.get('/',getAlumniDetails);

// Get a single alumni details entry by ID
router.get('/:id', protect,getAlumniDetailsById);

// Update an alumni details entry by ID
router.put('/:id', protect,requireVerified,updateAlumniDetails);

// Delete an alumni details entry by ID
router.delete('/:id', protect,requireVerified,deleteAlumniDetails);

export default router;

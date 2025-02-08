import { Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';

// Create a new alumni details entry
export const createAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = new AlumniDetails(req.body);
        await alumniDetails.save();
        res.status(201).json(alumniDetails);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all alumni details
export const getAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniList = await AlumniDetails.find();
        res.status(200).json(alumniList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single alumni details entry by ID
export const getAlumniDetailsById = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findById(req.params.id);
        if (!alumniDetails) {
            return res.status(404).json({ message: 'Alumni details not found' });
        }
        res.status(200).json(alumniDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an alumni details entry by ID
export const updateAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!alumniDetails) {
            return res.status(404).json({ message: 'Alumni details not found' });
        }
        res.status(200).json(alumniDetails);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete an alumni details entry by ID
export const deleteAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndDelete(req.params.id);
        if (!alumniDetails) {
            return res.status(404).json({ message: 'Alumni details not found' });
        }
        res.status(200).json({ message: 'Alumni details deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

import { Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Create a new alumni details entry
export const createAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = new AlumniDetails(req.body);
        await alumniDetails.save();
        return apiSuccess(
            res,
            alumniDetails,
            'Alumni details created successfully',
            201,
        );
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create alumni details',
            400,
        );
    }
};

// Get all alumni details
export const getAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniList = await AlumniDetails.find();
        return apiSuccess(
            res,
            alumniList,
            'Alumni details retrieved successfully',
        );
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch alumni details',
        );
    }
};

// Get a single alumni details entry by ID
export const getAlumniDetailsById = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findById(req.params.id);
        if (!alumniDetails) {
            return apiNotFound(res, 'Alumni details not found');
        }
        return apiSuccess(
            res,
            alumniDetails,
            'Alumni details retrieved successfully',
        );
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch alumni details',
        );
    }
};

// Update an alumni details entry by ID
export const updateAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true },
        );
        if (!alumniDetails) {
            return apiNotFound(res, 'Alumni details not found');
        }
        return apiSuccess(
            res,
            alumniDetails,
            'Alumni details updated successfully',
        );
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update alumni details',
            400,
        );
    }
};

// Delete an alumni details entry by ID
export const deleteAlumniDetails = async (req: Request, res: Response) => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndDelete(
            req.params.id,
        );
        if (!alumniDetails) {
            return apiNotFound(res, 'Alumni details not found');
        }
        return apiSuccess(res, null, 'Alumni details deleted successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete alumni details',
        );
    }
};

import { Request, Response, NextFunction } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import User from '../models/User';
import { apiError, apiSuccess, apiNotFound } from '../utils/apiResponses';
import { sendAlumniVerificationEmail } from '../services/email/alumniDetailsService';

// Create a new alumni details entry
export const createAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { jobPosition, education, name, userId, ...rest } = req.body;

        // Ensure end is null if ongoing is true for both jobPosition and education
        const formattedJobPosition = jobPosition.map((job: any) => ({
            ...job,
            end: job.ongoing ? null : job.end,
        }));

        const formattedEducation = education.map((edu: any) => ({
            ...edu,
            end: edu.ongoing ? null : edu.end,
        }));

        // Retrieve user details using userId
        const user = await User.findOne({ userId }).lean();
        if (!user) {
            apiError(res, 'User not found', 404);
            return;
        }

        // Save alumni details in the database (excluding name and userId)
        const createdAlumni = await AlumniDetails.create({
            ...rest,
            jobPosition: formattedJobPosition,
            education: formattedEducation,
        });

        // Send verification email using name and userId
        const emailSent = await sendAlumniVerificationEmail(userId, name);
        if (!emailSent) {
            console.error("Failed to send verification email to admin.");
        }

        apiSuccess(res, createdAlumni, 'Alumni details created successfully and verification email sent', 201);
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to create alumni details',
            400
        );
    }
};



// Get all alumni details
export const getAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alumniList = await AlumniDetails.find().lean();
        apiSuccess(res, alumniList, 'Alumni details retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch alumni details'
        );
    }
};

// Get a single alumni details entry by ID
export const getAlumniDetailsById = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alumniDetails = await AlumniDetails.findById(req.params.id).lean();
        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, alumniDetails, 'Alumni details retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch alumni details'
        );
    }
};

// Update an alumni details entry by ID
export const updateAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { jobPosition, education, ...rest } = req.body;

        // Ensure end is null if ongoing is true for both jobPosition and education
        const formattedJobPosition = jobPosition?.map((job: any) => ({
            ...job,
            end: job.ongoing ? null : job.end,
        }));

        const formattedEducation = education?.map((edu: any) => ({
            ...edu,
            end: edu.ongoing ? null : edu.end,
        }));

        const updateData = {
            ...rest,
            ...(jobPosition && { jobPosition: formattedJobPosition }),
            ...(education && { education: formattedEducation }),
        };

        const alumniDetails = await AlumniDetails.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, alumniDetails, 'Alumni details updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update alumni details',
            400
        );
    }
};

// Delete an alumni details entry by ID
export const deleteAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndDelete(req.params.id);
        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, null, 'Alumni details deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete alumni details'
        );
    }
};

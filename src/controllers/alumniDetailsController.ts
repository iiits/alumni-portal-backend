import { NextFunction, Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import User from '../models/User';
import { sendAlumniVerificationEmail } from '../services/email/emailServices';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Create a new alumni details entry
export const createAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { jobPosition, education,...rest } = req.body;

        const formattedJobPosition = jobPosition.map((job: any) => ({
            ...job,
            end: job.ongoing ? null : job.end,
        }));

        const formattedEducation = education.map((edu: any) => ({
            ...edu,
            end: edu.ongoing ? null : edu.end,
        }));

        const user = await User.findOne({ id: userId }).lean();
        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }
        const { name } = user;

        const createdAlumni = await AlumniDetails.create({
            ...rest,
            jobPosition: formattedJobPosition,
            education: formattedEducation,
        });

        await User.updateOne({ id: userId }, { alumniDetails: createdAlumni.id, role: "alumni" });

        const emailSent = await sendAlumniVerificationEmail(userId, name);
        if (!emailSent) {
            console.error('Failed to send verification email to admin.');
        }

        apiSuccess(
            res,
            createdAlumni,
            'Alumni details created successfully and verification email sent. Waiting for admin approval.',
            201,
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create alumni details',
            400,
        );
    }
};

// Get all alumni details
export const getAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const alumniList = await AlumniDetails.find().lean();
        apiSuccess(res, alumniList, 'Alumni details retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch alumni details',
        );
    }
};

// Get a single alumni details entry by ID
export const getAlumniDetailsById = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const alumniDetails = await AlumniDetails.findById(
            req.params.id,
        ).lean();
        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, alumniDetails, 'Alumni details retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch alumni details',
        );
    }
};

// Update an alumni details entry by ID
export const updateAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const id = req.params.id;
        const { jobPosition, education, ...rest } = req.body;

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

        const alumniDetails = await AlumniDetails.findOneAndUpdate(
            {id},
            updateData,
            { new: true, runValidators: true },
        );

        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, alumniDetails, 'Alumni details updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update alumni details',
            400,
        );
    }
};

// Delete an alumni details entry by ID
export const deleteAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const alumniDetails = await AlumniDetails.findByIdAndDelete(
            req.params.id,
        );
        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, null, 'Alumni details deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete alumni details',
        );
    }
};

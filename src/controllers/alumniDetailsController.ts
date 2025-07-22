import { NextFunction, Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import User from '../models/User';
import { sendAlumniVerificationEmail } from '../services/email/emailServices';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

interface UserFilters {
    $or?: Array<{
        name?: { $regex: string; $options: string };
        collegeEmail?: { $regex: string; $options: string };
        personalEmail?: { $regex: string; $options: string };
    }>;
    batch?: { $in: number[] };
    department?: { $in: ('AIDS' | 'CSE' | 'ECE')[] };
    role: 'alumni';
    verified?: boolean;
}

// Create a new alumni details entry
export const createAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { jobPosition, education, ...rest } = req.body;

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

        await User.updateOne(
            { id: userId },
            { alumniDetails: createdAlumni.id, role: 'alumni' },
        );

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

// Get all users with filters and pagination
export const getAlumniDetails = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        let maxYear = new Date().getFullYear() + 5;

        // Validate and parse pagination params
        let page = Math.max(1, parseInt(req.query.page as string) || 1);
        let limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit as string) || 10),
        );
        const skip = (page - 1) * limit;

        // Parse filters from query parameters
        const filters: UserFilters = {
            role: 'alumni',
        };

        // Search functionality
        const search = req.query.search as string;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filters.$or = [
                { name: searchRegex },
                { collegeEmail: searchRegex },
                { personalEmail: searchRegex },
            ];
        }

        // Batch filter
        if (req.query.batch) {
            const batchNumbers = (req.query.batch as string)
                .split(',')
                .map(Number)
                .filter(num => !isNaN(num) && num >= 2014 && num <= maxYear);
            if (batchNumbers.length) {
                filters.batch = { $in: batchNumbers };
            }
        }

        // Department filter
        if (req.query.department) {
            const validDepartments = ['AIDS', 'CSE', 'ECE'];
            const departments = (req.query.department as string)
                .split(',')
                .filter(dept => validDepartments.includes(dept)) as (
                | 'AIDS'
                | 'CSE'
                | 'ECE'
            )[];
            if (departments.length) {
                filters.department = { $in: departments };
            }
        }

        const users = await User.find(filters)
            .select(
                'id name collegeEmail personalEmail userId username batch department profiles role',
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'alumniDetails',
                model: 'AlumniDetails',
                foreignField: 'id',
                select: '-_id -__v',
            })
            .lean();

        let filteredUsers = users;
        if (req.query.verified !== undefined) {
            const verifiedValue = req.query.verified === 'true';
            filteredUsers = users.filter(
                u =>
                    u.alumniDetails &&
                    typeof u.alumniDetails === 'object' &&
                    'verified' in u.alumniDetails &&
                    (u.alumniDetails as any).verified === verifiedValue,
            );
        }

        const total = filteredUsers.length;
        const totalPages = Math.ceil(total / limit);
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                users: filteredUsers,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    perPage: limit,
                },
            },
            'Users retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch users',
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
        if (req.user?.id !== req.params.id && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to update this profile');
            return;
        }

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
            { id },
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

// Toggle alumni verification status (true/false)
export const verifyAlumniDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        if (req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to update this profile');
            return;
        }

        const alumniDetails = await AlumniDetails.findOneAndUpdate(
            { id: req.params.id },
            { verified: req.params.verified === 'true' },
            { new: true, runValidators: true },
        );

        if (!alumniDetails) {
            apiNotFound(res, 'Alumni details not found');
            return;
        }
        apiSuccess(res, alumniDetails, 'Alumni details verified successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to verify alumni details',
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
        if (req.user?.id !== req.params.id && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to delete this profile');
            return;
        }

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

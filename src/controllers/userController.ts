import { Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import User from '../models/User';
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
    role?: { $in: ('admin' | 'alumni' | 'student')[] };
    verified?: boolean;
}

// Get all users with filters and pagination
export const getUsers = async (req: Request, res: Response): Promise<void> => {
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
        const filters: UserFilters = {};

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

        // Role filter
        if (req.query.role) {
            const validRoles = ['admin', 'alumni', 'student'];
            const roles = (req.query.role as string)
                .split(',')
                .filter(role => validRoles.includes(role)) as (
                | 'admin'
                | 'alumni'
                | 'student'
            )[];
            if (roles.length) {
                filters.role = { $in: roles };
            }
        }

        // Verified status filter
        if (req.query.verified !== undefined) {
            filters.verified = req.query.verified === 'true';
        }

        // Execute query
        const [users, total] = await Promise.all([
            User.find(filters)
                .select(
                    'id name collegeEmail personalEmail userId username batch department profiles role verified',
                )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filters),
        ]);

        const totalPages = Math.ceil(total / limit);

        // Adjust page number if it exceeds total pages
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                users,
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

// Get self user profile
export const getMyProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            apiUnauthorized(res, 'Not authorized to access this profile');
            return;
        }

        const user = await User.findOne({ id: userId })
            .select('-_id -password -verified -__v')
            .populate({
                path: 'alumniDetails',
                model: 'AlumniDetails',
                localField: 'alumniDetails',
                foreignField: 'id',
                select: '-_id -__v',
            });

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        apiSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch user',
        );
    }
};

// Get a single user by ID
export const getUserById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.params.id;

        if (!userId) {
            apiError(res, 'User ID is required');
            return;
        }

        const user = await User.findOne({ id: userId })
            .select('-id -_id -userId -password -role -verified -__v')
            .populate({
                path: 'alumniDetails',
                model: 'AlumniDetails',
                match: { verified: true },
                localField: 'alumniDetails',
                foreignField: 'id',
                select: '-_id -__v',
            });

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        apiSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch user',
        );
    }
};

// Update user profile
export const updateUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Only allow users to update their own profile unless admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to update this profile');
            return;
        }

        // Prevent updating sensitive fields
        const {
            password,
            verified,
            role,
            collegeEmail,
            userId,
            batch,
            department,
            alumniDetails,
            ...updateData
        } = req.body;

        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            {
                new: true,
                runValidators: true,
            },
        ).select('-password -verified -__v');

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        apiSuccess(res, user, 'User updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update user',
        );
    }
};

// Delete user
// Admin update user
export const adminUpdateUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const updates: Record<string, any> = {};

        // Validate and add batch
        if (req.body.batch !== undefined) {
            const batch = Number(req.body.batch);
            updates.batch = batch;
        }

        // Validate and add department
        if (req.body.department !== undefined) {
            if (!['AIDS', 'CSE', 'ECE'].includes(req.body.department)) {
                apiError(res, 'Invalid department. Must be AIDS, CSE, or ECE');
                return;
            }
            updates.department = req.body.department;
        }

        // Validate and add role
        if (req.body.role !== undefined) {
            if (!['admin', 'alumni', 'student'].includes(req.body.role)) {
                apiError(
                    res,
                    'Invalid role. Must be admin, alumni, or student',
                );
                return;
            }
            updates.role = req.body.role;
        }

        // Validate and add collegeEmail
        if (req.body.collegeEmail !== undefined) {
            const existingUser = await User.findOne({
                collegeEmail: req.body.collegeEmail,
                id: { $ne: req.params.id },
            });
            if (existingUser) {
                apiError(res, 'College email already exists');
                return;
            }
            updates.collegeEmail = req.body.collegeEmail;
        }

        // Validate and add userId
        if (req.body.userId !== undefined) {
            if (!/^[ASF]\d{4}00[123]\d{4}$/.test(req.body.userId)) {
                apiError(res, 'Invalid userId format');
                return;
            }
            const existingUser = await User.findOne({
                userId: req.body.userId,
                id: { $ne: req.params.id },
            });
            if (existingUser) {
                apiError(res, 'User ID already exists');
                return;
            }
            updates.userId = req.body.userId;
        }

        // Add verified status
        if (req.body.verified !== undefined) {
            updates.verified = Boolean(req.body.verified);
        }

        const user = await User.findOneAndUpdate(
            { id: req.params.id },
            updates,
            {
                new: true,
                runValidators: true,
            },
        ).select(
            'id name collegeEmail personalEmail userId username batch department profiles role verified',
        );

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        apiSuccess(res, user, 'User updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update user',
        );
    }
};

export const deleteUser = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        // Only allow users to delete their own profile unless admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to delete this profile');
            return;
        }

        const alumniId = await User.findOne({ id: req.params.id }).transform(
            user => user?.alumniDetails,
        );

        const user = await User.findOneAndDelete({ id: req.params.id });

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        if (alumniId) {
            await AlumniDetails.findOneAndDelete({
                id: alumniId,
            });
        }

        apiSuccess(res, null, 'User deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete user',
        );
    }
};

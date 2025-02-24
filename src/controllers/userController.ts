import { Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import User from '../models/User';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

// Get all users (with filtered fields)
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.find()
            .select('-password -verified -__v')
            .sort({ createdAt: -1 });

        apiSuccess(res, users, 'Users retrieved successfully');
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
        const { password, verified, role, ...updateData } = req.body;

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

import { Request, Response } from 'express';
import User from '../models/User';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Create a new user
export const createUser = async (req: Request, res: Response) => {
    try {
        const user = new User(req.body);
        await user.save();
        return apiSuccess(res, user, 'User created successfully', 201);
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to create user',
            400,
        );
    }
};

// Get all users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        return apiSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch users',
        );
    }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return apiNotFound(res, 'User not found');
        }
        return apiSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch user',
        );
    }
};

// Update a user by ID
export const updateUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            return apiNotFound(res, 'User not found');
        }
        return apiSuccess(res, user, 'User updated successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update user',
            400,
        );
    }
};

// Delete a user by ID
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return apiNotFound(res, 'User not found');
        }
        return apiSuccess(res, null, 'User deleted successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete user',
        );
    }
};

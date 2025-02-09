import { apiError, apiSuccess, apiUnauthorized } from '@/utils/apiResponses';
import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import { sendTokenResponse } from './helpers/authHelper';

// Register user
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await User.create(req.body);
        await sendTokenResponse(user, 201, res);
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Registration failed',
            400,
        );
    }
};

// Login user
export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const { collegeEmail, password } = req.body;

    if (!collegeEmail || !password) {
        apiError(res, 'Please provide email and password', 400);
        return;
    }

    try {
        const user = await User.findOne({ collegeEmail }).select('+password');

        if (!user) {
            apiUnauthorized(res, 'Invalid credentials');
            return;
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            apiUnauthorized(res, 'Invalid credentials');
            return;
        }

        await sendTokenResponse(user, 200, res);
    } catch (error) {
        apiError(res, error instanceof Error ? error.message : 'Login failed');
    }
};

// Get current logged in user
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user.id });
        apiSuccess(res, user, 'User profile retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch user profile',
        );
    }
};

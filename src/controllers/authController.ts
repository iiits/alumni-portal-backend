import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import User from '../models/User';
import VerificationToken from '../models/VerificationToken';
import { sendVerificationEmail } from '../services/email/emailServices';
import { apiError, apiSuccess, apiUnauthorized } from '../utils/apiResponses';
import { sendTokenResponse } from './helpers/authHelper';

// Register user
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await User.create({
            ...req.body,
            verified: false,
        });

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            owner: user.id,
            token: verificationToken,
        });

        // Send verification email
        await sendVerificationEmail(user.collegeEmail, verificationToken);

        apiSuccess(
            res,
            { email: user.collegeEmail },
            'Registration successful. Please verify your email.',
            201,
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Registration failed',
            400,
        );
    }
};

// Add this new controller function
export const resendVerificationEmail = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ collegeEmail: email });

        if (!user) {
            apiError(res, 'User not found', 404);
            return;
        }

        if (user.verified) {
            apiError(res, 'Email already verified', 400);
            return;
        }

        const existingToken = await VerificationToken.findOne({
            owner: user.id,
        });
        if (existingToken) {
            apiError(
                res,
                'Please wait 1 hour before requesting another verification email',
                429,
            );
            return;
        }

        // Delete any existing verification tokens
        await VerificationToken.deleteMany({ owner: user.id });

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await VerificationToken.create({
            owner: user.id,
            token: verificationToken,
        });

        // Send new verification email
        await sendVerificationEmail(user.collegeEmail, verificationToken);

        apiSuccess(res, null, 'Verification email resent successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to resend verification email',
            400,
        );
    }
};

// Email verification
export const verifyEmail = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { token } = req.body;

        const verificationToken = await VerificationToken.findOne({ token });
        if (!verificationToken) {
            apiError(res, 'Invalid or expired verification token', 400);
            return;
        }

        // Check if max failed attempts reached
        if (verificationToken.failedAttempts >= 5) {
            await verificationToken.deleteOne();
            apiError(
                res,
                'Maximum verification attempts exceeded. Please request a new verification email.',
                400,
            );
            return;
        }

        const user = await User.findOne({ id: verificationToken.owner });
        if (!user) {
            apiError(res, 'User not found', 404);
            return;
        }

        if (user.verified) {
            await verificationToken.deleteOne();
            apiError(res, 'Email is already verified', 400);
            return;
        }

        // Update user verification status
        await User.findOneAndUpdate(
            { id: verificationToken.owner },
            { verified: true },
        );

        // Delete used token
        await verificationToken.deleteOne();

        apiSuccess(res, null, 'Email verified successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Verification failed',
            400,
        );
    }
};

// Login user
// Login user and return relevant details along with token
export const login = async (req: Request, res: Response): Promise<void> => {
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

        // Generate JWT token
        const token = user.getSignedJwtToken();

        // Structure user details for frontend
        const userDetails = {
            id: user.id,
            name: user.name,
            collegeEmail: user.collegeEmail,
            personalEmail: user.personalEmail, // Now required in model
            userId: user.userId,
            username: user.username,
            profilePicture: user.profilePicture || null, // Optional
            batch: user.batch,
            department: user.department,
            profiles: user.profiles, // Social media links
            bio: user.bio || null, // Optional
            role: user.role, // Student, Alumni, Admin
            alumniDetails: user.alumniDetails || null, // If applicable
        };

        // Return response with token & user details
        apiSuccess(res, { token, user: userDetails }, 'Login successful', 200);
    } catch (error) {
        apiError(res, error instanceof Error ? error.message : 'Login failed');
    }
};

// Get current logged-in user with relevant details
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user.id }).select(
            '-password -verified -__v',
        ); // Exclude sensitive fields

        if (!user) {
            apiError(res, 'User not found', 404);
            return;
        }

        // Structure the response to include only relevant details
        const userDetails = {
            id: user.id,
            name: user.name,
            collegeEmail: user.collegeEmail,
            personalEmail: user.personalEmail, 
            userId: user.userId,
            username: user.username,
            profilePicture: user.profilePicture || null, // Optional
            batch: user.batch,
            department: user.department,
            profiles: user.profiles, // Social media links
            bio: user.bio || null, // Optional
            role: user.role, // Student, Alumni, Admin
            alumniDetails: user.alumniDetails || null, // Only if applicable
        };

        apiSuccess(res, userDetails, 'User profile retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch user profile',
        );
    }
};

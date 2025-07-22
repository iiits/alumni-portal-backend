import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import LoginEvent from '../models/LoginEvent';
import PasswordResetToken from '../models/PasswordResetToken';
import User from '../models/User';
import VerificationToken from '../models/VerificationToken';
import {
    sendPasswordResetEmail,
    sendVerificationEmail,
} from '../services/email/emailServices';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';
import {
    collegeEmailPattern,
    personalEmailPattern,
    userIdPattern,
    validateRegistration,
} from './helpers/authHelper';

// Register user
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        validateRegistration(req.body);

        const existingUser = await User.findOne({
            $or: [
                { collegeEmail: req.body.collegeEmail },
                { personalEmail: req.body.personalEmail },
                { userId: req.body.userId },
            ],
        });

        if (existingUser) {
            if (existingUser.collegeEmail === req.body.collegeEmail) {
                apiError(res, 'College email already registered', 400);
                return;
            }
            if (existingUser.personalEmail === req.body.personalEmail) {
                apiError(res, 'Personal email already registered', 400);
                return;
            }
            if (existingUser.userId === req.body.userId) {
                apiError(res, 'User ID already registered', 400);
                return;
            }
        }

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

// Resend verification email
export const resendVerificationEmail = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ collegeEmail: email });

        if (!user) {
            apiNotFound(res, 'User not found');
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
            apiNotFound(res, 'User not found');
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

// Login user with multiple identifier options
export const login = async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body; // "identifier" can be email (college/personal) or user ID

    if (!identifier || !password) {
        apiError(res, 'Please provide an email or user ID and password', 400);
        return;
    }

    try {
        let query = {};

        if (collegeEmailPattern.test(identifier)) {
            query = { collegeEmail: identifier };
        } else if (personalEmailPattern.test(identifier)) {
            query = { personalEmail: identifier };
        } else if (userIdPattern.test(identifier)) {
            query = { userId: identifier };
        } else {
            apiError(res, 'Invalid email or user ID format', 400);
            return;
        }

        // Find user based on detected field
        const user = await User.findOne(query).select('+password +verified');

        if (!user) {
            apiUnauthorized(res, 'Invalid credentials');
            return;
        }

        if (!user.verified) {
            apiUnauthorized(res, 'Email not verified');
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            apiUnauthorized(res, 'Invalid credentials');
            return;
        }

        // Log login event
        await LoginEvent.create({
            userId: user.id,
            userRole: user.role,
            timestamp: new Date(),
        });

        // Generate JWT token
        const token = user.getSignedJwtToken();

        // Structure user details for frontend
        const userDetails = {
            id: user.id,
            name: user.name,
            collegeEmail: user.collegeEmail,
            personalEmail: user.personalEmail,
            userId: user.userId,
            username: user.username,
            profilePicture: user.profilePicture || null,
            batch: user.batch,
            department: user.department,
            profiles: user.profiles,
            bio: user.bio || null,
            role: user.role,
            alumniDetails: user.alumniDetails || null,
        };

        // Return response with token & user details
        apiSuccess(res, { token, user: userDetails }, 'Login successful', 200);
    } catch (error) {
        apiError(res, error instanceof Error ? error.message : 'Login failed');
    }
};

// Generate and send password reset link
export const requestPasswordReset = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            apiError(res, 'UserId not provided', 400);
            return;
        }

        const user = await User.findOne({
            id: userId,
        });

        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        // Generate & Save password reset token
        const token = crypto.randomBytes(32).toString('hex');

        await PasswordResetToken.create({
            owner: user.id,
            token: token,
        });

        // Send password reset email
        await sendPasswordResetEmail(
            [user.collegeEmail, user.personalEmail].filter(
                (email): email is string => email !== undefined,
            ),
            token,
        );

        apiSuccess(res, null, 'Password reset link sent to email');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Password reset request failed',
        );
    }
};

export const resetPassword = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        const resetToken = await PasswordResetToken.findOne({ token });
        if (!resetToken) {
            apiError(res, 'Invalid or expired reset token', 400);
            return;
        }

        const user = await User.find({ id: resetToken.owner });
        if (!user) {
            apiNotFound(res, 'User not found');
            return;
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findOneAndUpdate(
            { id: resetToken.owner },
            { password: hashedPassword },
        );

        // Delete used token
        await resetToken.deleteOne();

        apiSuccess(res, null, 'Password reset successful');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Password reset failed',
        );
    }
};

// Get current logged-in user with relevant details
export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user?.id }).select(
            '-password -verified -__v',
        ); // Exclude sensitive fields

        if (!user) {
            apiNotFound(res, 'User not found');
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

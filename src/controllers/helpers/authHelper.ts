import { Response } from 'express';

// Regex patterns to determine the type of input
export const collegeEmailPattern =
    /^([a-z]+\.[a-z]+\d{2}@iiits\.in$)|([a-z]+\.[a-z]+@iiits\.in$)/; // First one is for students, second one is for faculty
export const userIdPattern = /^[ASF]\d{4}00[123]\d{4}$/; // A : Alumni | S : Student | F : Faculty ::: Batch/Joining Year ::: Roll Number/Employee ID
export const personalEmailPattern =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Helper function to get token from model, create cookie and send response
export const sendTokenResponse = (
    user: any,
    statusCode: number,
    res: Response,
) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token });
};

export const validateRegistration = (userData: any) => {
    // Check required fields
    const requiredFields = [
        'name',
        'collegeEmail',
        'personalEmail',
        'userId',
        'username',
        'password',
        'batch',
        'department',
    ];
    for (const field of requiredFields) {
        if (!userData[field]) {
            throw new Error(`${field} is required`);
        }
    }

    // Validate college email format
    if (!collegeEmailPattern.test(userData.collegeEmail)) {
        throw new Error('Invalid college email format');
    }

    // Validate personal email
    if (!personalEmailPattern.test(userData.personalEmail)) {
        throw new Error('Invalid personal email format');
    }

    // Validate userId format
    if (!userIdPattern.test(userData.userId)) {
        throw new Error('Invalid user ID format');
    }

    // Validate department
    if (!['AIDS', 'CSE', 'ECE'].includes(userData.department)) {
        throw new Error('Invalid department');
    }

    // Validate batch (assuming reasonable range)
    if (userData.batch < 2013 || userData.batch > new Date().getFullYear()) {
        throw new Error('Invalid batch year');
    }
};

import { Response } from 'express';

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

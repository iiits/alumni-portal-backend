import { NextFunction, Request, Response } from 'express';
import ContactUs from '../models/ContactUs';
import User from '../models/User';
import { sendContactUsEmail } from '../services/email/emailServices';
import { apiError, apiSuccess } from '../utils/apiResponses';

export const submitContactForm = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const { subject, message } = req.body;
    const userId = req.user?.id;

    if (!subject || !message) {
        apiError(res, 'Subject and message are required', 400);
        return;
    }

    try {
        // Get user details
        const user = await User.findOne({ id: userId });
        if (!user) {
            apiError(res, 'User not found', 404);
            return;
        }

        // Create contact entry
        const contact = await ContactUs.create({
            user: userId,
            name: user.name,
            email: user.collegeEmail,
            subject,
            message,
        });

        // Send email
        const success = await sendContactUsEmail(
            user.collegeEmail,
            user.name,
            subject,
            message,
        );

        if (success) {
            apiSuccess(
                res,
                { contact },
                'Your message has been successfully sent. We will get back to you shortly.',
                200,
            );
        } else {
            console.error('Failed to send email to:', process.env.EMAIL_USER);
            apiError(
                res,
                'Failed to send your message, please try again later.',
                500,
            );
        }
    } catch (error) {
        console.error('Error handling contact form submission:', error);

        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }

        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to send contact form message',
            500,
        );
    }
};

export const getAllContactForms = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const contactForms = await ContactUs.find().sort({ createdAt: -1 });
        apiSuccess(
            res,
            { contactForms },
            'Contact forms retrieved successfully',
            200,
        );
    } catch (error) {
        console.error('Error getting contact forms:', error);
        apiError(res, 'Failed to get contact forms', 500);
    }
};

export const getContactFormForUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const { userId } = req.body;

    if (!userId) {
        apiError(res, 'User ID is required', 400);
        return;
    }

    try {
        const contactForms = await ContactUs.find({ user: userId }).sort({
            createdAt: -1,
        });
        apiSuccess(
            res,
            { contactForms },
            'Contact forms retrieved successfully',
            200,
        );
    } catch (error) {
        console.error('Error getting contact forms:', error);
        apiError(res, 'Failed to get contact forms', 500);
    }
};

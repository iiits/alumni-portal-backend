import { NextFunction, Request, Response } from 'express';
import ContactUs from '../models/ContactUs';
import User from '../models/User';
import {
    sendContactResponseEmail,
    sendContactUsEmail,
} from '../services/email/emailServices';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

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
            apiNotFound(res, 'User not found');
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
        let page = Math.max(1, parseInt(req.query.page as string) || 1);
        let limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit as string) || 10),
        );
        const skip = (page - 1) * limit;

        const filters: any = {};
        const now = new Date();

        const startDateStr = req.query.startDate as string;
        const endDateStr = req.query.endDate as string;
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        if (startDateStr) {
            startDate = new Date(startDateStr);
        }
        if (endDateStr) {
            endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);
        }
        if (startDate && endDate) {
            filters.createdAt = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            filters.createdAt = { $gte: startDate };
        } else if (endDate) {
            filters.createdAt = { $lte: endDate };
        }

        if (typeof req.query.resolved !== 'undefined') {
            filters.resolved = req.query.resolved === 'true';
        }

        const search = req.query.search as string;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filters.$or = [{ name: searchRegex }, { email: searchRegex }];
        }

        const [contactForms, total] = await Promise.all([
            ContactUs.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-__v')
                .lean(),
            ContactUs.countDocuments(filters),
        ]);

        const totalPages = Math.ceil(total / limit);
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                contactForms,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    perPage: limit,
                },
            },
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

export const respondToContactQuery = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const { id, subject, message } = req.body;
    if (!id || !subject || !message) {
        apiError(res, 'id, subject, and message are required', 400);
        return;
    }
    try {
        const contactQuery = await ContactUs.findOne({ id });
        if (!contactQuery) {
            apiNotFound(res, 'Contact query not found');
            return;
        }

        if (contactQuery.resolved) {
            apiError(res, 'Query already resolved', 400);
            return;
        }

        const success = await sendContactResponseEmail(
            contactQuery.email,
            contactQuery.name,
            contactQuery.subject,
            contactQuery.message,
            message,
            contactQuery.createdAt.toISOString(),
        );

        if (!success) {
            apiError(res, 'Failed to send response email', 500);
            return;
        }

        contactQuery.resolved = true;
        await contactQuery.save();
        apiSuccess(
            res,
            null,
            'Response sent and query marked as resolved',
            200,
        );
    } catch (error) {
        console.error('Error responding to contact query:', error);
        apiError(res, 'Failed to respond to contact query', 500);
    }
};

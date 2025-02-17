import { Request, Response, NextFunction } from 'express';
import { sendContactUsEmail } from '../services/email/contactusServices';  // Importing the service function
import { apiError, apiSuccess } from '../utils/apiResponses';  // For consistent response formatting

// Handle contact form submission
export const submitContactForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, name, subject, message } = req.body;  // Destructure the form fields from the request body

    // Validate input fields (ensure all required fields are present)
    if (!email || !name || !subject || !message) {
        apiError(res, 'All fields (email, name, subject, message) are required', 400);  // Return error if any field is missing
        return;
    }

    try {
        // Call the service to send the contact email
        const success = await sendContactUsEmail(email, name, subject, message);

        // If the email was sent successfully
        if (success) {
            apiSuccess(res, null, 'Your message has been successfully sent. We will get back to you shortly.', 200);
        } else {
            console.error("Failed to send email to:", process.env.EMAIL_USER);
            apiError(res, 'Failed to send your message, please try again later.', 500);
        }
    } catch (error) {
        console.error('Error handling contact form submission:', error);
        
        // Detailed error logging to understand what went wrong
        if (error instanceof Error) {
            console.error('Error details:', error.message);
        }

        apiError(res, error instanceof Error ? error.message : 'Failed to send contact form message', 500);  // Handle errors during email sending
    }
};

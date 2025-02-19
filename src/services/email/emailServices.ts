import { transporter } from '../../config/email';
import { renderAlumniVerificationEmail } from './templates/alumniDetailsVerification';
import { renderContactFormEmail } from './templates/contactUs';
import { renderVerificationEmail } from './templates/verification';

const adminEmails = process.env.EMAIL_ADMINS?.split(',') || [];

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

export const sendVerificationEmail = async (email: string, token: string) => {
    const verificationUrl = `${process.env.CLIENT_URL}/verifyemail?token=${token}`;
    return sendEmail({
        to: email,
        subject: 'Email Verification',
        html: renderVerificationEmail(verificationUrl),
    });
};

export const sendContactUsEmail = async (
    email: string,
    name: string,
    subject: string,
    message: string,
) => {
    return sendEmail({
        to: adminEmails.join(','),
        subject: `Contact Form Submission: ${subject}`,
        html: renderContactFormEmail(name, email, subject, message),
    });
};

export const sendAlumniVerificationEmail = async (
    userId: string,
    name: string,
) => {
    const verificationUrl = `${process.env.ADMIN_URL}/`;
    const emailHtml = renderAlumniVerificationEmail(verificationUrl, {
        name,
        userId,
    });

    return sendEmail({
        to: adminEmails.join(','),
        subject: `Alumni Verification - ${name}`,
        html: emailHtml,
    });
};

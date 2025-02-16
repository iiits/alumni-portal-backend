import { transporter } from '../../config/email';
import { renderVerificationEmail } from './templates/verification';

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

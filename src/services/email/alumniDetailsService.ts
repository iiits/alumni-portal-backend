import { transporter } from '../../config/email';
import { renderVerificationEmail } from './templates/alumniDetailsVerification';

interface SendEmailParams {
    subject: string;
    html: string;
}

export const sendEmail = async ({ subject, html }: SendEmailParams) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

export const sendAlumniVerificationEmail = async (
    userId: string,
    name: string
) => {
    const verificationUrl = `${process.env.ADMIN_URL}/`;
    const emailHtml = renderVerificationEmail(verificationUrl, { name, userId });
    
    return sendEmail({
        subject: `Alumni Verification - ${name}`,
        html: emailHtml,
    });
};

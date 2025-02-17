import { transporter } from '../../config/email';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from: string; // 'from' will be dynamic and passed from the controller
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
    try {
        console.log("Sending email from:", from, "to:", to);
        await transporter.sendMail({
            from, // Use the 'from' email provided by the frontend
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

// Send email for contact form submission
export const sendContactUsEmail = async (email: string, name: string, subject: string, message: string) => {
    const contactEmailContent = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
    `;

    console.log("Preparing to send contact form email to:", process.env.EMAIL_USER);
    
    // Send the contact form submission email to the designated email (e.g., support email)
    const success = await sendEmail({
        to: process.env.EMAIL_USER!, // Recipient's email (from .env)
        subject: `Contact Form Submission: ${subject}`,
        html: contactEmailContent,
        from: email, // Use the user's email as the sender's email
    });

    return success;
};

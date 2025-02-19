export const renderContactFormEmail = (
    name: string,
    email: string,
    subject: string,
    message: string,
): string => {
    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>New Contact Form Submission</h2>
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                ${message}
            </div>
        </div>
    </div>
    `;
};

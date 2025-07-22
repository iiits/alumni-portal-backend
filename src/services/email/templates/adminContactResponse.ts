export const renderAdminContactResponseEmail = (
    userName: string,
    userEmail: string,
    originalSubject: string,
    originalMessage: string,
    adminMessage: string,
    date: string,
): string => {
    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Response to Your Contact Form Query</h2>
        <p>Dear ${userName},</p>
        <p>Thank you for reaching out. Below is your original query sent on ${date} and our response:</p>
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="margin-bottom: 10px;">Your Query</h3>
            <p><strong>Subject:</strong> ${originalSubject}</p>
            <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px; border: 1px solid #ddd;">
                ${originalMessage}
            </div>
        </div>
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #cce5ff; border-radius: 5px; background-color: #eaf4ff;">
            <h3 style="margin-bottom: 10px;">Admin Response</h3>
            <div style="padding: 10px; background-color: #f1f8ff; border-radius: 5px;">
                ${adminMessage}
            </div>
        </div>
        <div style="margin-top: 30px; padding: 15px; border-top: 1px solid #eee;">
            <h4>Further Contact Information</h4>
            <p>If you have any more questions, feel free to reply to this email or contact us at:</p>
            <div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                'Email: alumni.admin@iiits.in | Phone: +91-1234567890'}
            </div>
           <p>For any future communications regarding this query, we will use your email address: <strong>${userEmail}</strong>.</p>
        </div>
        <p style="margin-top: 20px; color: #888; font-size: 12px;">This is an automated response. Please do not share sensitive information via email.</p>
    </div>
    `;
};

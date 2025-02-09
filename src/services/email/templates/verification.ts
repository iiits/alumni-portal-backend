export const renderVerificationEmail = (verificationUrl: string): string => {
    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Verify your email address</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 1 hour.</p>
    </div>
    `;
};

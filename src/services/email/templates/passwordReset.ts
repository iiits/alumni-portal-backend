export const renderPasswordResetEmail = (resetUrl: string): string => {
    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>
    `;
};

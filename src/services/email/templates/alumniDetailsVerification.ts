interface AlumniDetails {
    name: string;
    userId: string;
}

export const renderVerificationEmail = (verificationUrl: string, alumniDetails: AlumniDetails): string => {
    const { name, userId } = alumniDetails;

    return `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Verify the Student as an Alumni</h2>
        <p>Please review the following details before verifying the student:</p>
        
        <h3>Personal Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>User ID:</strong> ${userId}</p>
        
        <p>Please click the button below to verify the student as an alumni:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Alumni
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
    </div>
    `;
};

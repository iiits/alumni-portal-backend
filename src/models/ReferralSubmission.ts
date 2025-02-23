import mongoose, { Document } from 'mongoose';

export interface IReferralSubmission extends Document {
    id: string;
    referralId: string;
    userId: string;
    resumeLink: string;
    coverLetter?: string;
    whyReferMe: string;
    status: 'pending' | 'accepted' | 'rejected';
    submittedAt: Date;
    expiresAt: Date;
}

const ReferralSubmissionSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        referralId: {
            type: String,
            ref: 'JobReferral',
            required: true,
            index: true,
        },
        userId: {
            type: String,
            ref: 'User',
            required: true,
            index: true,
        },
        resumeLink: {
            type: String,
            required: [true, 'Resume link is required'],
            validate: {
                validator: (value: string) => /^https?:\/\/\S+$/.test(value),
                message: 'Please provide a valid URL',
            },
        },
        coverLetter: {
            type: String,
            maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
        },
        whyReferMe: {
            type: String,
            required: [true, 'Please explain why you should be referred'],
            maxlength: [1000, 'Explanation cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 }, // Create a TTL index
        },
    },
    {
        timestamps: true,
    },
);

// Pre-save middleware to set expiration date
ReferralSubmissionSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const referral = await mongoose
                .model('JobReferral')
                .findOne({ id: this.referralId });
            if (referral) {
                // Set expiration date to 30 days after the referral's lastApplyDate
                const DAYS_TO_KEEP_AFTER_DEADLINE = 30;
                const expirationDate = new Date(referral.lastApplyDate);
                expirationDate.setDate(
                    expirationDate.getDate() + DAYS_TO_KEEP_AFTER_DEADLINE,
                );
                this.expiresAt = expirationDate;
            }
        } catch (error: any) {
            next(error as Error);
        }
    }
    next();
});

export default mongoose.model<IReferralSubmission>(
    'JobReferralSubmission',
    ReferralSubmissionSchema,
);

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
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IReferralSubmission>(
    'JobReferralSubmission',
    ReferralSubmissionSchema,
);

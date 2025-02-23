import mongoose, { Document } from 'mongoose';

export interface IJobReferral extends Document {
    id: string;
    isActive: boolean;
    numberOfReferrals: number;
    jobDetails: {
        title: string;
        description: string;
        company: string;
        role: string;
        link: string;
    };
    postedBy: string;
    postedOn: Date;
    lastApplyDate: Date;
}

const JobReferralSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        numberOfReferrals: {
            type: Number,
            required: true,
            min: [0, 'Number of referrals cannot be negative'],
            default: 0,
        },
        jobDetails: {
            title: {
                type: String,
                required: [true, 'Job title is required'],
                trim: true,
                maxlength: [100, 'Title cannot exceed 100 characters'],
            },
            description: {
                type: String,
                required: [true, 'Job description is required'],
                maxlength: [2000, 'Description cannot exceed 2000 characters'],
            },
            company: {
                type: String,
                required: [true, 'Company name is required'],
                trim: true,
            },
            role: {
                type: String,
                required: [true, 'Job role is required'],
                trim: true,
            },
            link: {
                type: String,
                required: [true, 'Application link is required'],
                validate: {
                    validator: (value: string) =>
                        /^https?:\/\/\S+$/.test(value),
                    message: 'Please provide a valid URL',
                },
            },
        },
        postedBy: {
            type: String,
            ref: 'User',
            required: true,
        },
        postedOn: {
            type: Date,
            default: Date.now,
        },
        lastApplyDate: {
            type: Date,
            required: [true, 'Last apply date is required'],
            validate: {
                validator: function (this: IJobReferral, value: Date) {
                    return value > this.postedOn;
                },
                message: 'Last apply date must be after posted date',
            },
        },
    },
    {
        timestamps: true,
    },
);

JobReferralSchema.index({ lastApplyDate: 1 });

export default mongoose.model<IJobReferral>('JobReferral', JobReferralSchema);

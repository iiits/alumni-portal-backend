import mongoose, { Document } from 'mongoose';

export interface IJobPosting extends Document {
    id: string;
    jobName: string;
    company: string;
    role: string;
    eligibility: {
        batch: string[];
        requirements: string[];
    };
    description: string;
    type: 'fulltime' | 'parttime' | 'internship' | 'others';
    stipend: string;
    duration: string;
    workType: 'onsite' | 'remote' | 'hybrid';
    links: string[];
    postedBy: string;
    postedOn: Date;
    lastApplyDate: Date;
}

const JobPostingSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        jobName: {
            type: String,
            required: [true, 'Job name is required'],
            trim: true,
            maxlength: [100, 'Job name cannot exceed 100 characters'],
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
        eligibility: {
            batch: [
                {
                    type: String,
                    required: [true, 'Atleast one batch is required'],
                    trim: true,
                },
            ],
            requirements: [
                {
                    type: String,
                    trim: true,
                },
            ],
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        type: {
            type: String,
            required: [true, 'Job type is required'],
            enum: ['fulltime', 'parttime', 'internship', 'others'],
        },
        stipend: {
            type: String,
            required: [true, 'Stipend/Salary information is required'],
            trim: true,
        },
        duration: {
            type: String,
            required: true,
            trim: true,
        },
        workType: {
            type: String,
            required: [true, 'Work type is required'],
            enum: ['onsite', 'remote', 'hybrid'],
        },
        links: [
            {
                type: String,
                validate: {
                    validator: (value: string) =>
                        /^https?:\/\/\S+$/.test(value),
                    message: 'Please provide valid URLs',
                },
            },
        ],
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
                validator: function (this: IJobPosting, value: Date) {
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

JobPostingSchema.index({ lastApplyDate: 1 });

export default mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);

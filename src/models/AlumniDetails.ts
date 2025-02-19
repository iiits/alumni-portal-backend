import mongoose, { Document } from 'mongoose';

export interface IAlumniDetails extends Document {
    id: string;
    jobPosition: {
        title: string;
        type: 'full-time' | 'part-time' | 'freelancer' | 'intern' | 'entrepreneur';
        start: Date;
        end?: Date | null;
        ongoing: boolean;
        location: string;
        jobType: 'on-site' | 'remote' | 'hybrid';
        description?: string;
    }[];
    education: {
        school: string;
        degree: string;
        fieldOfStudy: string;
        start: Date;
        end?: Date | null;
        ongoing: boolean;
        location: string;
        description?: string;
    }[];
    location: {
        city: string;
        country: string;
    };
    expertise: string[];
    verified: boolean;
}

const AlumniDetailsSchema = new mongoose.Schema<IAlumniDetails>({
    id: { type: String, default: () => crypto.randomUUID(), unique: true },
    jobPosition: [
        {
            title: { type: String, required: true },
            type: {
                type: String,
                enum: ['full-time', 'part-time', 'freelancer', 'intern', 'entrepreneur'],
                required: true,
            },
            start: { type: Date, required: true },
            end: { type: Date, default: null },
            ongoing: { type: Boolean, required: true, default: false },
            location: { type: String, required: true },
            jobType: {
                type: String,
                enum: ['on-site', 'remote', 'hybrid'],
                required: true,
            },
            description: { type: String },
        },
    ],
    education: [
        {
            school: { type: String, required: true },
            degree: { type: String, required: true },
            fieldOfStudy: { type: String, required: true },
            start: { type: Date, required: true },
            end: { type: Date, default: null },
            ongoing: { type: Boolean, required: true, default: false },
            location: { type: String, required: true },
            description: { type: String },
        },
    ],
    location: {
        city: { type: String, required: true },
        country: { type: String, required: true },
    },
    expertise: { type: [String], default: [] },
    verified: { type: Boolean, default: false },
});

export default mongoose.model<IAlumniDetails>('AlumniDetails', AlumniDetailsSchema);

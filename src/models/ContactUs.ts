import mongoose, { Document } from 'mongoose';

export interface IContact extends Document {
    user?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date;
}

const ContactSchema = new mongoose.Schema<IContact>({
    user: {
        type: String,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IContact>('Contact', ContactSchema);

import crypto from 'crypto';
import mongoose, { Document } from 'mongoose';

export interface IContact extends Document {
    user?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    resolved: boolean;
    resolutionMessage?: string;
    createdAt: Date;
}

const ContactSchema = new mongoose.Schema<IContact>({
    id: {
        type: String,
        default: () => crypto.randomUUID(),
        unique: true,
        index: true,
    },
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
    resolved: {
        type: Boolean,
        default: false,
    },
    resolutionMessage: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IContact>('Contact', ContactSchema);

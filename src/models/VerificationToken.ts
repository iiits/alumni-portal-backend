import mongoose, { Document } from 'mongoose';

export interface IVerificationToken extends Document {
    owner: string;
    token: string;
    createdAt: Date;
}

const verificationTokenSchema = new mongoose.Schema({
    owner: {
        type: String,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600, // 1 hour
        default: Date.now,
    },
});

export default mongoose.model<IVerificationToken>(
    'VerificationToken',
    verificationTokenSchema,
);

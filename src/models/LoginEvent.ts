import mongoose, { Document } from 'mongoose';

export interface ILoginEvent extends Document {
    userId: string;
    timestamp: Date;
    userRole: 'admin' | 'alumni' | 'student';
}

const LoginEventSchema = new mongoose.Schema<ILoginEvent>(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User',
            index: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
        userRole: {
            type: String,
            enum: ['admin', 'alumni', 'student'],
            required: true,
        },
    },
    {
        timestamps: false, // We'll use the timestamp field directly
    },
);

// Create a TTL index to automatically delete old records after 90 days
LoginEventSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

export default mongoose.model<ILoginEvent>('LoginEvent', LoginEventSchema);

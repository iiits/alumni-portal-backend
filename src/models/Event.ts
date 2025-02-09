import mongoose, { Document } from 'mongoose';

export interface IEvent extends Document {
    id: string;
    name: string;
    dateTime: Date;
    venue: string;
    description?: string;
    content: {
        title: string;
        description: string;
    };
    type: 'alumni' | 'college' | 'club' | 'others';
    postedBy: String;
}

const EventSchema = new mongoose.Schema<IEvent>({
    id: { type: String, default: () => crypto.randomUUID(), unique: true },
    name: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    venue: { type: String, required: true },
    description: { type: String },
    content: {
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    type: {
        type: String,
        enum: ['alumni', 'college', 'club', 'others'],
        required: true,
    },
    postedBy: {
        type: String,
        ref: 'User',
        required: true,
    },
});

export default mongoose.model<IEvent>('Event', EventSchema);

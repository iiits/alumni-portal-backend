import mongoose, { Document } from 'mongoose';

export interface IEvent extends Document {
    id: string;
    name: string;
    dateTime: Date;
    endDateTime?: Date;
    venue: string;
    description: string;
    content: {
        title: string;
        description: string;
    };
    imageUrl?: string;
    links?: string[];
    type: 'alumni' | 'college' | 'club' | 'others';
    postedBy: String;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new mongoose.Schema<IEvent>(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        dateTime: { type: Date, required: true, index: true },
        endDateTime: { type: Date },
        venue: { type: String, required: true },
        description: { type: String, required: true },
        content: {
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
        imageUrl: { type: String },
        links: [{ type: String }],
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
    },
    {
        timestamps: true,
    },
);

EventSchema.index({ id: 1, dateTime: 1 }, { unique: true });

export default mongoose.model<IEvent>('Event', EventSchema);

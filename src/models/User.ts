import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    id: string;
    name: string;
    collegeEmail: string;
    personalEmail?: string;
    userId: string;
    username: string;
    password: string;
    profilePicture?: string;
    batch: number;
    department: 'AIDS' | 'CSE' | 'ECE';
    profiles: {
        type:
            | 'youtube'
            | 'reddit'
            | 'linkedin'
            | 'twitter'
            | 'instagram'
            | 'facebook'
            | 'discord'
            | 'github';
        link: string;
        visibility: 'yes' | 'no';
    }[];
    bio?: string;
    role: 'admin' | 'alumni' | 'student';
    alumniDetails?: String;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getSignedJwtToken(): string;
}

const UserSchema = new mongoose.Schema<IUser>({
    id: { type: String, default: () => crypto.randomUUID(), unique: true },
    name: { type: String, required: true, trim: true },
    collegeEmail: { type: String, required: true, unique: true },
    personalEmail: { type: String, unique: true },
    userId: {
        type: String,
        required: true,
        unique: true,
        match: /^[AS]\d{4}00[123]\d{4}$/,
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String },
    batch: { type: Number, required: true },
    department: { type: String, enum: ['AIDS', 'CSE', 'ECE'], required: true },
    profiles: [
        {
            type: {
                type: String,
                enum: [
                    'youtube',
                    'reddit',
                    'linkedin',
                    'twitter',
                    'instagram',
                    'facebook',
                    'discord',
                    'github',
                ],
                required: true,
            },
            link: { type: String, required: true },
            visibility: { type: String, enum: ['yes', 'no'], default: 'yes' },
        },
    ],
    bio: { type: String },
    role: {
        type: String,
        enum: ['admin', 'alumni', 'student'],
        required: true,
        default: 'student',
    },
    alumniDetails: {
        type: String,
        ref: 'AlumniDetails',
    },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function (): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
        {
            id: this.id,
            name: this.name,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
        },
    );
};

// Match user entered password to hashed password in database
UserSchema.methods.comparePassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);

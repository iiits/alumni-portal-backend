import mongoose, { Document } from "mongoose";

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
  department: "AIDS" | "CSE" | "ECE";
  profiles: {
    type: "youtube" | "reddit" | "linkedin" | "twitter" | "instagram" | "facebook" | "discord" | "github";
    link: string;
    visibility: "yes" | "no";
  }[];
  bio?: string;
  role: "student" | "alumni";
  alumniDetails?: mongoose.Types.ObjectId;
}

const UserSchema = new mongoose.Schema<IUser>({
  id: { type: String, default: () => crypto.randomUUID(), unique: true },
  name: { type: String, required: true, trim: true },
  collegeEmail: { type: String, required: true, unique: true },
  personalEmail: { type: String, unique: true },
  userId: { type: String, required: true, unique: true, match: /^[AS]\d{4}00[123]\d{4}$/ },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  batch: { type: Number, required: true },
  department: { type: String, enum: ["AIDS", "CSE", "ECE"], required: true },
  profiles: [
    {
      type: { type: String, enum: ["youtube", "reddit", "linkedin", "twitter", "instagram", "facebook", "discord", "github"], required: true },
      link: { type: String, required: true },
      visibility: { type: String, enum: ["yes", "no"], default: "yes" },
    },
  ],
  bio: { type: String },
  role: { type: String, enum: ["student", "alumni"], required: true },
  alumniDetails: { type: mongoose.Schema.Types.ObjectId, ref: "AlumniDetails" },
});

export default mongoose.model<IUser>("User", UserSchema);

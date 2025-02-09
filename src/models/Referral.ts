import mongoose, { Document, Schema } from "mongoose";

export interface IReferral extends Document {
  id: string;
  isActive: "yes" | "no";
  noOfReferrals: number;
  jobTitle: string;
  description: string;
  link: string;
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReferralSchema: Schema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },
    noOfReferrals: {
      type: Number,
      required: true,
      min: [0, "Number of referrals cannot be negative"],
    },
    jobTitle: {
      type: String,
      required: [true, "Please add a job title"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a job description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    link: {
      type: String,
      required: [true, "Please provide a referral link"],
      validate: {
        validator: function (value: string) {
          return /^https?:\/\/\S+$/.test(value);
        },
        message: "Must be a valid URL",
      },
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IReferral>("Referral", ReferralSchema);

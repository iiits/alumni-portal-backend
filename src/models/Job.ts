import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  id: string;
  name: string;
  company: string;
  jobTitle: string;
  eligibility: string;
  description: string;
  type: "full-time" | "part-time" | "intern" | "freelancer";
  stipend?: string;
  duration?: string;
  workType: "on-site" | "remote" | "hybrid";
  links: string[];
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const JobSchema: Schema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    company: {
      type: String,
      required: [true, "Please add a company name"],
      trim: true,
      maxlength: [100, "Company name cannot be more than 100 characters"],
    },
    jobTitle: {
      type: String,
      required: [true, "Please add a job title"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    eligibility: {
      type: String,
      required: [true, "Please add eligibility criteria"],
      maxlength: [500, "Eligibility criteria cannot be more than 500 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a job description"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    type: {
      type: String,
      enum: ["full-time", "part-time", "intern", "freelancer"],
      required: true,
    },
    stipend: {
      type: String,
      maxlength: [50, "Stipend info cannot be more than 50 characters"],
    },
    duration: {
      type: String,
      maxlength: [50, "Duration info cannot be more than 50 characters"],
    },
    workType: {
      type: String,
      enum: ["on-site", "remote", "hybrid"],
      required: true,
    },
    links: {
      type: [String],
      validate: {
        validator: function (arr: string[]) {
          return arr.every((link) => /^https?:\/\/\S+$/.test(link));
        },
        message: "Each link must be a valid URL",
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

export default mongoose.model<IJob>("Job", JobSchema);

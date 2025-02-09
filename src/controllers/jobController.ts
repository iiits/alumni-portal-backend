import { Request, Response } from "express";
import Job from "../models/Job";

/**
 * @desc Create a new job posting
 * @route POST /api/jobs
 */
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, company, jobTitle, eligibility, description, type, stipend, duration, workType, links, postedBy } =
      req.body;

    const job = new Job({
      id,
      name,
      company,
      jobTitle,
      eligibility,
      description,
      type,
      stipend,
      duration,
      workType,
      links,
      postedBy,
    });

    await job.save();
    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Get all job postings
 * @route GET /api/jobs
 */
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email");
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Get a single job posting by ID
 * @route GET /api/jobs/:id
 */
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findOne({ id: req.params.id }).populate("postedBy", "name email");

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Update a job posting
 * @route PUT /api/jobs/:id
 */
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, company, jobTitle, eligibility, description, type, stipend, duration, workType, links } = req.body;

    const job = await Job.findOneAndUpdate(
      { id: req.params.id },
      { name, company, jobTitle, eligibility, description, type, stipend, duration, workType, links },
      { new: true }
    );

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(200).json({ message: "Job updated successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

/**
 * @desc Delete a job posting
 * @route DELETE /api/jobs/:id
 */
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findOneAndDelete({ id: req.params.id });

    if (!job) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: (error as Error).message });
  }
};

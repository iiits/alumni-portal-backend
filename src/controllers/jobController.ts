import { Request, Response } from 'express';
import Job from '../models/Job';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

export const createJob = async (req: Request, res: Response) => {
    try {
        const {
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
        } = req.body;

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
        return apiSuccess(res, job, 'Job posted successfully', 201);
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to create job',
            400,
        );
    }
};

export const getJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await Job.find().populate('postedBy', 'name email');
        return apiSuccess(res, jobs, 'Jobs retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch jobs',
        );
    }
};

export const getJobById = async (req: Request, res: Response) => {
    try {
        const job = await Job.findById(req.params.id).populate(
            'postedBy',
            'name email',
        );
        if (!job) {
            return apiNotFound(res, 'Job not found');
        }
        return apiSuccess(res, job, 'Job retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch job',
        );
    }
};

export const updateJob = async (req: Request, res: Response) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!job) {
            return apiNotFound(res, 'Job not found');
        }
        return apiSuccess(res, job, 'Job updated successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update job',
            400,
        );
    }
};

export const deleteJob = async (req: Request, res: Response) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) {
            return apiNotFound(res, 'Job not found');
        }
        return apiSuccess(res, null, 'Job deleted successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete job',
        );
    }
};

import { Request, Response } from 'express';
import JobPosting from '../models/Job';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

// Create job posting
export const createJobPosting = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const jobPosting = new JobPosting({
            ...req.body,
            postedBy: userId,
        });
        await jobPosting.save();
        apiSuccess(res, jobPosting, 'Job posting created successfully', 201);
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create job posting',
        );
    }
};

// Get all job postings with filters
export const getFilteredJobPostings = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { month, year, type, workType, batch } = req.query;
        let query: any = {};

        if (year) {
            const yearNum = parseInt(year as string);

            if (isNaN(yearNum)) {
                throw new Error('Invalid year');
            }

            if (month) {
                // Month and Year filtering
                const monthNum = parseInt(month as string);
                if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                    throw new Error('Invalid month. Must be between 1 and 12');
                }

                const startDate = new Date(yearNum, monthNum - 1, 1);
                const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

                query.$or = [
                    { lastApplyDate: { $gte: startDate, $lte: endDate } },
                    { postedOn: { $gte: startDate, $lte: endDate } },
                ];
            } else {
                // Year only filtering
                const startDate = new Date(yearNum, 0, 1);
                const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

                query.$or = [
                    { lastApplyDate: { $gte: startDate, $lte: endDate } },
                    { postedOn: { $gte: startDate, $lte: endDate } },
                ];
            }
        } else {
            // Default: Show upcoming jobs
            query.lastApplyDate = { $gte: new Date() };
        }

        if (type) query.type = type;
        if (workType) query.workType = workType;
        if (batch) {
            // Handle both single string and array of strings
            const batchArray = Array.isArray(batch) ? batch : [batch];
            query['eligibility.batch'] = { $in: batchArray };
        }

        const jobPostings = await JobPosting.find(query)
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .select(
                '-_id id jobName company role eligibility description type stipend duration workType links postedBy postedOn lastApplyDate',
            )
            .sort({ lastApplyDate: 1 });

        apiSuccess(res, jobPostings, 'Job postings retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch job postings',
        );
    }
};

// Get all job postings (admin only)
export const getAllJobPostings = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const jobs = await JobPosting.find()
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .sort({ lastApplyDate: -1 });

        apiSuccess(res, jobs, 'Job postings retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch job postings',
        );
    }
};

// Get user's job postings
export const getUserJobPostings = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const requestedUserId = req.params.userId;

        if (userId !== requestedUserId && req.user?.role !== 'admin') {
            apiUnauthorized(
                res,
                "You are not authorized to view this user's job postings",
            );
            return;
        }

        const jobs = await JobPosting.find({ postedBy: requestedUserId })
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .sort({ lastApplyDate: -1 });

        apiSuccess(res, jobs, 'User job postings retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch user job postings',
        );
    }
};

// Update job posting
export const updateJobPosting = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const existingJob = await JobPosting.findOne({
            id: req.params.id,
            $or: [
                { postedBy: req.user?.id },
                { $expr: { $eq: [req.user.role, 'admin'] } },
            ],
        });

        if (!existingJob) {
            apiNotFound(res, 'Job posting not found or unauthorized');
            return;
        }

        // Apply updates & save
        Object.assign(existingJob, req.body);

        const updatedJob = await existingJob.save();

        await updatedJob.populate({
            path: 'postedBy',
            model: 'User',
            localField: 'postedBy',
            foreignField: 'id',
            select: '-_id id name collegeEmail personalEmail',
        });

        apiSuccess(res, updatedJob, 'Job posting updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update job posting',
        );
    }
};

// Delete job posting
export const deleteJobPosting = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const job = await JobPosting.findOneAndDelete({
            id: req.params.id,
            $or: [
                { postedBy: req.user?.id },
                { $expr: { $eq: [req.user.role, 'admin'] } },
            ],
        });

        if (!job) {
            apiNotFound(res, 'Job posting not found or unauthorized');
            return;
        }

        apiSuccess(res, null, 'Job posting deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete job posting',
        );
    }
};

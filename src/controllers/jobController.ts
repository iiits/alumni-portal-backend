import { Request, Response } from 'express';
import JobPosting from '../models/Job';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

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
                const startDate = new Date(yearNum, 0, 1);
                const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

                query.$or = [
                    { lastApplyDate: { $gte: startDate, $lte: endDate } },
                    { postedOn: { $gte: startDate, $lte: endDate } },
                ];
            }
        } else {
            query.lastApplyDate = { $gte: new Date() };
        }

        if (type) query.type = type;
        if (workType) query.workType = workType;
        if (batch) {
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

export const getAllJobPostings = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        let page = Math.max(1, parseInt(req.query.page as string) || 1);
        let limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit as string) || 10),
        );
        const skip = (page - 1) * limit;

        const filters: any = {};
        const now = new Date();

        const startMonthYear = req.query.startMonthYear as string;
        const endMonthYear = req.query.endMonthYear as string;
        const dateField =
            req.query.dateField === 'postedOn' ? 'postedOn' : 'lastApplyDate';
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (startMonthYear) {
            const [startMonth, startYear] = startMonthYear.split('-');
            startDate = new Date(`${startMonth} 1, ${startYear}`);
        }
        if (endMonthYear) {
            const [endMonth, endYear] = endMonthYear.split('-');
            endDate = new Date(`${endMonth} 1, ${endYear}`);
            endDate = new Date(
                endDate.getFullYear(),
                endDate.getMonth() + 1,
                0,
                23,
                59,
                59,
            );
        }

        if (startDate && endDate) {
            filters[dateField] = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            filters[dateField] = { $gte: startDate };
        } else if (endDate) {
            filters[dateField] = { $lte: endDate };
        } else {
            filters.lastApplyDate = { $gte: now };
        }

        if (req.query.type) {
            const validTypes = ['fulltime', 'parttime', 'internship', 'others'];
            const types = (req.query.type as string)
                .split(',')
                .filter(type => validTypes.includes(type));
            if (types.length) {
                filters.type = { $in: types };
            }
        }

        if (req.query.workType) {
            const validWorkTypes = ['onsite', 'remote', 'hybrid'];
            const workTypes = (req.query.workType as string)
                .split(',')
                .filter(type => validWorkTypes.includes(type));
            if (workTypes.length) {
                filters.workType = { $in: workTypes };
            }
        }

        const search = req.query.search as string;
        let posterNameFilter: any = {};
        let jobs: any[] = [];
        let total = 0;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };

            const matchedUsers = await (await import('../models/User')).default
                .find({ name: searchRegex })
                .select('id');
            const matchedUserIds = matchedUsers.map(u => u.id);
            filters.$or = [
                { company: searchRegex },
                { role: searchRegex },
                { postedBy: { $in: matchedUserIds } },
            ];
        }

        let sort: any = { [dateField]: 1 };
        if (endDate && !startDate) {
            sort = { [dateField]: -1 };
        }

        [jobs, total] = await Promise.all([
            JobPosting.find(filters)
                .populate({
                    path: 'postedBy',
                    model: 'User',
                    localField: 'postedBy',
                    foreignField: 'id',
                    select: '-_id id name collegeEmail personalEmail',
                })
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select(
                    '-_id id jobName company role eligibility description type stipend duration workType links postedBy postedOn lastApplyDate',
                )
                .lean(),
            JobPosting.countDocuments(filters),
        ]);

        const totalPages = Math.ceil(total / limit);
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                jobs,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    perPage: limit,
                },
            },
            'Job postings retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch job postings',
        );
    }
};

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

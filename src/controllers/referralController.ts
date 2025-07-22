import { Request, Response } from 'express';
import Referral from '../models/Referral';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

export const createReferral = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;

        const referral = new Referral({
            ...req.body,
            postedBy: userId,
        });
        await referral.save();
        apiSuccess(res, referral, 'Referral created successfully', 201);
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create referral',
        );
    }
};

export const getReferrals = async (
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

        const minReferrals = req.query.minReferrals
            ? Number(req.query.minReferrals)
            : undefined;
        const maxReferrals = req.query.maxReferrals
            ? Number(req.query.maxReferrals)
            : undefined;
        if (minReferrals !== undefined || maxReferrals !== undefined) {
            filters.numberOfReferrals = {};
            if (minReferrals !== undefined)
                filters.numberOfReferrals.$gte = minReferrals;
            if (maxReferrals !== undefined)
                filters.numberOfReferrals.$lte = maxReferrals;
        }

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

        const search = req.query.search as string;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            const matchedUsers = await (await import('../models/User')).default
                .find({ name: searchRegex })
                .select('id');
            const matchedUserIds = matchedUsers.map(u => u.id);
            filters.$or = [
                { 'jobDetails.company': searchRegex },
                { 'jobDetails.role': searchRegex },
                { postedBy: { $in: matchedUserIds } },
            ];
        }

        let sort: any = { [dateField]: 1 };
        if (endDate && !startDate) {
            sort = { [dateField]: -1 };
        }

        const [referrals, total] = await Promise.all([
            Referral.find(filters)
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
                    'id isActive numberOfReferrals jobDetails postedBy postedOn lastApplyDate -_id',
                )
                .lean(),
            Referral.countDocuments(filters),
        ]);

        const totalPages = Math.ceil(total / limit);
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                referrals,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    perPage: limit,
                },
            },
            'Referrals retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch referrals',
        );
    }
};

export const getFilteredReferrals = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { month, year } = req.query;
        let query: {
            $or?: Array<{
                lastApplyDate?: { $gte: Date; $lte: Date };
                postedOn?: { $gte: Date; $lte: Date };
            }>;
            lastApplyDate?: { $gte: Date };
        } = {};

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

                query = {
                    $or: [
                        {
                            lastApplyDate: {
                                $gte: startDate,
                                $lte: endDate,
                            },
                        },
                        {
                            postedOn: {
                                $gte: startDate,
                                $lte: endDate,
                            },
                        },
                    ],
                };
            } else {
                const startDate = new Date(yearNum, 0, 1);
                const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

                query = {
                    $or: [
                        {
                            lastApplyDate: {
                                $gte: startDate,
                                $lte: endDate,
                            },
                        },
                        {
                            postedOn: {
                                $gte: startDate,
                                $lte: endDate,
                            },
                        },
                    ],
                };
            }
        } else {
            query = {
                lastApplyDate: { $gte: new Date() },
            };
        }

        const referrals = await Referral.find(query)
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .select(
                'id isActive numberOfReferrals jobDetails postedBy postedOn lastApplyDate -_id',
            )
            .sort({ lastApplyDate: 1 });

        apiSuccess(res, referrals, 'Referrals retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch referrals',
        );
    }
};

export const getUserReferrals = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const requestedUserId = req.params.userId;

        if (userId !== requestedUserId && req.user?.role !== 'admin') {
            apiUnauthorized(
                res,
                "You are not authorized to view this user's referrals",
            );
            return;
        }

        const referrals = await Referral.find({ postedBy: requestedUserId })
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .sort({ lastApplyDate: -1 });

        apiSuccess(res, referrals, 'User referrals retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch user referrals',
        );
    }
};

export const updateReferral = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const existingReferral = await Referral.findOne({
            id: req.params.id,
            $or: [
                { postedBy: req.user?.id },
                { $expr: { $eq: [req.user.role, 'admin'] } },
            ],
        });

        if (!existingReferral) {
            apiNotFound(res, 'Referral not found or unauthorized');
            return;
        }

        Object.assign(existingReferral, req.body);

        const updatedReferral = await existingReferral.save();

        await updatedReferral.populate({
            path: 'postedBy',
            model: 'User',
            localField: 'postedBy',
            foreignField: 'id',
            select: '-_id id name collegeEmail personalEmail',
        });

        apiSuccess(res, updatedReferral, 'Referral updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update referral',
        );
    }
};

export const deleteReferral = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const referral = await Referral.findOneAndDelete({
            id: req.params.id,
            $or: [
                { postedBy: req.user?.id },
                { $expr: { $eq: [req.user.role, 'admin'] } },
            ],
        });

        if (!referral) {
            apiNotFound(res, 'Referral not found or unauthorized');
            return;
        }

        apiSuccess(res, null, 'Referral deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete referral',
        );
    }
};

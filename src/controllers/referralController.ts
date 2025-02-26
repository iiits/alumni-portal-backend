import { Request, Response } from 'express';
import Referral from '../models/Referral';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

// Create referral
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

// Get all referrals
export const getReferrals = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const referrals = await Referral.find()
            .populate({
                path: 'postedBy',
                model: 'User',
                localField: 'postedBy',
                foreignField: 'id',
                select: '-_id id name collegeEmail personalEmail',
            })
            .sort({ lastApplyDate: -1 });

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

// Get all referrals with filters
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

            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
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
                // Year only filtering
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
            // Default: Show upcoming referrals
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
            .sort({ lastApplyDate: -1 });

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

// Get user's referrals
export const getUserReferrals = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const requestedUserId = req.params.userId;

        // Check if user is requesting their own referrals or is admin
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

// Update referral
export const updateReferral = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const existingReferral = await Referral.findOne({
            id: req.params.id,
            $or: [
                { postedBy: req.user.id },
                { $expr: { $eq: [req.user.role, 'admin'] } },
            ],
        });

        if (!existingReferral) {
            apiNotFound(res, 'Referral not found or unauthorized');
            return;
        }

        // Apply updates and save
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

// Delete referral
export const deleteReferral = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const referral = await Referral.findOneAndDelete({
            id: req.params.id,
            $or: [
                { postedBy: req.user.id },
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

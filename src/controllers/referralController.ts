import { Request, Response } from 'express';
import Referral from '../models/Referral';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

export const createReferral = async (req: Request, res: Response) => {
    try {
        const {
            isActive,
            noOfReferrals,
            jobTitle,
            description,
            link,
            postedBy,
        } = req.body;
        const referral = new Referral({
            isActive,
            noOfReferrals,
            jobTitle,
            description,
            link,
            postedBy,
        });
        await referral.save();
        return apiSuccess(res, referral, 'Referral created successfully', 201);
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create referral',
            400,
        );
    }
};

export const getReferrals = async (req: Request, res: Response) => {
    try {
        const referrals = await Referral.find().populate(
            'postedBy',
            'name email',
        );
        return apiSuccess(res, referrals, 'Referrals retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch referrals',
        );
    }
};

export const getReferralById = async (req: Request, res: Response) => {
    try {
        const referral = await Referral.findOne({ id: req.params.id }).populate(
            'postedBy',
            'name email',
        );
        if (!referral) {
            return apiNotFound(res, 'Referral not found');
        }
        return apiSuccess(res, referral, 'Referral retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch referral',
        );
    }
};

export const updateReferral = async (req: Request, res: Response) => {
    try {
        const { isActive, noOfReferrals, jobTitle, description, link } =
            req.body;
        const referral = await Referral.findOneAndUpdate(
            { id: req.params.id },
            { isActive, noOfReferrals, jobTitle, description, link },
            { new: true },
        );
        if (!referral) {
            return apiNotFound(res, 'Referral not found');
        }
        return apiSuccess(res, referral, 'Referral updated successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update referral',
            400,
        );
    }
};

export const deleteReferral = async (req: Request, res: Response) => {
    try {
        const referral = await Referral.findOneAndDelete({ id: req.params.id });
        if (!referral) {
            return apiNotFound(res, 'Referral not found');
        }
        return apiSuccess(res, null, 'Referral deleted successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete referral',
        );
    }
};

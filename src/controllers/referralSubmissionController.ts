import { Request, Response } from 'express';
import Referral from '../models/Referral';
import ReferralSubmission from '../models/ReferralSubmission';
import {
    apiError,
    apiNotFound,
    apiSuccess,
    apiUnauthorized,
} from '../utils/apiResponses';

// Get all submissions for a specific referral
export const getReferralSubmissions = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;
        const referral = await Referral.findOne({ id: req.params.referralId });

        if (!referral) {
            apiNotFound(res, 'Referral not found');
            return;
        }

        // Check if user is original poster or admin
        if (referral.postedBy !== userId && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to view submissions');
            return;
        }

        const submissions = await ReferralSubmission.find({
            referralId: req.params.referralId,
        })
            .populate({
                path: 'userId',
                model: 'User',
                localField: 'userId',
                foreignField: 'id',
                select: 'id name collegeEmail personalEmail',
            })
            .sort({ submittedAt: -1 });

        apiSuccess(res, submissions, 'Submissions retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch submissions',
        );
    }
};

// Get user's submissions
export const getUserSubmissions = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const submissions = await ReferralSubmission.find({
            userId: req.user?.id,
        })
            .populate({
                path: 'referralId',
                model: 'JobReferral',
                localField: 'referralId',
                foreignField: 'id',
                select: 'id isActive numberOfReferrals jobDetails postedBy postedOn lastApplyDate -_id',
            })
            .sort({ submittedAt: -1 });

        apiSuccess(res, submissions, 'User submissions retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to fetch submissions',
        );
    }
};

// Change submission status (Original poster/Admin only)
export const updateSubmissionStatus = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const submission = await ReferralSubmission.findOne({
            id: req.params.id,
        });

        if (!submission) {
            apiNotFound(res, 'Submission not found');
            return;
        }

        const userId = req.user?.id;
        const referral = await Referral.findOne({ id: submission.referralId });

        if (!referral) {
            apiNotFound(res, 'Referral not found');
            return;
        }

        // Check if user is original poster or admin
        if (referral.postedBy !== userId && req.user.role !== 'admin') {
            apiUnauthorized(res, 'Not authorized to update submission status');
            return;
        }

        submission.status = req.body.status;
        await submission.save();

        apiSuccess(res, submission, 'Submission status updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to update submission status',
        );
    }
};

// Create submission
export const createSubmission = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.id;

        const referral = await Referral.findOne({ id: req.body.referralId });

        if (!referral) {
            apiNotFound(res, 'Referral not found');
            return;
        }

        if (!referral.isActive || referral.lastApplyDate < new Date()) {
            apiError(res, 'This referral is no longer active');
            return;
        }

        const { status, submittedAt, ...submissionData } = req.body;

        const existingSubmission = await ReferralSubmission.findOne({
            referralId: submissionData.referralId,
            userId: userId,
        });

        if (existingSubmission) {
            apiError(res, 'You have already applied for this referral');
            return;
        }

        const submission = new ReferralSubmission({
            ...submissionData,
            userId: userId,
        });
        await submission.save();

        apiSuccess(res, submission, 'Submission created successfully', 201);
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to create submission',
        );
    }
};

// Delete submission (Admin only)
export const deleteSubmission = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const submission = await ReferralSubmission.findOneAndDelete({
            id: req.params.id,
        });

        if (!submission) {
            apiNotFound(res, 'Submission not found');
            return;
        }

        apiSuccess(res, null, 'Submission deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error
                ? error.message
                : 'Failed to delete submission',
        );
    }
};

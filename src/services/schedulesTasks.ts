import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from '../utils/logger';

export const updateExpiredReferrals = async () => {
    try {
        const result = await mongoose.model('JobReferral').updateMany(
            {
                lastApplyDate: { $lt: new Date() },
                isActive: true,
            },
            {
                $set: { isActive: false },
            },
        );
        logger.info(`Updated ${result.modifiedCount} expired referrals`);
    } catch (error) {
        logger.error('Error updating expired referrals:', error);
    }
};

export const initScheduledTasks = () => {
    // Run at midnight (00:00) every day
    cron.schedule('0 0 * * *', () => {
        logger.info('Running scheduled task: Update expired referrals');
        updateExpiredReferrals();
    });

    // Run once when server starts
    updateExpiredReferrals();
};

import { PipelineStage } from 'mongoose';
import ContactUs from '../../models/ContactUs';

export interface ContactAnalytics {
    total: number;
    resolved: number;
    unresolved: number;
    timeseries: Array<{
        date: string;
        count: number;
        resolved: number;
        unresolved: number;
    }>;
}

const getTimeline = async (
    days: number,
): Promise<
    Array<{ date: string; count: number; resolved: number; unresolved: number }>
> => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // Group by day and resolved status
    const pipeline: PipelineStage[] = [
        {
            $match: {
                createdAt: { $gte: start, $lte: now },
            },
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    resolved: '$resolved',
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.date',
                count: { $sum: '$count' },
                resolved: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.resolved', true] }, '$count', 0],
                    },
                },
                unresolved: {
                    $sum: {
                        $cond: [{ $eq: ['$_id.resolved', false] }, '$count', 0],
                    },
                },
            },
        },
        { $sort: { _id: 1 } },
    ];
    const results = await ContactUs.aggregate(pipeline);
    return results.map(r => ({
        date: r._id,
        count: r.count,
        resolved: r.resolved,
        unresolved: r.unresolved,
    }));
};

export const getContactAnalyticsDetailed =
    async (): Promise<ContactAnalytics> => {
        const [total, resolved, unresolved, timeseries] = await Promise.all([
            ContactUs.countDocuments(),
            ContactUs.countDocuments({ resolved: true }),
            ContactUs.countDocuments({ resolved: false }),
            getTimeline(30),
        ]);
        return {
            total,
            resolved,
            unresolved,
            timeseries,
        };
    };

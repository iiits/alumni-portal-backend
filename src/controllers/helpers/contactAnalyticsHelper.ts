import { PipelineStage } from 'mongoose';
import ContactUs from '../../models/ContactUs';

export interface ContactAnalytics {
    total: number;
    resolved: number;
    unresolved: number;
    timeline: {
        '7d': Array<{ date: string; count: number }>;
        '30d': Array<{ date: string; count: number }>;
    };
}

const getTimeline = async (
    days: number,
): Promise<Array<{ date: string; count: number }>> => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // Group by day
    const pipeline: PipelineStage[] = [
        {
            $match: {
                createdAt: { $gte: start, $lte: now },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ];
    const results = await ContactUs.aggregate(pipeline);
    return results.map(r => ({ date: r._id, count: r.count }));
};

export const getContactAnalyticsDetailed =
    async (): Promise<ContactAnalytics> => {
        const [total, resolved, unresolved, timeline7d, timeline30d] =
            await Promise.all([
                ContactUs.countDocuments(),
                ContactUs.countDocuments({ resolved: true }),
                ContactUs.countDocuments({ resolved: false }),
                getTimeline(7),
                getTimeline(30),
            ]);
        return {
            total,
            resolved,
            unresolved,
            timeline: {
                '7d': timeline7d,
                '30d': timeline30d,
            },
        };
    };

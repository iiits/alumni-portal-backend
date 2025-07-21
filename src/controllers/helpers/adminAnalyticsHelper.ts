import { DateTime } from 'luxon';
import { PipelineStage } from 'mongoose';
import Event from '../../models/Event';
import JobPosting from '../../models/Job';
import Referral from '../../models/Referral';
import User from '../../models/User';

interface TimelineData {
    date: string;
    count: number;
}

interface GrowthData {
    rate: number;
    count: number;
}

interface RoleDistribution {
    admin: number;
    alumni: number;
    student: number;
}

interface TopItem {
    name: string;
    count: number;
}

// Helper function to calculate growth data
const calculateGrowth = (
    currentPeriod: TimelineData[],
    previousPeriod: TimelineData[],
): GrowthData => {
    const currentCount = currentPeriod.reduce(
        (sum, item) => sum + item.count,
        0,
    );
    const previousCount = previousPeriod.reduce(
        (sum, item) => sum + item.count,
        0,
    );

    let rate = 0;
    if (previousCount > 0) {
        rate = Number(
            (((currentCount - previousCount) / previousCount) * 100).toFixed(2),
        );
    } else if (currentCount > 0) {
        rate = 100;
    }

    return {
        rate,
        count: currentCount,
    };
};

// Helper function to get date range for different periods
const getDateRange = (
    period: '1d' | '7d' | '30d',
): { start: Date; end: Date; previousStart: Date; previousEnd: Date } => {
    const now = DateTime.now();
    const days = period === '1d' ? 1 : period === '7d' ? 7 : 30;

    return {
        // Current period
        start: now.minus({ days }).toJSDate(),
        end: now.toJSDate(),
        // Previous period (for comparison)
        previousStart: now.minus({ days: days * 2 }).toJSDate(),
        previousEnd: now.minus({ days }).toJSDate(),
    };
};

// Get user growth timeline data for a specific date range
const getUserTimelineData = async (
    start: Date,
    end: Date,
    isHourly: boolean = false,
): Promise<TimelineData[]> => {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: isHourly ? '%Y-%m-%d-%H' : '%Y-%m-%d',
                        date: '$createdAt',
                    },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 as 1 },
        },
    ];

    const results = await User.aggregate(pipeline);

    // Fill in missing dates/hours with zero counts
    const timeline: TimelineData[] = [];
    let current = DateTime.fromJSDate(start);
    const endDt = DateTime.fromJSDate(end);

    while (current <= endDt) {
        const dateStr = isHourly
            ? current.toFormat('yyyy-MM-dd-HH')
            : current.toFormat('yyyy-MM-dd');

        const found = results.find(r => r._id === dateStr);
        timeline.push({
            date: isHourly
                ? current.toFormat('HH:00') // For hourly, just show the hour
                : current.toFormat('yyyy-MM-dd'),
            count: found ? found.count : 0,
        });

        current = current.plus(isHourly ? { hours: 1 } : { days: 1 });
    }

    return timeline;
};

// Get user growth timeline data
const getUserGrowthTimeline = async (
    period: '1d' | '7d' | '30d',
): Promise<{ current: TimelineData[]; previous: TimelineData[] }> => {
    const { start, end, previousStart, previousEnd } = getDateRange(period);
    const isHourly = period === '1d';

    const [current, previous] = await Promise.all([
        getUserTimelineData(start, end, isHourly),
        getUserTimelineData(previousStart, previousEnd, isHourly),
    ]);

    return { current, previous };
};

// Get user analytics
export const getUserAnalytics = async () => {
    const [total, roleDistribution, dayData, weekData, monthData, recentUsers] =
        await Promise.all([
            User.countDocuments(),
            User.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                    },
                },
            ]),
            getUserGrowthTimeline('1d'),
            getUserGrowthTimeline('7d'),
            getUserGrowthTimeline('30d'),
            User.find()
                .select('name collegeEmail batch department role -_id')
                .sort({ createdAt: -1 })
                .limit(10),
        ]);

    // Convert role distribution array to object
    const byRole: RoleDistribution = {
        admin: 0,
        alumni: 0,
        student: 0,
    };
    roleDistribution.forEach(({ _id, count }) => {
        byRole[_id as keyof RoleDistribution] = count;
    });

    // Calculate growth for each period
    const growth = {
        '1d': calculateGrowth(dayData.current, dayData.previous),
        '7d': calculateGrowth(weekData.current, weekData.previous),
        '30d': calculateGrowth(monthData.current, monthData.previous),
    };

    return {
        total,
        byRole,
        growth,
        timeline: {
            '1d': dayData.current,
            '7d': weekData.current,
            '30d': monthData.current,
        },
        recentUsers,
    };
};

// Get event analytics
export const getEventAnalytics = async () => {
    const now = new Date();
    const [total, upcoming, past, upcomingEvents] = await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ dateTime: { $gt: now } }),
        Event.countDocuments({ dateTime: { $lte: now } }),
        Event.find({
            dateTime: { $gt: now },
        })
            .select('name dateTime venue type -_id')
            .sort({ dateTime: 1 })
            .limit(3),
    ]);

    return {
        total,
        upcoming,
        past,
        nextEvents: upcomingEvents.map(event => ({
            name: event.name,
            dateTime: event.dateTime,
            venue: event.venue,
            type: event.type,
        })),
    };
};

// Get top items helper
const getTopItems = async (
    model: typeof JobPosting | typeof Referral,
    field: string,
    limit: number = 10,
): Promise<TopItem[]> => {
    const pipeline: PipelineStage[] = [
        {
            $group: {
                _id: field.includes('.') ? `$${field}` : `$${field}`,
                count: { $sum: 1 },
            },
        },
        {
            $sort: { count: -1 as -1 },
        },
        {
            $limit: limit,
        },
        {
            $project: {
                _id: 0,
                name: '$_id',
                count: 1,
            },
        },
    ];

    return model.aggregate(pipeline);
};

// Get referral analytics
export const getReferralAnalytics = async () => {
    const [total, active, topCompanies, topRoles] = await Promise.all([
        Referral.countDocuments(),
        Referral.countDocuments({ isActive: true }),
        getTopItems(Referral, 'jobDetails.company'),
        getTopItems(Referral, 'jobDetails.role'),
    ]);

    return {
        total,
        active,
        topCompanies,
        topRoles,
    };
};

// Get job analytics
export const getJobAnalytics = async () => {
    const now = new Date();
    const [total, active, topCompanies, topRoles] = await Promise.all([
        JobPosting.countDocuments(),
        JobPosting.countDocuments({ lastApplyDate: { $gt: now } }),
        getTopItems(JobPosting, 'company'),
        getTopItems(JobPosting, 'role'),
    ]);

    return {
        total,
        active,
        topCompanies,
        topRoles,
    };
};

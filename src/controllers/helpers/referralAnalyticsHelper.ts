import { PipelineStage } from 'mongoose';
import Referral from '../../models/Referral';
import User from '../../models/User';

export interface TopItem {
    id: string;
    name: string;
    batch: number;
    role: string;
    postCount: number;
    totalReferrals: number;
    avgReferrals: number;
}

export interface ReferralAnalytics {
    totalPosts: number;
    futurePosts: number;
    pastPosts: number;
    totalReferrals: number;
    uniqueCompanies: number;
    topCompanies: { name: string; count: number }[];
    uniqueRoles: number;
    topRoles: { name: string; count: number }[];
    topPosters: TopItem[];
}

const getTopItems = async (field: string, limit: number = 10) => {
    const pipeline: PipelineStage[] = [
        {
            $group: {
                _id: `$jobDetails.${field}`,
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                name: '$_id',
                count: 1,
            },
        },
    ];
    return Referral.aggregate(pipeline);
};

export const getReferralAnalyticsDetailed =
    async (): Promise<ReferralAnalytics> => {
        const now = new Date();
        const referrals = await Referral.find().select(
            'jobDetails company role postedBy lastApplyDate postedOn numberOfReferrals',
        );

        let totalPosts = referrals.length;
        let futurePosts = 0;
        let pastPosts = 0;
        let totalReferrals = 0;
        const companySet = new Set<string>();
        const roleSet = new Set<string>();
        const posterStats: Record<
            string,
            { postCount: number; totalReferrals: number }
        > = {};

        for (const ref of referrals) {
            const isFuture = ref.lastApplyDate > now;
            if (isFuture) futurePosts++;
            else pastPosts++;

            totalReferrals += ref.numberOfReferrals;
            companySet.add(ref.jobDetails.company);
            roleSet.add(ref.jobDetails.role);

            if (!posterStats[ref.postedBy]) {
                posterStats[ref.postedBy] = { postCount: 0, totalReferrals: 0 };
            }
            posterStats[ref.postedBy].postCount++;
            posterStats[ref.postedBy].totalReferrals += ref.numberOfReferrals;
        }

        const topCompanies = await getTopItems('company', 10);
        const topRoles = await getTopItems('role', 10);

        // Top posters by avg referrals per post
        const topPosterIds = Object.entries(posterStats)
            .map(([id, stats]) => ({
                id,
                postCount: stats.postCount,
                totalReferrals: stats.totalReferrals,
                avgReferrals: stats.postCount
                    ? stats.totalReferrals / stats.postCount
                    : 0,
            }))
            .sort((a, b) => b.avgReferrals - a.avgReferrals)
            .slice(0, 10)
            .map(item => item.id);
        const posterUsers = await User.find({ id: { $in: topPosterIds } })
            .select('id name batch role')
            .lean();
        const topPosters = topPosterIds.map(id => {
            const user = posterUsers.find(u => u.id === id);
            const stats = posterStats[id];
            return {
                id,
                name: user?.name || '',
                batch: user?.batch || 2014,
                role: user?.role || '',
                postCount: stats.postCount,
                totalReferrals: stats.totalReferrals,
                avgReferrals: stats.postCount
                    ? stats.totalReferrals / stats.postCount
                    : 0,
            };
        });

        return {
            totalPosts,
            futurePosts,
            pastPosts,
            totalReferrals,
            uniqueCompanies: companySet.size,
            topCompanies,
            uniqueRoles: roleSet.size,
            topRoles,
            topPosters,
        };
    };

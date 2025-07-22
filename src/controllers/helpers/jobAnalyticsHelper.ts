import { PipelineStage } from 'mongoose';
import JobPosting from '../../models/Job';
import User from '../../models/User';

export interface JobTypeStats {
    [type: string]: number;
}
export interface WorkTypeStats {
    [type: string]: number;
}
export interface TopItem {
    id: string;
    name: string;
    batch: number;
    role: string;
    count: number;
}

export interface JobAnalytics {
    total: number;
    future: number;
    past: number;
    typeStats: {
        future: JobTypeStats;
        past: JobTypeStats;
        total: JobTypeStats;
    };
    workTypeStats: {
        future: WorkTypeStats;
        past: WorkTypeStats;
        total: WorkTypeStats;
    };
    uniqueCompanies: number;
    topCompanies: TopItem[];
    uniqueRoles: number;
    topRoles: TopItem[];
    topPosters: TopItem[];
}

const getTopItems = async (field: string, limit: number = 10) => {
    const pipeline: PipelineStage[] = [
        {
            $group: {
                _id: `$${field}`,
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
    return JobPosting.aggregate(pipeline);
};

export const getJobAnalyticsDetailed = async (): Promise<JobAnalytics> => {
    const now = new Date();
    const jobs = await JobPosting.find().select(
        'type workType company role postedBy lastApplyDate',
    );

    let total = jobs.length;
    let future = 0;
    let past = 0;
    const typeStats = { future: {}, past: {}, total: {} } as {
        future: JobTypeStats;
        past: JobTypeStats;
        total: JobTypeStats;
    };
    const workTypeStats = { future: {}, past: {}, total: {} } as {
        future: WorkTypeStats;
        past: WorkTypeStats;
        total: WorkTypeStats;
    };
    const companySet = new Set<string>();
    const roleSet = new Set<string>();
    const posterCount: Record<string, number> = {};

    for (const job of jobs) {
        const isFuture = job.lastApplyDate > now;
        if (isFuture) future++;
        else past++;

        typeStats.total[job.type] = (typeStats.total[job.type] || 0) + 1;
        if (isFuture)
            typeStats.future[job.type] = (typeStats.future[job.type] || 0) + 1;
        else typeStats.past[job.type] = (typeStats.past[job.type] || 0) + 1;

        workTypeStats.total[job.workType] =
            (workTypeStats.total[job.workType] || 0) + 1;
        if (isFuture)
            workTypeStats.future[job.workType] =
                (workTypeStats.future[job.workType] || 0) + 1;
        else
            workTypeStats.past[job.workType] =
                (workTypeStats.past[job.workType] || 0) + 1;

        companySet.add(job.company);
        roleSet.add(job.role);

        posterCount[job.postedBy] = (posterCount[job.postedBy] || 0) + 1;
    }

    const topCompanies = await getTopItems('company', 10);
    const topRoles = await getTopItems('role', 10);

    const topPosterIds = Object.entries(posterCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);
    const posterUsers = await User.find({ id: { $in: topPosterIds } })
        .select('id name batch role')
        .lean();
    const topPosters = topPosterIds.map(id => {
        const user = posterUsers.find(u => u.id === id);
        return {
            id,
            name: user?.name || '',
            batch: user?.batch || 2014,
            role: user?.role || '',
            count: posterCount[id],
        };
    });
    return {
        total,
        future,
        past,
        typeStats,
        workTypeStats,
        uniqueCompanies: companySet.size,
        topCompanies,
        uniqueRoles: roleSet.size,
        topRoles,
        topPosters,
    };
};

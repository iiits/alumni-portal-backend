import { PipelineStage } from 'mongoose';
import User from '../../models/User';
import {
    getUserAnalytics,
    getUtcDateTime,
    GrowthData,
    RoleDistribution,
} from './adminAnalyticsHelper';

type Department = 'AIDS' | 'CSE' | 'ECE';

interface BatchAnalytics {
    batch: number;
    total: number;
    byRole: RoleDistribution;
    growth: GrowthData;
}

interface BranchAnalytics {
    department: Department;
    total: number;
    byRole: RoleDistribution;
    growth: GrowthData;
}

interface UnverifiedUsers {
    total: number;
    users: Array<{
        name: string;
        collegeEmail: string;
        batch: string;
        department: string;
        role: string;
        createdAt: Date;
    }>;
}

interface RoleStats {
    role: string;
    period: string;
    count: number;
}

interface BatchResults {
    _id: number;
    roles: RoleStats[];
    total: number;
}

interface DepartmentResults {
    _id: string;
    roles: RoleStats[];
    total: number;
}

const calculateGrowthRate = (current: number, total: number): number => {
    if (total === 0) return 0;
    if (current === 0) return 0;
    return Number(((current / total) * 100).toFixed(2));
};

const sumValues = (obj: RoleDistribution): number => {
    return Object.values(obj).reduce<number>(
        (a: number, b: number) => a + b,
        0,
    );
};

const getEmptyAnalytics = () => ({
    total: 0,
    byRole: {
        admin: 0,
        alumni: 0,
        student: 0,
    },
    growth: { count: 0, rate: 0 },
});

// Get batch-wise analytics
export const getBatchAnalytics = async (
    roleFilter?: string,
): Promise<BatchAnalytics[]> => {
    const now = getUtcDateTime();
    const baseFilter = roleFilter ? { role: roleFilter } : {};
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();

    const batchQuery = roleFilter ? { role: roleFilter } : {};
    const uniqueBatches = await User.distinct('batch', batchQuery);
    const batchYears = uniqueBatches.sort((a, b) => a - b);

    const pipeline: PipelineStage[] = [
        {
            $match: baseFilter,
        },
        {
            $group: {
                _id: {
                    batch: '$batch',
                    role: '$role',
                },
                count: {
                    $sum: {
                        $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0],
                    },
                },
                total: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.batch',
                roles: {
                    $push: {
                        role: '$_id.role',
                        count: '$count',
                        total: '$total',
                    },
                },
                total: { $sum: '$total' },
            },
        },
    ];

    const batchResults = await User.aggregate<BatchResults>(pipeline);
    const batchMap = new Map(batchResults.map(batch => [batch._id, batch]));

    return batchYears.map(year => {
        const batch = batchMap.get(year);
        if (!batch) {
            return {
                batch: year,
                ...getEmptyAnalytics(),
            };
        }
        const byRole: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };
        let growthCount = 0;
        batch.roles.forEach((data: any) => {
            byRole[data.role as keyof RoleDistribution] += data.total;
            growthCount += data.count;
        });
        const growth = {
            count: growthCount,
            rate: calculateGrowthRate(growthCount, batch.total),
        };
        return {
            batch: batch._id,
            total: batch.total,
            byRole,
            growth,
        };
    });
};

// Get department-wise analytics
export const getDepartmentAnalytics = async (
    roleFilter?: string,
): Promise<BranchAnalytics[]> => {
    const now = getUtcDateTime();
    const baseFilter = roleFilter ? { role: roleFilter } : {};
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();
    const departments = (
        await User.distinct('department')
    ).sort() as Department[];
    const pipeline: PipelineStage[] = [
        {
            $match: baseFilter,
        },
        {
            $group: {
                _id: {
                    department: '$department',
                    role: '$role',
                },
                count: {
                    $sum: {
                        $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0],
                    },
                },
                total: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.department',
                roles: {
                    $push: {
                        role: '$_id.role',
                        count: '$count',
                        total: '$total',
                    },
                },
                total: { $sum: '$total' },
            },
        },
    ];
    const departmentResults = await User.aggregate<DepartmentResults>(pipeline);
    const deptMap = new Map(departmentResults.map(dept => [dept._id, dept]));
    return departments.map(dept => {
        const deptData = deptMap.get(dept);
        if (!deptData) {
            return {
                department: dept,
                ...getEmptyAnalytics(),
            };
        }
        const byRole: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };
        let growthCount = 0;
        deptData.roles.forEach((data: any) => {
            byRole[data.role as keyof RoleDistribution] += data.total;
            growthCount += data.count;
        });
        const growth = {
            count: growthCount,
            rate: calculateGrowthRate(growthCount, deptData.total),
        };
        return {
            department: dept,
            total: deptData.total,
            byRole,
            growth,
        };
    });
};

// Get unverified users analytics
const getUnverifiedUsers = async (): Promise<UnverifiedUsers> => {
    const unverifiedUsers = await User.find(
        { verified: false },
        'name collegeEmail batch department role createdAt -_id',
    ).lean();

    return {
        total: unverifiedUsers.length,
        users: unverifiedUsers.map(user => ({
            name: user.name || '',
            collegeEmail: user.collegeEmail || '',
            batch: String(user.batch || ''),
            department: user.department || '',
            role: user.role || '',
            createdAt: new Date(),
        })),
    };
};

// Get detailed user analytics
export const getDetailedUserAnalytics = async () => {
    const userStats = await getUserAnalytics();
    const { recentUsers, ...overview } = userStats;

    const [batches, departments, unverified] = await Promise.all([
        getBatchAnalytics(),
        getDepartmentAnalytics(),
        getUnverifiedUsers(),
    ]);

    return {
        overview,
        byBatch: batches,
        byDepartment: departments,
        unverified,
    };
};

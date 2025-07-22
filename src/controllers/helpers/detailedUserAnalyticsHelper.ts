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
    batch: string;
    total: number;
    byRole: RoleDistribution;
    growth: {
        '7d': GrowthData;
        '30d': GrowthData;
    };
}

interface BranchAnalytics {
    department: Department;
    total: number;
    byRole: RoleDistribution;
    growth: {
        '7d': GrowthData;
        '30d': GrowthData;
    };
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
    _id: string;
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
    growth: {
        '7d': { count: 0, rate: 0 },
        '30d': { count: 0, rate: 0 },
    },
});

// Get batch-wise analytics
const getBatchAnalytics = async (): Promise<BatchAnalytics[]> => {
    const now = getUtcDateTime();
    const sevenDaysAgo = now.minus({ days: 7 }).toJSDate();
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();
    const currentYear = now.year;
    const batchYears = Array.from(
        { length: currentYear + 5 - 2014 + 1 },
        (_, i) => (2014 + i).toString(),
    );

    const pipeline: PipelineStage[] = [
        {
            $group: {
                _id: {
                    batch: '$batch',
                    role: '$role',
                    period: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $gte: ['$createdAt', sevenDaysAgo],
                                    },
                                    then: 'last7days',
                                },
                                {
                                    case: {
                                        $gte: ['$createdAt', thirtyDaysAgo],
                                    },
                                    then: 'last30days',
                                },
                            ],
                            default: 'older',
                        },
                    },
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.batch',
                roles: {
                    $push: {
                        role: '$_id.role',
                        period: '$_id.period',
                        count: '$count',
                    },
                },
                total: { $sum: '$count' },
            },
        },
    ];

    const batchResults = await User.aggregate<BatchResults>(pipeline);

    // Create a map for easier access to results
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

        const last7Days: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };

        const last30Days: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };

        batch.roles.forEach((data: RoleStats) => {
            byRole[data.role as keyof RoleDistribution] += data.count;

            if (data.period === 'last7days') {
                last7Days[data.role as keyof RoleDistribution] += data.count;
            }
            if (data.period === 'last30days' || data.period === 'last7days') {
                last30Days[data.role as keyof RoleDistribution] += data.count;
            }
        });

        const growth = {
            '7d': {
                count: sumValues(last7Days),
                rate: calculateGrowthRate(sumValues(last7Days), batch.total),
            },
            '30d': {
                count: sumValues(last30Days),
                rate: calculateGrowthRate(sumValues(last30Days), batch.total),
            },
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
const getDepartmentAnalytics = async (): Promise<BranchAnalytics[]> => {
    const now = getUtcDateTime();
    const sevenDaysAgo = now.minus({ days: 7 }).toJSDate();
    const thirtyDaysAgo = now.minus({ days: 30 }).toJSDate();
    const departments: Department[] = ['AIDS', 'CSE', 'ECE'];

    const pipeline: PipelineStage[] = [
        {
            $group: {
                _id: {
                    department: '$department',
                    role: '$role',
                    period: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $gte: ['$createdAt', sevenDaysAgo],
                                    },
                                    then: 'last7days',
                                },
                                {
                                    case: {
                                        $gte: ['$createdAt', thirtyDaysAgo],
                                    },
                                    then: 'last30days',
                                },
                            ],
                            default: 'older',
                        },
                    },
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.department',
                roles: {
                    $push: {
                        role: '$_id.role',
                        period: '$_id.period',
                        count: '$count',
                    },
                },
                total: { $sum: '$count' },
            },
        },
    ];

    const departmentResults = await User.aggregate<DepartmentResults>(pipeline);

    // Create a map for easier access to results
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

        const last7Days: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };

        const last30Days: RoleDistribution = {
            admin: 0,
            alumni: 0,
            student: 0,
        };

        deptData.roles.forEach((data: RoleStats) => {
            byRole[data.role as keyof RoleDistribution] += data.count;

            if (data.period === 'last7days') {
                last7Days[data.role as keyof RoleDistribution] += data.count;
            }
            if (data.period === 'last30days' || data.period === 'last7days') {
                last30Days[data.role as keyof RoleDistribution] += data.count;
            }
        });

        const growth = {
            '7d': {
                count: sumValues(last7Days),
                rate: calculateGrowthRate(sumValues(last7Days), deptData.total),
            },
            '30d': {
                count: sumValues(last30Days),
                rate: calculateGrowthRate(
                    sumValues(last30Days),
                    deptData.total,
                ),
            },
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

import { PipelineStage } from 'mongoose';
import AlumniDetails from '../../models/AlumniDetails';
import { getUtcDateTime } from './adminAnalyticsHelper';
import {
    getBatchAnalytics,
    getDepartmentAnalytics,
} from './detailedUserAnalyticsHelper';

interface JobPosition {
    title: string;
    type: 'full-time' | 'part-time' | 'freelancer' | 'intern' | 'entrepreneur';
    start: Date;
    end?: Date | null;
    ongoing: boolean;
    location: string;
    jobType: 'on-site' | 'remote' | 'hybrid';
    description?: string;
}

interface Education {
    school: string;
    degree: string;
    fieldOfStudy: string;
    start: Date;
    end?: Date | null;
    ongoing: boolean;
    location: string;
    description?: string;
}

interface TopLocation {
    _id: string;
    count: number;
}

interface JobAnalytics {
    all: {
        total: number;
        byEmploymentType: Record<string, number>;
        byJobType: Record<string, number>;
        topTitles: TopLocation[];
        topLocations: TopLocation[];
        topCompanies: TopLocation[];
    };
    ongoing: {
        total: number;
        byEmploymentType: Record<string, number>;
        byJobType: Record<string, number>;
        topTitles: TopLocation[];
        topLocations: TopLocation[];
        topCompanies: TopLocation[];
    };
}

interface EducationAnalytics {
    all: {
        total: number;
        topDegrees: TopLocation[];
        topFields: TopLocation[];
        topSchools: TopLocation[];
        topLocations: TopLocation[];
    };
    ongoing: {
        total: number;
        topDegrees: TopLocation[];
        topFields: TopLocation[];
        topSchools: TopLocation[];
        topLocations: TopLocation[];
    };
}

interface LocationAnalytics {
    topCities: TopLocation[];
    topCountries: TopLocation[];
}

const getJobAnalytics = async (): Promise<JobAnalytics> => {
    const now = getUtcDateTime();
    const pipeline: PipelineStage[] = [
        {
            $match: { verified: true },
        },
        {
            $unwind: '$jobPosition',
        },
        {
            $facet: {
                all: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            employmentTypes: {
                                $push: '$jobPosition.type',
                            },
                            jobTypes: {
                                $push: '$jobPosition.jobType',
                            },
                            titles: {
                                $push: '$jobPosition.title',
                            },
                            locations: {
                                $push: '$jobPosition.location',
                            },
                            companies: {
                                $push: '$jobPosition.company',
                            },
                        },
                    },
                ],
                ongoing: [
                    {
                        $match: {
                            $or: [
                                { 'jobPosition.end': { $exists: false } },
                                { 'jobPosition.end': null },
                                { 'jobPosition.ongoing': true },
                                {
                                    'jobPosition.end': {
                                        $gt: now.toJSDate(),
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            employmentTypes: {
                                $push: '$jobPosition.type',
                            },
                            jobTypes: {
                                $push: '$jobPosition.jobType',
                            },
                            titles: {
                                $push: '$jobPosition.title',
                            },
                            locations: {
                                $push: '$jobPosition.location',
                            },
                            companies: {
                                $push: '$jobPosition.company',
                            },
                        },
                    },
                ],
            },
        },
    ];

    const [result] = await AlumniDetails.aggregate(pipeline);

    const processGroup = (group: any) => {
        if (!group || !group.length) {
            return {
                total: 0,
                byEmploymentType: {},
                byJobType: {},
                topTitles: [],
                topLocations: [],
                topCompanies: [],
            };
        }
        const data = group[0];

        const byEmploymentType = data.employmentTypes.reduce(
            (acc: Record<string, number>, type: string) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            },
            {},
        );

        const byJobType = data.jobTypes.reduce(
            (acc: Record<string, number>, type: string) => {
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            },
            {},
        );

        const titlesCount = data.titles.reduce(
            (acc: Record<string, number>, title: string) => {
                if (title) acc[title] = (acc[title] || 0) + 1;
                return acc;
            },
            {},
        );

        const locationsCount = data.locations.reduce(
            (acc: Record<string, number>, location: string) => {
                if (location) acc[location] = (acc[location] || 0) + 1;
                return acc;
            },
            {},
        );

        const companiesCount = data.companies.reduce(
            (acc: Record<string, number>, company: string) => {
                if (company) acc[company] = (acc[company] || 0) + 1;
                return acc;
            },
            {},
        );

        return {
            total: data.total,
            byEmploymentType,
            byJobType,
            topTitles: Object.entries(titlesCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topLocations: Object.entries(locationsCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topCompanies: Object.entries(companiesCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
        };
    };

    return {
        all: processGroup(result.all),
        ongoing: processGroup(result.ongoing),
    };
};

const getEducationAnalytics = async (): Promise<EducationAnalytics> => {
    const now = getUtcDateTime();
    const pipeline: PipelineStage[] = [
        {
            $match: { verified: true },
        },
        {
            $unwind: '$education',
        },
        {
            $facet: {
                all: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            degrees: {
                                $push: '$education.degree',
                            },
                            fields: {
                                $push: '$education.fieldOfStudy',
                            },
                            schools: {
                                $push: '$education.school',
                            },
                            locations: {
                                $push: '$education.location',
                            },
                        },
                    },
                ],
                ongoing: [
                    {
                        $match: {
                            $or: [
                                { 'education.end': { $exists: false } },
                                { 'education.end': null },
                                { 'education.ongoing': true },
                                {
                                    'education.end': {
                                        $gt: now.toJSDate(),
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            degrees: {
                                $push: '$education.degree',
                            },
                            fields: {
                                $push: '$education.fieldOfStudy',
                            },
                            schools: {
                                $push: '$education.school',
                            },
                            locations: {
                                $push: '$education.location',
                            },
                        },
                    },
                ],
            },
        },
    ];

    const [result] = await AlumniDetails.aggregate(pipeline);
    const empty = {
        total: 0,
        byDegree: {},
        byField: {},
        topLocations: { cities: [], countries: [], schools: [] },
    };

    const processGroup = (group: any) => {
        if (!group || !group.length) {
            return {
                total: 0,
                topDegrees: [],
                topFields: [],
                topSchools: [],
                topLocations: [],
            };
        }
        const data = group[0];

        const degreesCount = data.degrees.reduce(
            (acc: Record<string, number>, degree: string) => {
                if (degree) acc[degree] = (acc[degree] || 0) + 1;
                return acc;
            },
            {},
        );

        const fieldsCount = data.fields.reduce(
            (acc: Record<string, number>, field: string) => {
                if (field) acc[field] = (acc[field] || 0) + 1;
                return acc;
            },
            {},
        );

        const schoolsCount = data.schools.reduce(
            (acc: Record<string, number>, school: string) => {
                if (school) acc[school] = (acc[school] || 0) + 1;
                return acc;
            },
            {},
        );

        const locationsCount = data.locations.reduce(
            (acc: Record<string, number>, location: string) => {
                if (location) acc[location] = (acc[location] || 0) + 1;
                return acc;
            },
            {},
        );

        return {
            total: data.total,
            topDegrees: Object.entries(degreesCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topFields: Object.entries(fieldsCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topSchools: Object.entries(schoolsCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topLocations: Object.entries(locationsCount)
                .map(([_id, count]) => ({ _id, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
        };
    };

    return {
        all: processGroup(result.all),
        ongoing: processGroup(result.ongoing),
    };
};

const getLocationAnalytics = async (): Promise<LocationAnalytics> => {
    const pipeline: PipelineStage[] = [
        {
            $match: { verified: true },
        },
        {
            $group: {
                _id: null,
                cities: {
                    $push: '$location.city',
                },
                countries: {
                    $push: '$location.country',
                },
            },
        },
    ];

    const [result] = await AlumniDetails.aggregate(pipeline);

    if (!result) {
        return {
            topCities: [],
            topCountries: [],
        };
    }

    const cities = result.cities.reduce(
        (acc: Record<string, number>, city: string) => {
            if (city) acc[city] = (acc[city] || 0) + 1;
            return acc;
        },
        {},
    );

    const countries = result.countries.reduce(
        (acc: Record<string, number>, country: string) => {
            if (country) acc[country] = (acc[country] || 0) + 1;
            return acc;
        },
        {},
    );

    return {
        topCities: Object.entries(cities)
            .map(([_id, count]) => ({ _id, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
        topCountries: Object.entries(countries)
            .map(([_id, count]) => ({ _id, count: count as number }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
    };
};

export const getAlumniAnalytics = async () => {
    const [batches, departments, jobStats, educationStats, locationStats] =
        await Promise.all([
            getBatchAnalytics('alumni'),
            getDepartmentAnalytics('alumni'),
            getJobAnalytics(),
            getEducationAnalytics(),
            getLocationAnalytics(),
        ]);

    return {
        batches,
        departments,
        jobs: jobStats,
        education: educationStats,
        locations: locationStats,
    };
};

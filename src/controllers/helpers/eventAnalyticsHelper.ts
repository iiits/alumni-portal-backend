import { DateTime } from 'luxon';
import Event from '../../models/Event';

export interface EventTypeStats {
    [type: string]: number;
}

export interface EventMonthStats {
    monthYear: string;
    total: number;
    typeStats: EventTypeStats;
}

export interface EventAnalytics {
    total: number;
    future: number;
    past: number;
    typeStats: EventTypeStats;
    timeseries: EventMonthStats[];
}

// Helper to get month-year string
const getMonthYear = (date: Date): string => {
    return DateTime.fromJSDate(date).toFormat('MMM-yyyy');
};

export const getEventAnalyticsDetailed = async (): Promise<EventAnalytics> => {
    const now = new Date();
    const events = await Event.find().select('dateTime type');

    let total = events.length;
    let future = 0;
    let past = 0;
    const typeStats: EventTypeStats = {};
    const monthMap: Map<string, { total: number; typeStats: EventTypeStats }> =
        new Map();

    for (const event of events) {
        // Count future/past
        if (event.dateTime > now) future++;
        else past++;

        // Type-wise count
        typeStats[event.type] = (typeStats[event.type] || 0) + 1;

        // Month-year aggregation
        const monthYear = getMonthYear(event.dateTime);
        if (!monthMap.has(monthYear)) {
            monthMap.set(monthYear, { total: 0, typeStats: {} });
        }
        const monthStats = monthMap.get(monthYear)!;
        monthStats.total++;
        monthStats.typeStats[event.type] =
            (monthStats.typeStats[event.type] || 0) + 1;
    }

    // Convert map to array
    const timeseries: EventMonthStats[] = Array.from(monthMap.entries()).map(
        ([monthYear, stats]) => ({
            monthYear,
            total: stats.total,
            typeStats: stats.typeStats,
        }),
    );

    // Sort timeseries by month-year ascending
    timeseries.sort(
        (a, b) =>
            DateTime.fromFormat(a.monthYear, 'MMM-yyyy').toMillis() -
            DateTime.fromFormat(b.monthYear, 'MMM-yyyy').toMillis(),
    );

    return {
        total,
        future,
        past,
        typeStats,
        timeseries,
    };
};

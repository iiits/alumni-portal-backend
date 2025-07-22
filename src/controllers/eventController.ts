import { Request, Response } from 'express';
import Event from '../models/Event';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Get events with year filter
export const getFilteredEvents = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { year, type } = req.query;

        const currentDate = new Date();
        let startDate: Date;
        let endDate: Date;

        if (year) {
            const requestedYear = parseInt(year as string);
            if (isNaN(requestedYear)) {
                apiError(res, 'Invalid year provided');
                return;
            }
            startDate = new Date(requestedYear, 0, 1);
            endDate =
                requestedYear === currentDate.getFullYear()
                    ? currentDate
                    : new Date(requestedYear, 11, 31, 23, 59, 59);
        } else {
            startDate = currentDate;
            endDate = new Date(
                currentDate.getFullYear() + 100,
                11,
                31,
                23,
                59,
                59,
            );
        }

        const query: any = {
            dateTime: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        if (type) {
            query.type = type;
        }

        const events = await Event.find(query)
            .sort({ dateTime: 1 })
            .select('-__v');

        apiSuccess(res, events, 'Events retrieved successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch events',
        );
    }
};

// Get all events
export const getEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        let page = Math.max(1, parseInt(req.query.page as string) || 1);
        let limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit as string) || 10),
        );
        const skip = (page - 1) * limit;

        const filters: any = {};
        const now = new Date();

        const startMonthYear = req.query.startMonthYear as string;
        const endMonthYear = req.query.endMonthYear as string;
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (startMonthYear) {
            const [startMonth, startYear] = startMonthYear.split('-');
            startDate = new Date(`${startMonth} 1, ${startYear}`);
        }
        if (endMonthYear) {
            const [endMonth, endYear] = endMonthYear.split('-');
            endDate = new Date(`${endMonth} 1, ${endYear}`);

            endDate = new Date(
                endDate.getFullYear(),
                endDate.getMonth() + 1,
                0,
                23,
                59,
                59,
            );
        }

        if (startDate && endDate) {
            filters.dateTime = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            filters.dateTime = { $gte: startDate };
        } else if (endDate) {
            filters.dateTime = { $lte: endDate };
        } else {
            filters.dateTime = { $gte: now };
        }

        if (req.query.type) {
            const validTypes = ['alumni', 'college', 'club', 'others'];
            const types = (req.query.type as string)
                .split(',')
                .filter(type => validTypes.includes(type));
            if (types.length) {
                filters.type = { $in: types };
            }
        }

        const search = req.query.search as string;
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            filters.$or = [{ name: searchRegex }, { venue: searchRegex }];
        }

        let sort: any = { dateTime: 1 };
        if (endDate && !startDate) {
            sort = { dateTime: -1 };
        }

        const [events, total] = await Promise.all([
            Event.find(filters)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-_id -__v')
                .lean(),
            Event.countDocuments(filters),
        ]);

        const totalPages = Math.ceil(total / limit);
        if (totalPages > 0 && page > totalPages) {
            page = totalPages;
        }

        apiSuccess(
            res,
            {
                events,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    perPage: limit,
                },
            },
            'Events retrieved successfully',
        );
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch events',
        );
    }
};

// Create event
export const createEvent = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const existingEvent = await Event.findOne({
            name: req.body.name,
            dateTime: new Date(req.body.dateTime),
        });

        if (existingEvent) {
            apiError(res, 'Event already exists');
            return;
        }

        if (
            req.body.endDateTime &&
            new Date(req.body.endDateTime) < new Date(req.body.dateTime)
        ) {
            apiError(
                res,
                'End date must be greater than or equal to start date',
            );
            return;
        }

        const event = new Event({
            ...req.body,
            postedBy: req.user?.id,
        });

        await event.save();
        apiSuccess(res, event, 'Event created successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to create event',
        );
    }
};

// Update event
export const updateEvent = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const event = await Event.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true, runValidators: true },
        ).select('-_id -__v');

        if (!event) {
            apiNotFound(res, 'Event not found');
            return;
        }

        apiSuccess(res, event, 'Event updated successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update event',
        );
    }
};

// Delete event
export const deleteEvent = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const event = await Event.findOneAndDelete({ id: req.params.id });

        if (!event) {
            apiNotFound(res, 'Event not found');
            return;
        }

        apiSuccess(res, null, 'Event deleted successfully');
    } catch (error) {
        apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete event',
        );
    }
};

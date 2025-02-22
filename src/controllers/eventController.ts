import { Request, Response } from 'express';
import Event from '../models/Event';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Get events with year filter
export const getFilteredEvents = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { year } = req.query;
        const requestedYear = req.query.year
            ? parseInt(year as string)
            : new Date().getFullYear();

        if (isNaN(requestedYear)) {
            apiError(res, 'Invalid year provided');
            return;
        }

        const startDate = new Date(requestedYear, 0, 1);
        const endDate = new Date(requestedYear, 11, 31, 23, 59, 59);

        const events = await Event.find({
            dateTime: {
                $gte: startDate,
                $lte: endDate,
            },
        })
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
        const events = await Event.find().sort({ dateTime: 1 }).select('-__v');
        apiSuccess(res, events, 'Events retrieved successfully');
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

        const event = new Event({
            ...req.body,
            postedBy: req.user.id,
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
        ).select('-__v');

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

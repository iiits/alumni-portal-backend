import { Request, Response } from 'express';
import Event from '../models/Event';
import { apiError, apiNotFound, apiSuccess } from '../utils/apiResponses';

// Create a new event
export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = new Event(req.body);
        await event.save();
        return apiSuccess(res, event, 'Event created successfully', 201);
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to create event',
            400,
        );
    }
};

// Get all events
export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.find();
        return apiSuccess(res, events, 'Events retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch events',
        );
    }
};

// Get a single event by ID
export const getEventById = async (req: Request, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return apiNotFound(res, 'Event not found');
        }
        return apiSuccess(res, event, 'Event retrieved successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to fetch event',
        );
    }
};

// Update an event by ID
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!event) {
            return apiNotFound(res, 'Event not found');
        }
        return apiSuccess(res, event, 'Event updated successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to update event',
            400,
        );
    }
};

// Delete an event by ID
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return apiNotFound(res, 'Event not found');
        }
        return apiSuccess(res, null, 'Event deleted successfully');
    } catch (error) {
        return apiError(
            res,
            error instanceof Error ? error.message : 'Failed to delete event',
        );
    }
};

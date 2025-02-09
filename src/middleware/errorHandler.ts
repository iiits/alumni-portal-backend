import { apiError } from '@/utils/apiResponses';
import { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (err instanceof AppError) {
        return apiError(res, err.message, err.statusCode);
    }

    console.error(err.stack);
    return apiError(res, 'Internal Server Error');
};

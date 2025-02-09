import { Response } from 'express';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export const apiSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
) => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
    };
    return res.status(statusCode).json(response);
};

export const apiError = (
    res: Response,
    message: string,
    statusCode: number = 500,
) => {
    const response: ApiResponse<null> = {
        success: false,
        message,
        error: message,
    };
    return res.status(statusCode).json(response);
};

export const apiNotFound = (
    res: Response,
    message: string = 'Resource not found',
) => {
    return apiError(res, message, 404);
};

export const apiUnauthorized = (
    res: Response,
    message: string = 'Unauthorized access',
) => {
    return apiError(res, message, 401);
};

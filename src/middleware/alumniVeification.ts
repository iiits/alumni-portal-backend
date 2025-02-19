import { NextFunction, Request, Response } from 'express';
import AlumniDetails from '../models/AlumniDetails';
import { apiError } from '../utils/apiResponses';

declare global {
    namespace Express {
        interface Request {
            alumni?: any;
        }
    }
}

export const requireVerified = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    if (!req.user?.verified) {
        apiError(res, 'Please verify your email first', 403);
        return;
    }
    next();
};

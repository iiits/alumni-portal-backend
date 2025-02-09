import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { apiError, apiUnauthorized } from '../utils/apiResponses';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

interface JwtPayload {
    id: string;
    name: string;
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            apiUnauthorized(res, 'Not authorized - No token');
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error(
                'JWT_SECRET is not defined in environment variables',
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        const user = await User.findOne({ id: decoded.id });

        if (!user) {
            apiUnauthorized(res, 'User not found');
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        apiUnauthorized(
            res,
            error instanceof Error ? error.message : 'Not authorized',
        );
    }
};

export const requireVerified = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    if (!req.user.verified) {
        apiError(res, 'Please verify your email first', 403);
        return;
    }
    next();
};

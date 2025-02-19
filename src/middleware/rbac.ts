import { NextFunction, Request, Response } from 'express';
import { apiError } from '../utils/apiResponses';

export enum UserRole {
    ADMIN = 'admin',
    STUDENT = 'student',
    ALUMNI = 'alumni',
}

const roleHierarchy: Record<UserRole, UserRole[]> = {
    [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.ALUMNI, UserRole.STUDENT],
    [UserRole.ALUMNI]: [UserRole.ALUMNI, UserRole.STUDENT],
    [UserRole.STUDENT]: [UserRole.STUDENT],
};

export const requireRole = (minimumRole: UserRole) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        if (!req.user?.role) {
            apiError(res, 'Role not found', 403);
            return;
        }

        const userRole = req.user.role as UserRole;
        const userPermissions = roleHierarchy[userRole] || [];

        if (!userPermissions.includes(minimumRole)) {
            apiError(res, 'Insufficient permissions', 403);
            return;
        }

        next();
    };
};

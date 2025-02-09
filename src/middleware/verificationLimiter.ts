import rateLimit from 'express-rate-limit';

export const verificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 6, // 6 attempts per hour
    message: 'Too many verification attempts. Please try again in an hour.',
    standardHeaders: true,
    legacyHeaders: false,
});

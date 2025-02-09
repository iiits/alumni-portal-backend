import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { connectDB } from './config/db';
import { verifyTransporter } from './config/email';
import routes from './routes';
import { morganMiddleware } from './utils/logger';

// Load env variables
dotenv.config();

const app: Application = express();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);
app.use(cookieParser());
app.use(express.json());

// Logging
app.use(morganMiddleware);

// Rate limiting
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
});
app.use('/api/', limiter);

// Mail service verification
verifyTransporter();

// Mount API routes
app.use('/api', routes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

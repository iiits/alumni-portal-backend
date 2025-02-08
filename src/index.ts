import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';
import { connectDB } from './config/db';

// Load env variables
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

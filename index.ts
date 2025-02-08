import dotenv from 'dotenv';
import express, { Application, Request, Response } from 'express';

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});

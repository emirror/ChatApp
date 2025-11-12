import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

export const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // Error handler
  app.use(errorHandler);

  return app;
};
export const bootstrap = async (): Promise<Application> => {
  await connectDatabase();
  return createApp();
};





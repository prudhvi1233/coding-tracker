import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { checkHealth, checkReady } from './controllers/healthController';

import activityRoutes from './routes/activity';
import snapshotRoutes from './routes/snapshot';
import analyticsRoutes from './routes/analytics';
import gitRoutes from './routes/git';
import goalsRoutes from './routes/goals';
import insightsRoutes from './routes/insights';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/device';
import accountRoutes from './routes/account';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Request ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
  next();
});

// Security Middleware
app.use(helmet());
app.use(hpp());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Reasonable for sync endpoints
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Need increased body size limit for source code snapshots
app.use(express.json({ limit: '5mb' }));

// Request Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info({
    message: 'Incoming Request',
    method: req.method,
    url: req.originalUrl,
    requestId: req.headers['x-request-id']
  });
  next();
});

// Health Checks
app.get('/health', checkHealth);
app.get('/health/ready', checkReady);

// Routes
app.use('/api', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', accountRoutes);
app.use('/api', activityRoutes);
app.use('/api', snapshotRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', gitRoutes);
app.use('/api', goalsRoutes);
app.use('/api', insightsRoutes);

// Error Handling (Must be last)
app.use(errorHandler);

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

const server = app.listen(Number(PORT), '0.0.0.0', async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`Connected to MongoDB Atlas`);
    logger.info(`Server running on 0.0.0.0:${PORT}`);
  } catch (error: any) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    logger.info('Closed out remaining connections.');
    mongoose.connection.close(false).then(() => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

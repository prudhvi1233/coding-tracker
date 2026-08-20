import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkHealth = (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ success: true });
};

export const checkReady = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ success: true, status: 'ready' });
  } else {
    res.status(503).json({ success: false, status: 'unavailable', error: 'Database connection is not ready' });
  }
};

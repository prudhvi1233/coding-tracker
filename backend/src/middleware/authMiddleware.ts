import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Device from '../models/Device';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      deviceId?: string;
    }
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  // If the token is a JWT (has periods), verify it
  if (token.includes('.')) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-dev-only') as { id: string };
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    }
  } else {
    // Treat as Device Token
    try {
      const deviceTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const device = await Device.findOne({ deviceTokenHash, revokedAt: null });
      
      if (!device) {
        res.status(401).json({ error: 'Unauthorized: Device token invalid or revoked' });
        return;
      }
      
      req.user = { id: device.userId.toString() };
      req.deviceId = device._id.toString();
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error during device authentication' });
    }
  }
};

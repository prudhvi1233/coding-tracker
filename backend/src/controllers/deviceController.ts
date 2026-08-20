import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Device from '../models/Device';

export const createDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { deviceName } = req.body;
    const userId = req.user?.id;
    
    if (!userId || !deviceName) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Generate a secure raw token (this is given to the user ONCE)
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hash it for DB storage
    const deviceTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const device = new Device({
      userId,
      deviceName,
      deviceTokenHash
    });

    await device.save();

    res.status(200).json({ success: true, rawToken });
  } catch (error: any) { next(error);
  }
};

export const getDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const devices = await Device.find({ userId, revokedAt: null });
    res.json(devices);
  } catch (error: any) { next(error);
  }
};

export const revokeDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    await Device.findOneAndUpdate({ _id: id, userId }, { revokedAt: new Date() });
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

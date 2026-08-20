import { Request, Response, NextFunction } from 'express';
import CodingActivity from '../models/CodingActivity';
import DailyActivity from '../models/DailyActivity';
import CodingSession from '../models/CodingSession';
import { calculateStreak } from '../services/streakService';

export const recordActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileName, language, projectName, totalLines, timestamp, eventId } = req.body;
    const userId = req.user?.id;

    if (!userId || !fileName || !language || !timestamp) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Idempotency check for offline sync
    if (eventId) {
      const existing = await CodingActivity.findOne({ eventId, userId });
      if (existing) {
        res.status(400).json({ error: "Bad Request" });
        return;
      }
    }

    // 1. Save the individual activity event
    const activity = new CodingActivity({
      userId,
      eventId, // Phase 8 idempotency key
      fileName,
      language,
      projectName,
      totalLines,
      timestamp: new Date(timestamp),
    });
    await activity.save();

    // 2. Update the DailyActivity atomically
    const dateStr = new Date(timestamp).toISOString().split('T')[0];

    const uniqueFiles = await CodingActivity.distinct('fileName', {
      userId,
      createdAt: {
        $gte: new Date(`${dateStr}T00:00:00.000Z`),
        $lte: new Date(`${dateStr}T23:59:59.999Z`),
      }
    });

    await DailyActivity.findOneAndUpdate(
      { userId, date: dateStr },
      { 
        $inc: { totalSaveEvents: 1 },
        $addToSet: { languages: language },
        $set: { filesEdited: uniqueFiles.length, active: true }
      },
      { upsert: true, new: true }
    );

    // 3. Phase 3: Session Detection
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const currentTime = new Date(timestamp);
    
    let session = await CodingSession.findOne({ userId, projectName }).sort({ lastActivityAt: -1 });

    if (session && (currentTime.getTime() - session.lastActivityAt.getTime()) <= SESSION_TIMEOUT_MS) {
      // Update existing session
      session.lastActivityAt = currentTime;
      session.saveEvents += 1;
      session.estimatedDurationMinutes = Math.round((session.lastActivityAt.getTime() - session.startedAt.getTime()) / 60000);
      
      if (!session.filesEdited.includes(fileName)) session.filesEdited.push(fileName);
      if (!session.languages.includes(language)) session.languages.push(language);
      
      await session.save();
    } else {
      // Close previous session if exists
      if (session && !session.endedAt) {
        session.endedAt = session.lastActivityAt;
        await session.save();
      }

      // Create new session
      session = new CodingSession({
        userId,
        projectName,
        startedAt: currentTime,
        lastActivityAt: currentTime,
        filesEdited: [fileName],
        languages: [language],
        saveEvents: 1,
        estimatedDurationMinutes: 0
      });
      await session.save();
    }

    res.status(200).json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const getTodayActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const daily = await DailyActivity.findOne({ userId, date: dateStr });

    if (!daily) {
      res.json({
        date: dateStr,
        filesEdited: 0,
        languages: [],
        totalSaveEvents: 0,
        active: false,
      });
      return;
    }

    res.json(daily);
  } catch (error: any) { next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const history = await DailyActivity.find({ userId }).sort({ date: -1 }).limit(30);
    res.json(history);
  } catch (error: any) { next(error);
  }
};

export const getStreak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const streakData = await calculateStreak(userId as string);
    res.json(streakData);
  } catch (error: any) { next(error);
  }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const recent = await CodingActivity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
      
    res.json(recent);
  } catch (error: any) { next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import CodingActivity from '../models/CodingActivity';
import CodeSnapshot from '../models/CodeSnapshot';
import DailyActivity from '../models/DailyActivity';
import CodingSession from '../models/CodingSession';
import { calculateStreak } from '../services/streakService';

export const recordActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileName, relativeFilePath, language, projectName, totalLines, timestamp, eventId } = req.body;
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
      eventId,
      fileName,
      relativeFilePath: relativeFilePath || fileName,
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

    // 3. Session Detection
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
    const currentTime = new Date(timestamp);
    
    let session = await CodingSession.findOne({ userId, projectName }).sort({ lastActivityAt: -1 });

    if (session && (currentTime.getTime() - session.lastActivityAt.getTime()) <= SESSION_TIMEOUT_MS) {
      session.lastActivityAt = currentTime;
      session.saveEvents += 1;
      session.estimatedDurationMinutes = Math.round((session.lastActivityAt.getTime() - session.startedAt.getTime()) / 60000);
      
      if (!session.filesEdited.includes(fileName)) session.filesEdited.push(fileName);
      if (!session.languages.includes(language)) session.languages.push(language);
      
      await session.save();
    } else {
      if (session && !session.endedAt) {
        session.endedAt = session.lastActivityAt;
        await session.save();
      }

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
  } catch (error: any) { 
    next(error);
  }
};

export const deleteFileActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectName, relativeFilePath, fileName } = req.body;

    if (!userId || !projectName || (!relativeFilePath && !fileName)) {
      res.status(400).json({ error: "Bad Request: Missing required file parameters" });
      return;
    }

    const targetFile = relativeFilePath || fileName;
    const fileBaseName = fileName || (relativeFilePath ? relativeFilePath.split(/[/\\]/).pop() : '');

    // 1. Find matching activities to identify affected dates for analytics re-calculation
    const activityQuery: any = { userId, projectName };
    if (relativeFilePath) {
      activityQuery.$or = [
        { relativeFilePath },
        { fileName: targetFile },
        { fileName: fileBaseName }
      ];
    } else {
      activityQuery.fileName = fileBaseName;
    }

    const matchingActivities = await CodingActivity.find(activityQuery);
    const affectedDates = Array.from(new Set(matchingActivities.map(a => a.timestamp.toISOString().split('T')[0])));

    // 2. Delete matching CodingActivity records
    const activityDeleteResult = await CodingActivity.deleteMany(activityQuery);

    // 3. Delete matching CodeSnapshot records
    const snapshotQuery: any = { userId, projectName };
    if (relativeFilePath) {
      snapshotQuery.$or = [
        { relativeFilePath },
        { fileName: targetFile },
        { fileName: fileBaseName }
      ];
    } else {
      snapshotQuery.fileName = fileBaseName;
    }
    const snapshotDeleteResult = await CodeSnapshot.deleteMany(snapshotQuery);

    // 4. Clean up CodingSession file references
    const cleanTargets = Array.from(new Set([relativeFilePath, fileName, fileBaseName].filter(Boolean)));
    await CodingSession.updateMany(
      { userId, projectName },
      { $pull: { filesEdited: { $in: cleanTargets } } }
    );

    // 5. Recalculate DailyActivity records for affected dates
    for (const dateStr of affectedDates) {
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

      const remainingActivities = await CodingActivity.find({
        userId,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      if (remainingActivities.length === 0) {
        await DailyActivity.deleteOne({ userId, date: dateStr });
      } else {
        const uniqueFiles = Array.from(new Set(remainingActivities.map(a => a.fileName)));
        const uniqueLanguages = Array.from(new Set(remainingActivities.map(a => a.language)));
        await DailyActivity.findOneAndUpdate(
          { userId, date: dateStr },
          {
            $set: {
              totalSaveEvents: remainingActivities.length,
              filesEdited: uniqueFiles.length,
              languages: uniqueLanguages
            }
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      deletedActivitiesCount: activityDeleteResult.deletedCount || 0,
      deletedSnapshotsCount: snapshotDeleteResult.deletedCount || 0
    });
  } catch (error: any) {
    next(error);
  }
};

export const renameFileActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { projectName, oldRelativeFilePath, oldFileName, newRelativeFilePath, newFileName } = req.body;

    if (!userId || !projectName || (!oldRelativeFilePath && !oldFileName) || (!newRelativeFilePath && !newFileName)) {
      res.status(400).json({ error: "Bad Request: Missing required rename parameters" });
      return;
    }

    const oldTarget = oldRelativeFilePath || oldFileName;
    const oldBase = oldFileName || (oldRelativeFilePath ? oldRelativeFilePath.split(/[/\\]/).pop() : '');
    const newPath = newRelativeFilePath || newFileName;
    const newBase = newFileName || (newRelativeFilePath ? newRelativeFilePath.split(/[/\\]/).pop() : '');

    // 1. Update CodeSnapshot records
    const snapshotQuery: any = { userId, projectName };
    if (oldRelativeFilePath) {
      snapshotQuery.$or = [
        { relativeFilePath: oldRelativeFilePath },
        { fileName: oldBase }
      ];
    } else {
      snapshotQuery.fileName = oldBase;
    }

    const snapshotUpdateResult = await CodeSnapshot.updateMany(
      snapshotQuery,
      {
        $set: {
          relativeFilePath: newPath,
          fileName: newBase
        }
      }
    );

    // 2. Update CodingActivity records
    const activityQuery: any = { userId, projectName };
    if (oldRelativeFilePath) {
      activityQuery.$or = [
        { relativeFilePath: oldRelativeFilePath },
        { fileName: oldBase }
      ];
    } else {
      activityQuery.fileName = oldBase;
    }

    const activityUpdateResult = await CodingActivity.updateMany(
      activityQuery,
      {
        $set: {
          relativeFilePath: newPath,
          fileName: newBase
        }
      }
    );

    // 3. Update CodingSession filesEdited references
    const sessions = await CodingSession.find({ userId, projectName });
    for (const session of sessions) {
      let modified = false;
      session.filesEdited = session.filesEdited.map(f => {
        if (f === oldTarget || f === oldBase || f === oldRelativeFilePath) {
          modified = true;
          return newBase;
        }
        return f;
      });
      if (modified) {
        await session.save();
      }
    }

    res.status(200).json({
      success: true,
      updatedSnapshotsCount: snapshotUpdateResult.modifiedCount || 0,
      updatedActivitiesCount: activityUpdateResult.modifiedCount || 0
    });
  } catch (error: any) {
    next(error);
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
  } catch (error: any) { 
    next(error);
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
  } catch (error: any) { 
    next(error);
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
  } catch (error: any) { 
    next(error);
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
  } catch (error: any) { 
    next(error);
  }
};

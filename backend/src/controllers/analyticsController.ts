import { Request, Response, NextFunction } from 'express';
import CodingActivity from '../models/CodingActivity';
import DailyActivity from '../models/DailyActivity';
import CodingSession from '../models/CodingSession';
import CodeSnapshot from '../models/CodeSnapshot';
import { calculateStreak } from '../services/streakService';

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const [streakData, totalSnapshots, totalSessions] = await Promise.all([
      calculateStreak(userId as string),
      CodeSnapshot.countDocuments({ userId }),
      CodingSession.aggregate([
        { $match: { userId } },
        { $group: {
          _id: null,
          totalEstimatedCodingMinutes: { $sum: '$estimatedDurationMinutes' },
          totalSaveEvents: { $sum: '$saveEvents' }
        }}
      ])
    ]);

    // Calculate total active days and total files edited
    const dailyStats = await DailyActivity.aggregate([
      { $match: { userId, active: true } },
      { $group: {
        _id: null,
        totalActiveDays: { $sum: 1 },
        totalFilesEdited: { $sum: '$filesEdited' } // Simple sum, not strictly distinct across all time but good enough for overview
      }}
    ]);

    const overview = {
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      totalActiveDays: dailyStats[0]?.totalActiveDays || 0,
      totalFilesEdited: dailyStats[0]?.totalFilesEdited || 0,
      totalSaveEvents: totalSessions[0]?.totalSaveEvents || 0,
      totalSnapshots,
      totalEstimatedCodingMinutes: totalSessions[0]?.totalEstimatedCodingMinutes || 0
    };

    res.json(overview);
  } catch (error: any) { next(error);
  }
};

export const getDailyAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Get daily activity
    const dailyActivities = await DailyActivity.find({ userId }).sort({ date: 1 });
    
    // Also we want estimated minutes per day. Since sessions might span days (rarely),
    // we'll group sessions by day of `startedAt`.
    const sessionStats = await CodingSession.aggregate([
      { $match: { userId } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
        estimatedCodingMinutes: { $sum: '$estimatedDurationMinutes' }
      }}
    ]);

    const sessionMap = new Map(sessionStats.map(s => [s._id, s.estimatedCodingMinutes]));

    const result = dailyActivities.map(d => ({
      date: d.date,
      filesEdited: d.filesEdited,
      saveEvents: d.totalSaveEvents,
      languages: d.languages,
      estimatedCodingMinutes: sessionMap.get(d.date) || 0
    }));

    res.json(result);
  } catch (error: any) { next(error);
  }
};

export const getLanguages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const languageStats = await CodingActivity.aggregate([
      { $match: { userId } },
      { $group: {
        _id: "$language",
        saveEvents: { $sum: 1 },
        filesEdited: { $addToSet: "$fileName" }
      }},
      { $project: {
        language: "$_id",
        saveEvents: 1,
        filesEdited: { $size: "$filesEdited" }
      }},
      { $sort: { saveEvents: -1 } }
    ]);

    const totalSaves = languageStats.reduce((sum, l) => sum + l.saveEvents, 0);
    const result = languageStats.map(l => ({
      ...l,
      percentage: totalSaves > 0 ? Math.round((l.saveEvents / totalSaves) * 100) : 0
    }));

    res.json(result);
  } catch (error: any) { next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const projectStats = await CodingSession.aggregate([
      { $match: { userId } },
      { $group: {
        _id: "$projectName",
        saveEvents: { $sum: "$saveEvents" },
        estimatedCodingMinutes: { $sum: "$estimatedDurationMinutes" },
        filesEditedArrays: { $push: "$filesEdited" }
      }},
      { $project: {
        projectName: "$_id",
        saveEvents: 1,
        estimatedCodingMinutes: 1,
        filesEdited: {
          $size: {
            $reduce: {
              input: "$filesEditedArrays",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] }
            }
          }
        }
      }},
      { $sort: { estimatedCodingMinutes: -1, saveEvents: -1 } }
    ]);

    res.json(projectStats);
  } catch (error: any) { next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const sessions = await CodingSession.find({ userId }).sort({ startedAt: -1 }).limit(50);
    res.json(sessions);
  } catch (error: any) { next(error);
  }
};

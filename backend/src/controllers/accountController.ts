import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import CodingActivity from '../models/CodingActivity';
import CodeSnapshot from '../models/CodeSnapshot';
import CodingSession from '../models/CodingSession';
import DailyActivity from '../models/DailyActivity';
import GitRepository from '../models/GitRepository';
import GitCommit from '../models/GitCommit';
import Goal from '../models/Goal';
import Challenge from '../models/Challenge';
import Achievement from '../models/Achievement';
import Insight from '../models/Insight';
import Device from '../models/Device';

export const exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const includeCodeSnapshots = req.body.includeCodeSnapshots === true;

    const [
      user, activities, sessions, daily,
      repos, commits, goals, challenges, 
      achievements, insights
    ] = await Promise.all([
      User.findById(userId).select('-passwordHash'),
      CodingActivity.find({ userId }),
      CodingSession.find({ userId }),
      DailyActivity.find({ userId }),
      GitRepository.find({ userId }),
      GitCommit.find({ userId }),
      Goal.find({ userId }),
      Challenge.find({ userId }),
      Achievement.find({ userId }),
      Insight.find({ userId }),
    ]);

    let snapshots = [];
    if (includeCodeSnapshots) {
      snapshots = await CodeSnapshot.find({ userId });
    } else {
      snapshots = await CodeSnapshot.find({ userId }).select('-code');
    }

    res.json({
      exportedAt: new Date(),
      user,
      activities,
      sessions,
      daily,
      repos,
      commits,
      goals,
      challenges,
      achievements,
      insights,
      snapshots
    });
  } catch (error: any) { next(error);
  }
};

export const deleteAccountData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { confirmation } = req.body;
    
    if (confirmation !== 'DELETE MY ACCOUNT') {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Wipe everything
    await Promise.all([
      User.findByIdAndDelete(userId),
      Device.deleteMany({ userId }),
      CodingActivity.deleteMany({ userId }),
      CodeSnapshot.deleteMany({ userId }),
      CodingSession.deleteMany({ userId }),
      DailyActivity.deleteMany({ userId }),
      GitRepository.deleteMany({ userId }),
      GitCommit.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Challenge.deleteMany({ userId }),
      Achievement.deleteMany({ userId }),
      Insight.deleteMany({ userId }),
    ]);

    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const migrateHistoricalData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const TEMPORARY_USER_ID = 'temporary-user-id';
    
    // Safety check: only do this if this is the FIRST registered user
    const userCount = await User.countDocuments();
    if (userCount > 1) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    // Transfer all ownership
    const transferOps = [
      CodingActivity.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      CodeSnapshot.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      CodingSession.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      DailyActivity.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      GitRepository.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      GitCommit.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      Goal.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      Challenge.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      Achievement.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
      Insight.updateMany({ userId: TEMPORARY_USER_ID }, { $set: { userId } }),
    ];

    await Promise.all(transferOps);

    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

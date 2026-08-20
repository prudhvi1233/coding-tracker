import { Request, Response, NextFunction } from 'express';
import Goal from '../models/Goal';
import Challenge from '../models/Challenge';
import Achievement from '../models/Achievement';
import { goalProgressService } from '../services/goalProgressService';
import { achievementService } from '../services/achievementService';

// =======================
// GOALS
// =======================

export const createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, goalType, targetValue, periodType, startDate, endDate, language, projectId, projectName } = req.body;
    const userId = req.user?.id;

    if (!userId || !title || !goalType || !targetValue || !periodType || !startDate || !endDate) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    if (goalType === 'language_days' && !language) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    if (targetValue <= 0) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const goal = new Goal({
      userId,
      title,
      description,
      goalType,
      targetValue,
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      language,
      projectId,
      projectName
    });

    await goal.save();
    res.status(200).json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const getGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, status } = req.query;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const query: any = { userId };
    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ endDate: 1 });
    
    // Evaluate progress dynamically before returning
    const evaluatedGoals = await Promise.all(goals.map(g => goalProgressService.evaluateGoal(g)));
    
    res.json(evaluatedGoals);
  } catch (error: any) { next(error);
  }
};

export const getGoalsSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const goals = await Goal.find({ userId });
    const evaluatedGoals = await Promise.all(goals.map(g => goalProgressService.evaluateGoal(g)));

    const active = evaluatedGoals.filter(g => g.status === 'active');
    const completed = evaluatedGoals.filter(g => g.status === 'completed');
    const expiringSoon = active.filter(g => {
      const daysLeft = (new Date(g.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 3;
    });

    res.json({
      active: active.length,
      completed: completed.length,
      expiringSoon: expiringSoon.length,
      completionRate: evaluatedGoals.length > 0 ? (completed.length / evaluatedGoals.length) * 100 : 0
    });
  } catch (error: any) { next(error);
  }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    await Goal.findOneAndDelete({ _id: id, userId });
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

// =======================
// CHALLENGES
// =======================

export const startChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { challengeType, title, description, targetValue, durationDays } = req.body;
    const userId = req.user?.id;
    
    if (!userId || !challengeType || !targetValue || !durationDays) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const challenge = new Challenge({
      userId,
      challengeType,
      title,
      description,
      targetValue,
      startDate,
      endDate
    });

    await challenge.save();
    res.status(200).json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const getChallenges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const challenges = await Challenge.find({ userId }).sort({ endDate: 1 });
    const evaluatedChallenges = await Promise.all(challenges.map(c => goalProgressService.evaluateChallenge(c)));
    
    res.json(evaluatedChallenges);
  } catch (error: any) { next(error);
  }
};

// =======================
// ACHIEVEMENTS
// =======================

const PREDEFINED_ACHIEVEMENTS = [
  { key: 'first_steps', title: 'First Steps', description: 'Make your first tracked file save.' },
  { key: 'getting_started', title: 'Getting Started', description: 'Code on 3 different days.' },
  { key: 'week_warrior', title: 'Week Warrior', description: 'Code 7 consecutive days.' },
  { key: 'month_warrior', title: 'Month Warrior', description: 'Code 30 consecutive days.' },
  { key: 'first_commit', title: 'First Commit', description: 'Track your first Git commit.' },
  { key: 'commit_machine', title: 'Commit Machine', description: 'Reach 100 tracked commits.' },
  { key: 'code_archivist', title: 'Code Archivist', description: 'Create 100 code snapshots.' },
  { key: 'ten_hour_developer', title: 'Ten Hour Developer', description: 'Reach 10 hours of estimated coding time.' },
  { key: 'hundred_hour_developer', title: 'Hundred Hour Developer', description: 'Reach 100 hours of estimated coding time.' },
  { key: 'polyglot', title: 'Polyglot', description: 'Use at least 5 programming languages.' },
  { key: 'project_explorer', title: 'Project Explorer', description: 'Work on at least 5 projects.' },
  { key: 'century_of_saves', title: 'Century of Saves', description: 'Reach 100 tracked file saves.' },
  { key: 'thousand_saves', title: 'Thousand Saves', description: 'Reach 1,000 tracked file saves.' }
];

export const getAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    const unlocked = await Achievement.find({ userId });
    const unlockedMap = new Map(unlocked.map(a => [a.achievementKey, a]));

    const allAchievements = PREDEFINED_ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: unlockedMap.has(ach.key),
      unlockedAt: unlockedMap.get(ach.key)?.unlockedAt || null
    }));

    res.json(allAchievements);
  } catch (error: any) { next(error);
  }
};

export const evaluateAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: "Bad Request" });
      return;
    }

    await achievementService.evaluateUser(userId);
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

export const dismissNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, type } = req.body;
    const userId = req.user?.id;
    if (type === 'goal') await Goal.findOneAndUpdate({ _id: id, userId }, { notified: true });
    if (type === 'challenge') await Challenge.findOneAndUpdate({ _id: id, userId }, { notified: true });
    if (type === 'achievement') await Achievement.findOneAndUpdate({ _id: id, userId }, { notified: true });
    res.json({ success: true });
  } catch (error: any) { next(error);
  }
};

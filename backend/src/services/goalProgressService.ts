import { calculateStreak } from './streakService';
import Goal, { IGoal } from '../models/Goal';
import Challenge, { IChallenge } from '../models/Challenge';
import CodingActivity from '../models/CodingActivity';
import CodingSession from '../models/CodingSession';
import CodeSnapshot from '../models/CodeSnapshot';
import GitCommit from '../models/GitCommit';
import DailyActivity from '../models/DailyActivity';

export class GoalProgressService {
  /**
   * Recalculates progress for a given goal dynamically based on source truth data.
   * Returns the updated goal object.
   */
  public async evaluateGoal(goal: IGoal): Promise<IGoal> {
    if (goal.status === 'completed' || goal.status === 'archived') {
      return goal;
    }

    const now = new Date();
    
    // Calculate new current value based on goal type
    let currentValue = 0;
    
    const query: any = {
      userId: goal.userId,
      timestamp: { $gte: goal.startDate, $lte: goal.endDate }
    };

    if (goal.projectId) query.projectId = goal.projectId;

    try {
      switch (goal.goalType) {
        case 'coding_days':
          // Count unique days with activity in the range
          const days = await DailyActivity.countDocuments({
            userId: goal.userId,
            date: { $gte: goal.startDate.toISOString().split('T')[0], $lte: goal.endDate.toISOString().split('T')[0] },
            totalDuration: { $gt: 0 }
          });
          currentValue = days;
          break;

        case 'coding_time':
          // Sum session durations (in hours)
          const sessions = await CodingSession.aggregate([
            { $match: { 
                userId: goal.userId, 
                startTime: { $gte: goal.startDate, $lte: goal.endDate } 
            } },
            { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
          ]);
          // Convert ms to hours
          currentValue = sessions.length > 0 ? (sessions[0].totalDuration / (1000 * 60 * 60)) : 0;
          break;

        case 'file_saves':
          currentValue = await CodingActivity.countDocuments(query);
          break;

        case 'snapshots':
          currentValue = await CodeSnapshot.countDocuments(query);
          break;

        case 'git_commits':
          currentValue = await GitCommit.countDocuments(query);
          break;

        case 'projects':
          const activeProjects = await CodingActivity.distinct('projectId', query);
          currentValue = activeProjects.length;
          break;

        case 'language_days':
          if (goal.language) {
            const langDays = await CodingActivity.aggregate([
              { $match: { ...query, language: goal.language } },
              { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } } } }
            ]);
            currentValue = langDays.length;
          }
          break;

        case 'streak':
          // Use current streak but accurately handle gaps
          const streakCalc = await calculateStreak(goal.userId as string);
          currentValue = streakCalc.currentStreak;
          break;
      }
    } catch (e) {
      console.error(`Error calculating goal progress for ${goal._id}:`, e);
    }

    goal.currentValue = currentValue;

    // Transition state
    if (goal.currentValue >= goal.targetValue && goal.status === 'active') {
      goal.status = 'completed';
      goal.completedAt = now;
    } else if (now > goal.endDate && goal.status === 'active') {
      goal.status = 'expired';
    }

    await goal.save();
    return goal;
  }

  /**
   * Recalculates progress for a challenge dynamically.
   */
  public async evaluateChallenge(challenge: IChallenge): Promise<IChallenge> {
    if (challenge.status === 'completed' || challenge.status === 'failed') {
      return challenge;
    }

    const now = new Date();
    let currentValue = 0;

    const query = {
      userId: challenge.userId,
      timestamp: { $gte: challenge.startDate, $lte: challenge.endDate }
    };

    try {
      if (challenge.challengeType.includes('coding_challenge') || challenge.challengeType === 'weekend_coder') {
        const days = await DailyActivity.countDocuments({
          userId: challenge.userId,
          date: { $gte: challenge.startDate.toISOString().split('T')[0], $lte: challenge.endDate.toISOString().split('T')[0] },
          totalDuration: { $gt: 0 }
        });
        currentValue = days;
      } 
      else if (challenge.challengeType === 'weekly_save_challenge') {
        currentValue = await CodingActivity.countDocuments(query);
      } 
      else if (challenge.challengeType === 'weekly_commit_challenge') {
        currentValue = await GitCommit.countDocuments(query);
      } 
      else if (challenge.challengeType === 'monthly_coding_time') {
        const sessions = await CodingSession.aggregate([
          { $match: { userId: challenge.userId, startTime: { $gte: challenge.startDate, $lte: challenge.endDate } } },
          { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
        ]);
        currentValue = sessions.length > 0 ? (sessions[0].totalDuration / (1000 * 60 * 60)) : 0;
      }
    } catch (e) {
      console.error(`Error calculating challenge progress for ${challenge._id}:`, e);
    }

    challenge.currentValue = currentValue;

    if (challenge.currentValue >= challenge.targetValue && challenge.status === 'active') {
      challenge.status = 'completed';
      challenge.completedAt = now;
    } else if (now > challenge.endDate && challenge.status === 'active') {
      challenge.status = 'expired';
    }

    await challenge.save();
    return challenge;
  }
}

export const goalProgressService = new GoalProgressService();

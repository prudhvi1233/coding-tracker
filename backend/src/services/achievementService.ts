import Achievement from '../models/Achievement';
import CodingActivity from '../models/CodingActivity';
import CodingSession from '../models/CodingSession';
import CodeSnapshot from '../models/CodeSnapshot';
import GitCommit from '../models/GitCommit';
import DailyActivity from '../models/DailyActivity';
import GitRepository from '../models/GitRepository';
import { calculateStreak } from './streakService';

export class AchievementService {
  
  /**
   * Safely attempts to unlock an achievement. Uses MongoDB's unique index to prevent duplicates.
   */
  private async unlockAchievement(userId: string, key: string, title: string, description: string) {
    try {
      const achievement = new Achievement({
        userId,
        achievementKey: key,
        title,
        description,
        unlockedAt: new Date()
      });
      await achievement.save();
      console.log(`Achievement unlocked for ${userId}: ${title}`);
    } catch (err: any) {
      if (err.code !== 11000) {
        console.error(`Error unlocking achievement ${key}:`, err);
      }
    }
  }

  /**
   * Evaluates all historical data for a user and unlocks any eligible achievements.
   * This is idempotent.
   */
  public async evaluateUser(userId: string) {
    try {
      // 1. First Steps: Tracked file save
      const saveCount = await CodingActivity.countDocuments({ userId });
      if (saveCount >= 1) await this.unlockAchievement(userId, 'first_steps', 'First Steps', 'Make your first tracked file save.');
      if (saveCount >= 100) await this.unlockAchievement(userId, 'century_of_saves', 'Century of Saves', 'Reach 100 tracked file saves.');
      if (saveCount >= 1000) await this.unlockAchievement(userId, 'thousand_saves', 'Thousand Saves', 'Reach 1,000 tracked file saves.');

      // 2. Snapshots
      const snapshotCount = await CodeSnapshot.countDocuments({ userId });
      if (snapshotCount >= 100) await this.unlockAchievement(userId, 'code_archivist', 'Code Archivist', 'Create 100 code snapshots.');

      // 3. Git Commits
      const commitCount = await GitCommit.countDocuments({ userId });
      if (commitCount >= 1) await this.unlockAchievement(userId, 'first_commit', 'First Commit', 'Track your first Git commit.');
      if (commitCount >= 100) await this.unlockAchievement(userId, 'commit_machine', 'Commit Machine', 'Reach 100 tracked commits.');

      // 4. Projects
      const projectCount = (await CodingActivity.distinct('projectId', { userId })).length;
      if (projectCount >= 5) await this.unlockAchievement(userId, 'project_explorer', 'Project Explorer', 'Work on at least 5 projects.');

      // 5. Languages
      const languageCount = (await CodingActivity.distinct('language', { userId })).length;
      if (languageCount >= 5) await this.unlockAchievement(userId, 'polyglot', 'Polyglot', 'Use at least 5 programming languages.');

      // 6. Days & Streaks
      const activeDays = await DailyActivity.countDocuments({ userId, totalDuration: { $gt: 0 } });
      if (activeDays >= 3) await this.unlockAchievement(userId, 'getting_started', 'Getting Started', 'Code on 3 different days.');
      
      const streakCalc = await calculateStreak(userId);
      const highestStreak = streakCalc.longestStreak;
      
      if (highestStreak >= 7) await this.unlockAchievement(userId, 'week_warrior', 'Week Warrior', 'Code 7 consecutive days.');
      if (highestStreak >= 30) await this.unlockAchievement(userId, 'month_warrior', 'Month Warrior', 'Code 30 consecutive days.');

      // 7. Coding Time
      const sessions = await CodingSession.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
      ]);
      const hours = sessions.length > 0 ? (sessions[0].totalDuration / (1000 * 60 * 60)) : 0;
      
      if (hours >= 10) await this.unlockAchievement(userId, 'ten_hour_developer', 'Ten Hour Developer', 'Reach 10 hours of estimated coding time.');
      if (hours >= 100) await this.unlockAchievement(userId, 'hundred_hour_developer', 'Hundred Hour Developer', 'Reach 100 hours of estimated coding time.');

    } catch (e) {
      console.error(`Error evaluating achievements for user ${userId}:`, e);
    }
  }
}

export const achievementService = new AchievementService();

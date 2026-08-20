import { calculateStreak } from './streakService';
import DailyActivity from '../models/DailyActivity';
import CodingSession from '../models/CodingSession';
import CodingActivity from '../models/CodingActivity';
import GitCommit from '../models/GitCommit';
import Goal from '../models/Goal';
import { goalProgressService } from './goalProgressService';

export class InsightsAnalyticsService {
  
  public async getAnalyticsPayload(userId: string) {
    const payload: any = {};
    const now = new Date();
    
    // 1. Productivity
    const recentSessions = await CodingSession.find({ 
      userId, 
      startTime: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
    });
    
    let totalMs = 0;
    const dayCounts: Record<number, number> = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    recentSessions.forEach(s => {
      totalMs += s.estimatedDurationMinutes;
      dayCounts[s.startedAt.getDay()]++;
    });
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let mostProductiveDay = 'Unknown';
    let max = -1;
    for (const [dayStr, count] of Object.entries(dayCounts)) {
      if (count > max && count > 0) {
        max = count;
        mostProductiveDay = days[parseInt(dayStr)];
      }
    }
    
    const averageSessionMinutes = recentSessions.length ? Math.round((totalMs / recentSessions.length) / 60000) : 0;

    payload.productivity = {
      mostProductiveDay,
      averageSessionMinutes,
      totalHoursThisWeek: Math.round(totalMs / (1000 * 60 * 60)),
      consistencyScore: recentSessions.length > 10 ? 'High' : 'Low'
    };

    // 2. Streak
    const streakCalc = await calculateStreak(userId as string);
    payload.streak = {
      currentStreak: streakCalc.currentStreak,
      longestStreak: streakCalc.longestStreak,
      daysToRecord: Math.max(0, streakCalc.longestStreak - streakCalc.currentStreak)
    };

    // 3. Language
    const recentActivity = await CodingActivity.find({ 
      userId, 
      timestamp: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } 
    });
    
    const langCounts: Record<string, number> = {};
    const projCounts: Record<string, number> = {};
    
    recentActivity.forEach(a => {
      if (a.language) langCounts[a.language] = (langCounts[a.language] || 0) + 1;
      if (a.projectName) projCounts[a.projectName] = (projCounts[a.projectName] || 0) + 1;
    });

    const sortedLangs = Object.entries(langCounts).sort((a,b) => b[1]-a[1]);
    if (sortedLangs.length > 0) {
      payload.language = {
        topLanguage: sortedLangs[0][0],
        languageChanges: { [sortedLangs[0][0]]: 'Highly Active' }
      };
    }

    // 4. Project
    const totalActs = recentActivity.length;
    const projectDist: Record<string, number> = {};
    for (const [p, count] of Object.entries(projCounts)) {
      projectDist[p] = Math.round((count / totalActs) * 100);
    }
    payload.project = {
      totalActiveProjects: Object.keys(projCounts).length,
      distribution: projectDist
    };

    // 5. Git
    const recentCommits = await GitCommit.find({
      userId,
      timestamp: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });
    let insertions = 0;
    let deletions = 0;
    recentCommits.forEach(c => {
      insertions += c.insertions;
      deletions += c.deletions;
    });
    payload.git = {
      monthlyCommits: recentCommits.length,
      trendPercentage: recentCommits.length > 10 ? '+15%' : '0%', // Mocked trend
      insertions,
      deletions
    };

    // 6. Goals
    const goals = await Goal.find({ userId, status: 'active' });
    const evalGoals = await Promise.all(goals.map(g => goalProgressService.evaluateGoal(g)));
    const activeCount = evalGoals.filter(g => g.status === 'active').length;
    const nearing = evalGoals.filter(g => g.status === 'active' && (g.currentValue / g.targetValue) > 0.8).length;
    
    payload.goals = {
      activeCount,
      nearingCompletion: nearing,
      expiringSoon: evalGoals.filter(g => {
        const d = (new Date(g.endDate).getTime() - now.getTime()) / (1000*60*60*24);
        return d > 0 && d <= 2;
      }).length
    };

    return payload;
  }
}

export const insightsAnalyticsService = new InsightsAnalyticsService();

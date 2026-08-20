import { IAIProvider, InsightOutput } from './IAIProvider';

export class MockAIProvider implements IAIProvider {
  public async generateInsights(payload: any): Promise<InsightOutput[]> {
    const insights: InsightOutput[] = [];

    // 1. Productivity (Coding Consistency)
    if (payload.productivity && payload.productivity.consistencyScore) {
      // Calculate confidence based on whether they have a lot of hours
      const conf = payload.productivity.totalHoursThisWeek > 5 ? 95 : 60;
      
      if (conf > 80) {
        insights.push({
          category: 'productivity',
          title: 'Consistent Routine',
          message: `Over the last 30 days, ${payload.productivity.mostProductiveDay} has consistently been your most active coding day. Your average session lasts ${payload.productivity.averageSessionMinutes} minutes.`,
          severity: 'success',
          importance: 'high',
          confidence: conf
        });
      } else {
        insights.push({
          category: 'productivity',
          title: 'Emerging Pattern',
          message: `Early data suggests ${payload.productivity.mostProductiveDay} may be one of your more active days. Keep coding to build a reliable pattern.`,
          severity: 'info',
          importance: 'low',
          confidence: conf
        });
      }
    }

    // 2. Streak
    if (payload.streak && payload.streak.currentStreak > 0) {
      const conf = Math.min(100, payload.streak.currentStreak * 10);
      if (payload.streak.daysToRecord === 0) {
        insights.push({
          category: 'streak',
          title: 'Record Breaker!',
          message: `You are currently on your longest streak ever of ${payload.streak.currentStreak} days!`,
          severity: 'success',
          importance: 'high',
          confidence: conf
        });
      } else {
        insights.push({
          category: 'streak',
          title: 'Streak Momentum',
          message: `You are on a ${payload.streak.currentStreak}-day streak. Just ${payload.streak.daysToRecord} more days to beat your record!`,
          severity: 'info',
          importance: 'medium',
          confidence: conf
        });
      }
    }

    // 3. Language
    if (payload.language && payload.language.topLanguage) {
      insights.push({
        category: 'language',
        title: 'Language Focus',
        message: `${payload.language.topLanguage} is your most active language this week.`,
        severity: 'info',
        importance: 'low',
        confidence: 85
      });
    }

    // 4. Git
    if (payload.git && payload.git.monthlyCommits > 0) {
      const conf = Math.min(100, payload.git.monthlyCommits * 5);
      insights.push({
        category: 'git',
        title: 'Git Activity',
        message: `You made ${payload.git.monthlyCommits} commits this month with a total of ${payload.git.insertions} lines added.`,
        severity: 'info',
        importance: 'medium',
        confidence: conf
      });
    }
    
    // 5. Goals Recommendation
    if (payload.goals && payload.goals.activeCount > 0) {
      insights.push({
        category: 'recommendation',
        title: 'Goal Progress',
        message: `You have ${payload.goals.nearingCompletion} goals nearing completion. Focus on those today to secure your achievements!`,
        severity: 'info',
        importance: 'medium',
        confidence: 90
      });
    }

    return insights;
  }
}

export class PrivacyService {
  /**
   * Sanitizes the payload before sending to any external AI provider.
   * Strips all potential PII, paths, and replaces project names with generic placeholders
   * unless explicitly permitted.
   */
  public sanitizeInsightPayload(data: any, shareProjectNames: boolean = false): any {
    const sanitized: any = {};
    let projectCounter = 1;
    const projectMap = new Map<string, string>();

    // We only explicitly copy over fields we know are safe aggregated numbers/categories.
    if (data.productivity) {
      sanitized.productivity = {
        mostProductiveDay: data.productivity.mostProductiveDay,
        averageSessionMinutes: data.productivity.averageSessionMinutes,
        totalHoursThisWeek: data.productivity.totalHoursThisWeek,
        consistencyScore: data.productivity.consistencyScore
      };
    }

    if (data.streak) {
      sanitized.streak = {
        currentStreak: data.streak.currentStreak,
        longestStreak: data.streak.longestStreak,
        daysToRecord: data.streak.daysToRecord
      };
    }

    if (data.language) {
      sanitized.language = {
        topLanguage: data.language.topLanguage,
        languageChanges: data.language.languageChanges // Assumed to be { 'TypeScript': '+15%' } etc.
      };
    }

    if (data.project) {
      sanitized.project = {
        totalActiveProjects: data.project.totalActiveProjects,
        distribution: {} as Record<string, number>
      };

      if (data.project.distribution) {
        for (const [projName, percentage] of Object.entries(data.project.distribution)) {
          if (shareProjectNames) {
            sanitized.project.distribution[projName] = percentage;
          } else {
            if (!projectMap.has(projName)) {
              projectMap.set(projName, `Project ${String.fromCharCode(64 + projectCounter)}`);
              projectCounter++;
            }
            const safeName = projectMap.get(projName) || 'Unknown Project';
            sanitized.project.distribution[safeName] = percentage;
          }
        }
      }
    }

    if (data.git) {
      sanitized.git = {
        monthlyCommits: data.git.monthlyCommits,
        trendPercentage: data.git.trendPercentage,
        insertions: data.git.insertions,
        deletions: data.git.deletions
      };
    }

    if (data.goals) {
      sanitized.goals = {
        activeCount: data.goals.activeCount,
        nearingCompletion: data.goals.nearingCompletion,
        expiringSoon: data.goals.expiringSoon
      };
    }

    return sanitized;
  }
}

export const privacyService = new PrivacyService();

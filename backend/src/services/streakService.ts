import DailyActivity from '../models/DailyActivity';

export const calculateStreak = async (userId: string) => {
  // Get all active days sorted by date descending
  const activeDays = await DailyActivity.find({ userId, active: true })
    .sort({ date: -1 })
    .exec();

  if (activeDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let currentRun = 0;
  let previousDate: Date | null = null;
  
  // Calculate today's date in local YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const lastActiveDate = activeDays[0].date;

  // We need to iterate from oldest to newest to calculate streaks correctly
  // Or newest to oldest. Let's do oldest to newest for easier longest streak calc.
  const activeDaysAsc = [...activeDays].reverse();
  
  let streak = 0;
  let maxStreak = 0;
  let prevDate: Date | null = null;

  for (const day of activeDaysAsc) {
    const currentDate = new Date(day.date);
    
    if (!prevDate) {
      streak = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        streak = 1;
      }
    }
    
    if (streak > maxStreak) {
      maxStreak = streak;
    }
    
    prevDate = currentDate;
  }

  // Calculate if the current streak is still active
  // It's active if the last active date is today or yesterday
  let isStreakActive = false;
  if (prevDate) {
    const todayDate = new Date(today);
    const diffTime = Math.abs(todayDate.getTime() - prevDate.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      isStreakActive = true;
    }
  }

  return {
    currentStreak: isStreakActive ? streak : 0,
    longestStreak: maxStreak,
    lastActiveDate: lastActiveDate,
  };
};

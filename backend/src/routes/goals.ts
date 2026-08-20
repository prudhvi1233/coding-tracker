import { Router } from 'express';
import { 
  createGoal, getGoals, getGoalsSummary, deleteGoal,
  startChallenge, getChallenges,
  getAchievements, evaluateAchievements, dismissNotifications
} from '../controllers/goalsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Goals
router.post('/goals', authenticateUser, createGoal);
router.get('/goals', authenticateUser, getGoals);
router.get('/goals/summary', authenticateUser, getGoalsSummary);
router.delete('/goals/:id', authenticateUser, deleteGoal);

// Challenges
router.post('/challenges', authenticateUser, startChallenge);
router.get('/challenges', authenticateUser, getChallenges);

// Achievements
router.get('/achievements', authenticateUser, getAchievements);
router.post('/achievements/evaluate', authenticateUser, evaluateAchievements);
router.post('/notifications/dismiss', authenticateUser, dismissNotifications);

export default router;

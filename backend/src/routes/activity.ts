import { Router } from 'express';
import { recordActivity, getTodayActivity, getHistory, getStreak, getRecentActivity } from '../controllers/activityController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/activity', authenticateUser, recordActivity);
router.get('/activity/today', authenticateUser, getTodayActivity);
router.get('/activity/history', authenticateUser, getHistory);
router.get('/activity/streak', authenticateUser, getStreak);
router.get('/activity/recent', authenticateUser, getRecentActivity);

export default router;

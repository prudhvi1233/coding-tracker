import { Router } from 'express';
import { 
  recordActivity, 
  getTodayActivity, 
  getHistory, 
  getStreak, 
  getRecentActivity,
  deleteFileActivity,
  renameFileActivity
} from '../controllers/activityController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/activity', authenticateUser, recordActivity);
router.post('/activity/delete-file', authenticateUser, deleteFileActivity);
router.post('/activity/rename', authenticateUser, renameFileActivity);

router.get('/activity/today', authenticateUser, getTodayActivity);
router.get('/activity/history', authenticateUser, getHistory);
router.get('/activity/streak', authenticateUser, getStreak);
router.get('/activity/recent', authenticateUser, getRecentActivity);

export default router;

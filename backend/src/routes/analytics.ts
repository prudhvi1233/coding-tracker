import { Router } from 'express';
import { getOverview, getDailyAnalytics, getLanguages, getProjects, getSessions } from '../controllers/analyticsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.get('/analytics/overview', authenticateUser, getOverview);
router.get('/analytics/daily', authenticateUser, getDailyAnalytics);
router.get('/analytics/languages', authenticateUser, getLanguages);
router.get('/analytics/projects', authenticateUser, getProjects);
router.get('/sessions', authenticateUser, getSessions);

export default router;

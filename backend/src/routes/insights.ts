import { Router } from 'express';
import { 
  getInsights, 
  getInsightsSummary, 
  refreshInsights, 
  dismissInsight, 
  submitFeedback 
} from '../controllers/insightsController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.get('/insights', authenticateUser, getInsights);
router.get('/insights/summary', authenticateUser, getInsightsSummary);
router.post('/insights/refresh', authenticateUser, refreshInsights);
router.post('/insights/:id/dismiss', authenticateUser, dismissInsight);
router.post('/insights/:id/feedback', authenticateUser, submitFeedback);

export default router;

import { Router } from 'express';
import { syncGitData, getRepositories, getRepositoryDetails, getCommits, getOverview, getActivity } from '../controllers/gitController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/git/sync', authenticateUser, syncGitData);
router.get('/git/repositories', authenticateUser, getRepositories);
router.get('/git/repositories/:id', authenticateUser, getRepositoryDetails);
router.get('/git/repositories/:id/commits', authenticateUser, getCommits);
router.get('/git/analytics/overview', authenticateUser, getOverview);
router.get('/git/analytics/activity', authenticateUser, getActivity);

export default router;

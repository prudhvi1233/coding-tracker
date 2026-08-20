import { Router } from 'express';
import { saveSnapshot, getProjects, getProjectFiles, getSnapshotsList, getSnapshotById } from '../controllers/snapshotController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/snapshots', authenticateUser, saveSnapshot);
router.get('/projects', authenticateUser, getProjects);
router.get('/projects/:projectName/files', authenticateUser, getProjectFiles);
router.get('/snapshots', authenticateUser, getSnapshotsList);
router.get('/snapshots/:snapshotId', authenticateUser, getSnapshotById);

export default router;

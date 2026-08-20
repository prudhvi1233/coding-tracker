import { Router } from 'express';
import { exportData, deleteAccountData, migrateHistoricalData } from '../controllers/accountController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/account/export', authenticateUser, exportData);
router.post('/account/delete', authenticateUser, deleteAccountData);
router.post('/account/migrate', authenticateUser, migrateHistoricalData);

export default router;

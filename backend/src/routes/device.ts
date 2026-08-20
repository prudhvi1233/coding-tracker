import { Router } from 'express';
import { createDevice, getDevices, revokeDevice } from '../controllers/deviceController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/devices', authenticateUser, createDevice);
router.get('/devices', authenticateUser, getDevices);
router.post('/devices/:id/revoke', authenticateUser, revokeDevice);

export default router;

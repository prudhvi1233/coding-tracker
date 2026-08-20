import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticateUser, getMe);

export default router;

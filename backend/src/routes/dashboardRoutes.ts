import { Router } from 'express';
import { getStats, getRecent } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/stats', getStats);
router.get('/recent', getRecent);

export default router;

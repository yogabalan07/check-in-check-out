import { Router } from 'express';
import { getStats, getRecent } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/recent', getRecent);

export default router;

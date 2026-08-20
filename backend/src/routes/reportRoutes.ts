import { Router } from 'express';
import { getAttendanceReport, getCurrentlyInside } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/attendance', getAttendanceReport);
router.get('/currently-inside', getCurrentlyInside);

export default router;

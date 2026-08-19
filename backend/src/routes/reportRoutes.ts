import { Router } from 'express';
import { getAttendanceReport, getCurrentlyInside } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/attendance', getAttendanceReport);
router.get('/currently-inside', getCurrentlyInside);

export default router;

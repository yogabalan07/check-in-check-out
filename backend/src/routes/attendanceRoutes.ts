import { Router } from 'express';
import { checkIn, checkOut, getAttendances, getAttendanceById } from '../controllers/attendanceController';
import { authenticate } from '../middleware/auth';
import { publicAttendanceLimiter, adminLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { checkInSchema, checkOutSchema } from '../validators';

const router = Router();

// Public routes
router.post('/check-in', publicAttendanceLimiter, validate(checkInSchema), checkIn);
router.post('/check-out', publicAttendanceLimiter, validate(checkOutSchema), checkOut);

// Protected routes
router.use(authenticate);
router.use(adminLimiter);

router.get('/', getAttendances);
router.get('/:id', getAttendanceById);

export default router;

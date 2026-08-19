import { Router } from 'express';
import { checkIn, checkOut, getAttendances, getAttendanceById } from '../controllers/attendanceController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkInSchema, checkOutSchema } from '../validators';

const router = Router();

// Public routes
router.post('/check-in', validate(checkInSchema), checkIn);
router.post('/check-out', validate(checkOutSchema), checkOut);

// Protected routes
router.get('/', authenticate, getAttendances);
router.get('/:id', authenticate, getAttendanceById);

export default router;

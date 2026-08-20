import { Router } from 'express';
import { generateQR } from '../controllers/qrController';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/generate', generateQR);

export default router;

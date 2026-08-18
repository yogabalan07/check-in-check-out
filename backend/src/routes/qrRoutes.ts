import { Router } from 'express';
import { generateQR } from '../controllers/qrController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/generate', generateQR);

export default router;

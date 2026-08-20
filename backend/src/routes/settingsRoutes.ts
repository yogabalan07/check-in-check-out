import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { adminLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../validators';

const router = Router();

router.use(authenticate);
router.use(adminLimiter);

router.get('/', getSettings);
router.put('/', validate(settingsSchema), updateSettings);

export default router;
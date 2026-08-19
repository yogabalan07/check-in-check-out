import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/', validate(settingsSchema), updateSettings);

export default router;
import { Router } from 'express';
import {
  createHall,
  getHalls,
  getHallById,
  updateHall,
  deleteHall,
} from '../controllers/hallController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { hallSchema } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/', getHalls);
router.get('/:id', getHallById);
router.post('/', validate(hallSchema), createHall);
router.put('/:id', validate(hallSchema), updateHall);
router.delete('/:id', deleteHall);

export default router;

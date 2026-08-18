import { Router } from 'express';
import multer from 'multer';
import {
  createParticipant,
  getParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant,
  importParticipants,
} from '../controllers/participantController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { participantSchema, participantUpdateSchema } from '../validators';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', getParticipants);
router.get('/:id', getParticipantById);
router.post('/', validate(participantSchema), createParticipant);
router.put('/:id', validate(participantUpdateSchema), updateParticipant);
router.delete('/:id', deleteParticipant);
router.post('/import', upload.single('file'), importParticipants);

export default router;

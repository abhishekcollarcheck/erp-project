import { Router } from 'express';
import { religionController } from './religion.controller';

const router = Router();

router.get('/', religionController.getAll);
router.post('/', religionController.createReligion);
router.put('/:id', religionController.updateReligion);
router.delete('/:id', religionController.deleteReligion);

export default router;
import { Router } from 'express';
import { bloodGroupController } from './blood-group.controller';

const router = Router();

router.get('/', bloodGroupController.getAll);
router.post('/', bloodGroupController.createBloodGroup);
router.put('/:id', bloodGroupController.updateBloodGroup);
router.delete('/:id', bloodGroupController.deleteBloodGroup);

export default router;
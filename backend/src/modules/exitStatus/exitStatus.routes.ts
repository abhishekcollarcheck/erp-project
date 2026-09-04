import { Router } from 'express';
import { exitStatusController } from './exitStatus.controller';

const router = Router();

router.get('/', exitStatusController.getAll);
router.get('/:id', exitStatusController.getById);
router.post('/', exitStatusController.create);
router.put('/reorder', exitStatusController.updateOrder);
router.put('/:id', exitStatusController.update);
router.delete('/:id', exitStatusController.delete);

export default router;
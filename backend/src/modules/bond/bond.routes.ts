import { Router } from 'express';
import { bondController } from './bond.controller';

const router = Router();

router.get('/', bondController.getAll);
router.get('/:id', bondController.getById);
router.post('/', bondController.create);
router.put('/reorder', bondController.updateOrder);
router.put('/:id', bondController.update);
router.delete('/:id', bondController.delete);

export default router;
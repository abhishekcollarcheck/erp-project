import { Router } from 'express';
import { probationController } from './probation.controller';

const router = Router();

router.get('/:type(periods|statuses)', probationController.getAll);
router.get('/:type(periods|statuses)/:id', probationController.getById);
router.post('/:type(periods|statuses)', probationController.create);
router.put('/:type(periods|statuses)/reorder', probationController.updateOrder);
router.put('/:type(periods|statuses)/:id', probationController.update);
router.delete('/:type(periods|statuses)/:id', probationController.delete);

export default router;
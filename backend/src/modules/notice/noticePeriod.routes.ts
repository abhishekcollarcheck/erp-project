import { Router } from 'express';
import { noticePeriodController } from './noticePeriod.controller';

const router = Router();

router.get('/', noticePeriodController.getAll);
router.get('/:id', noticePeriodController.getById);
router.post('/', noticePeriodController.create);
router.put('/reorder', noticePeriodController.updateOrder);
router.put('/:id', noticePeriodController.update);
router.delete('/:id', noticePeriodController.delete);

export default router;
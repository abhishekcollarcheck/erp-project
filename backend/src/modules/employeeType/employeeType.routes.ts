import { Router } from 'express';
import { employeeTypeController } from './employeeType.controller';

const router = Router();

router.get('/', employeeTypeController.getAll);
router.get('/:id', employeeTypeController.getById);
router.post('/', employeeTypeController.create);
router.put('/reorder', employeeTypeController.updateOrder);
router.put('/:id', employeeTypeController.update);
router.delete('/:id', employeeTypeController.delete);

export default router;
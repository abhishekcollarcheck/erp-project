import { Router } from 'express';
import { employeeStatusController } from './employeeStatus.controller';

const router = Router();

router.get('/', employeeStatusController.getAll);
router.get('/:id', employeeStatusController.getById);
router.post('/', employeeStatusController.create);
router.put('/reorder', employeeStatusController.updateOrder);
router.put('/:id', employeeStatusController.update);
router.delete('/:id', employeeStatusController.delete);

export default router;
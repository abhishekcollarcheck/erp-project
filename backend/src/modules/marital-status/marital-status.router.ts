import { Router } from 'express';
import { maritalStatusController } from './marital-status.controller';

const router = Router();

router.get('/', maritalStatusController.getAll);
router.post('/', maritalStatusController.createMaritalStatus);
router.put('/:id', maritalStatusController.updateMaritalStatus);
router.delete('/:id', maritalStatusController.deleteMaritalStatus);

export default router;
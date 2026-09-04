import { Router } from 'express';
import { salutationController } from './salutation.controller';

const router = Router();

router.get('/', salutationController.getAll);
router.post('/', salutationController.createSalutation);
router.put('/:id', salutationController.updateSalutation);
router.delete('/:id', salutationController.deleteSalutation);

export default router;
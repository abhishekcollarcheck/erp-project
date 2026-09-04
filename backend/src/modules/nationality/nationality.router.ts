import { Router } from 'express';
import { nationalityController } from './nationality.controller';

const router = Router();

router.get('/', nationalityController.getAll);
router.post('/', nationalityController.createNationality);
router.put('/:id', nationalityController.updateNationality);
router.delete('/:id', nationalityController.deleteNationality);

export default router;
import { Router } from 'express';
import { genderController } from './gender.controller';

const router = Router();

router.get('/', genderController.getAll);
router.post('/', genderController.createGender);
router.put('/:id', genderController.updateGender);
router.delete('/:id', genderController.deleteGender);

export default router;
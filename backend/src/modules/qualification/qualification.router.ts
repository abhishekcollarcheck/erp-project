import { Router } from 'express';
import { qualificationController } from './qualification.controller';

const router = Router();

router.get('/', qualificationController.getAll);
router.post('/', qualificationController.createQualification);
router.put('/:id', qualificationController.updateQualification);
router.delete('/:id', qualificationController.deleteQualification);

export default router;
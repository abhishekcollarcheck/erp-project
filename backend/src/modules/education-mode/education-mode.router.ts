import { Router } from 'express';
import { educationModeController } from './education-mode.controller';

const router = Router();

router.get('/', educationModeController.getAll);
router.post('/', educationModeController.createEducationMode);
router.put('/:id', educationModeController.updateEducationMode);
router.delete('/:id', educationModeController.deleteEducationMode);

export default router;
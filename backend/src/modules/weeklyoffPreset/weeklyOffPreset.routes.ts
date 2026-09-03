import { Router } from 'express';
import { weeklyOffPresetController } from './weeklyOffPreset.controller';

const router = Router();

router.get('/', weeklyOffPresetController.getAll);
router.get('/:id', weeklyOffPresetController.getById);
router.post('/', weeklyOffPresetController.create);
router.put('/:id', weeklyOffPresetController.update);
router.delete('/:id', weeklyOffPresetController.delete);

export default router;
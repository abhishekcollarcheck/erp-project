import { Router } from 'express';
import { shirtSizeController } from './shirt-size.controller';

const router = Router();

router.get('/', shirtSizeController.getAll);
router.post('/', shirtSizeController.createShirtSize);
router.put('/:id', shirtSizeController.updateShirtSize);
router.delete('/:id', shirtSizeController.deleteShirtSize);

export default router;
import { Router } from 'express';
import { bankController } from './bank.controller';

const router = Router();

router.get('/', bankController.getAll);
router.post('/', bankController.createBank);
router.put('/:id', bankController.updateBank);
router.delete('/:id', bankController.deleteBank);

export default router;
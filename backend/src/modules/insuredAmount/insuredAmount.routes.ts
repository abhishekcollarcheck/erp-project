import { Router } from 'express';
import { insuredAmountController } from './insuredAmount.controller';

const router = Router();

router.get('/', insuredAmountController.getAll);
router.post('/', insuredAmountController.createMaster);
router.put('/:id', insuredAmountController.updateMaster);
router.delete('/:id', insuredAmountController.deleteMaster);

router.post('/brackets', insuredAmountController.createBracket);
router.put('/brackets/:id', insuredAmountController.updateBracket);
router.delete('/brackets/:id', insuredAmountController.deleteBracket);

export default router;
import { Router } from 'express';
import { modeOfPaymentController } from './mode-of-payment.controller';

const router = Router();

router.get('/', modeOfPaymentController.getAll);
router.post('/', modeOfPaymentController.createModeOfPayment);
router.put('/:id', modeOfPaymentController.updateModeOfPayment);
router.delete('/:id', modeOfPaymentController.deleteModeOfPayment);

export default router;
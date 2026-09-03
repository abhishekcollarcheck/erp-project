import { Router } from 'express';
import { houseTypeController } from './house-type.controller';

const router = Router();

router.get('/', houseTypeController.getAll);
router.post('/', houseTypeController.createHouseType);
router.put('/:id', houseTypeController.updateHouseType);
router.delete('/:id', houseTypeController.deleteHouseType);

export default router;
import { Router } from 'express';
import { emergencyRelationshipController } from './emergency-relationship.controller';

const router = Router();

router.get('/', emergencyRelationshipController.getAll);
router.post('/', emergencyRelationshipController.createEmergencyRelationship);
router.put('/:id', emergencyRelationshipController.updateEmergencyRelationship);
router.delete('/:id', emergencyRelationshipController.deleteEmergencyRelationship);

export default router;
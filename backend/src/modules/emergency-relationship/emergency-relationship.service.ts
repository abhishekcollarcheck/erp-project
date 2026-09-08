import { EmergencyRelationship } from '../../database/models/emergency-relationship.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class EmergencyRelationshipService {
  public async getAllEmergencyRelationships(): Promise<EmergencyRelationship[]> {
    return EmergencyRelationship.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createEmergencyRelationship(name: string): Promise<EmergencyRelationship> {
    const cleanName = requireName(name, 'Emergency relationship');
    const code = toCode(cleanName);
    await assertUniqueMaster(EmergencyRelationship, { name: cleanName, code }, 'Emergency relationship');
    const count = await EmergencyRelationship.count();
    return EmergencyRelationship.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateEmergencyRelationship(id: number, name: string): Promise<EmergencyRelationship> {
    const cleanName = requireName(name, 'Emergency relationship');
    const item = assertFound(await EmergencyRelationship.findByPk(id), 'Emergency relationship');
    const code = toCode(cleanName);
    await assertUniqueMaster(EmergencyRelationship, { name: cleanName, code }, 'Emergency relationship', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteEmergencyRelationship(id: number): Promise<void> {
    const item = assertFound(await EmergencyRelationship.findByPk(id), 'Emergency relationship');
    await item.destroy();
  }
}

export const emergencyRelationshipService = new EmergencyRelationshipService();

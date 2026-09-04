import { EmergencyRelationship } from '../../database/models/emergency-relationship.model';

export class EmergencyRelationshipService {
  public async getAllEmergencyRelationships(): Promise<EmergencyRelationship[]> {
    return EmergencyRelationship.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createEmergencyRelationship(name: string): Promise<EmergencyRelationship> {
    const count = await EmergencyRelationship.count();
    const cleanName = name.trim();
    return EmergencyRelationship.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateEmergencyRelationship(id: number, name: string): Promise<EmergencyRelationship> {
    const item = await EmergencyRelationship.findByPk(id);
    if (!item) throw new Error('Emergency relationship not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteEmergencyRelationship(id: number): Promise<void> {
    const item = await EmergencyRelationship.findByPk(id);
    if (!item) throw new Error('Emergency relationship not found');
    await item.destroy();
  }
}

export const emergencyRelationshipService = new EmergencyRelationshipService();
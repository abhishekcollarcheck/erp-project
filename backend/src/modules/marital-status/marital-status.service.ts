import { MaritalStatus } from '../../database/models/marital-status';

export class MaritalStatusService {
  public async getAllMaritalStatuses(): Promise<MaritalStatus[]> {
    return MaritalStatus.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createMaritalStatus(name: string): Promise<MaritalStatus> {
    const count = await MaritalStatus.count();
    const cleanName = name.trim();
    return MaritalStatus.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateMaritalStatus(id: number, name: string): Promise<MaritalStatus> {
    const item = await MaritalStatus.findByPk(id);
    if (!item) throw new Error('Marital status not found');
    const cleanName = name.trim();
    return item.update({ name: cleanName, code: cleanName.toUpperCase().replace(/\s+/g, '_') });
  }

  public async deleteMaritalStatus(id: number): Promise<void> {
    const item = await MaritalStatus.findByPk(id);
    if (!item) throw new Error('Marital status not found');
    await item.destroy();
  }
}

export const maritalStatusService = new MaritalStatusService();
import { BloodGroup } from '../../database/models/bloodGroup';

export class BloodGroupService {
  public async getAllBloodGroups(): Promise<BloodGroup[]> {
    return BloodGroup.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createBloodGroup(name: string): Promise<BloodGroup> {
    const count = await BloodGroup.count();
    const cleanName = name.trim();
    return BloodGroup.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_').replace('+', '_POS').replace('-', '_NEG'),
      display_order: count + 1,
    });
  }

  public async updateBloodGroup(id: number, name: string): Promise<BloodGroup> {
    const item = await BloodGroup.findByPk(id);
    if (!item) throw new Error('Blood group not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_').replace('+', '_POS').replace('-', '_NEG'),
    });
  }

  public async deleteBloodGroup(id: number): Promise<void> {
    const item = await BloodGroup.findByPk(id);
    if (!item) throw new Error('Blood group not found');
    await item.destroy();
  }
}

export const bloodGroupService = new BloodGroupService();
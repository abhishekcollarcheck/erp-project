import { Religion } from '../../database/models/religion.model';

export class ReligionService {
  public async getAllReligions(): Promise<Religion[]> {
    return Religion.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createReligion(name: string): Promise<Religion> {
    const count = await Religion.count();
    const cleanName = name.trim();
    return Religion.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateReligion(id: number, name: string): Promise<Religion> {
    const item = await Religion.findByPk(id);
    if (!item) throw new Error('Religion not found');
    const cleanName = name.trim();
    return item.update({ name: cleanName, code: cleanName.toUpperCase().replace(/\s+/g, '_') });
  }

  public async deleteReligion(id: number): Promise<void> {
    const item = await Religion.findByPk(id);
    if (!item) throw new Error('Religion not found');
    await item.destroy();
  }
}

export const religionService = new ReligionService();
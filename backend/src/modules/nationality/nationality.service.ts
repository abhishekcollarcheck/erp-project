import { Nationality } from '../../database/models/nationality.model';

export class NationalityService {
  public async getAllNationalities(): Promise<Nationality[]> {
    return Nationality.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createNationality(name: string): Promise<Nationality> {
    const count = await Nationality.count();
    const cleanName = name.trim();
    return Nationality.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateNationality(id: number, name: string): Promise<Nationality> {
    const item = await Nationality.findByPk(id);
    if (!item) throw new Error('Nationality not found');
    const cleanName = name.trim();
    return item.update({ name: cleanName, code: cleanName.toUpperCase().replace(/\s+/g, '_') });
  }

  public async deleteNationality(id: number): Promise<void> {
    const item = await Nationality.findByPk(id);
    if (!item) throw new Error('Nationality not found');
    await item.destroy();
  }
}

export const nationalityService = new NationalityService();
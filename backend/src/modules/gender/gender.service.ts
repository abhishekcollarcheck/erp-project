import { Gender } from '../../database/models/gender.model';

export class GenderService {
  public async getAllGenders(): Promise<Gender[]> {
    return Gender.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createGender(name: string): Promise<Gender> {
    const count = await Gender.count();
    const cleanName = name.trim();
    return Gender.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateGender(id: number, name: string): Promise<Gender> {
    const item = await Gender.findByPk(id);
    if (!item) throw new Error('Gender not found');
    const cleanName = name.trim();
    return item.update({ name: cleanName, code: cleanName.toUpperCase().replace(/\s+/g, '_') });
  }

  public async deleteGender(id: number): Promise<void> {
    const item = await Gender.findByPk(id);
    if (!item) throw new Error('Gender not found');
    await item.destroy();
  }
}

export const genderService = new GenderService();
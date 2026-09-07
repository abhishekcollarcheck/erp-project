import { Gender } from '../../database/models/gender.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class GenderService {
  public async getAllGenders(): Promise<Gender[]> {
    return Gender.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createGender(name: string): Promise<Gender> {
    const cleanName = requireName(name, 'Gender');
    const code = toCode(cleanName);
    await assertUniqueMaster(Gender, { name: cleanName, code }, 'Gender');
    const count = await Gender.count();
    return Gender.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateGender(id: number, name: string): Promise<Gender> {
    const cleanName = requireName(name, 'Gender');
    const item = assertFound(await Gender.findByPk(id), 'Gender');
    const code = toCode(cleanName);
    await assertUniqueMaster(Gender, { name: cleanName, code }, 'Gender', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteGender(id: number): Promise<void> {
    const item = assertFound(await Gender.findByPk(id), 'Gender');
    await item.destroy();
  }
}

export const genderService = new GenderService();

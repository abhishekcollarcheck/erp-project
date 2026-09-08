import { Nationality } from '../../database/models/nationality.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class NationalityService {
  public async getAllNationalities(): Promise<Nationality[]> {
    return Nationality.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createNationality(name: string): Promise<Nationality> {
    const cleanName = requireName(name, 'Nationality');
    const code = toCode(cleanName);
    await assertUniqueMaster(Nationality, { name: cleanName, code }, 'Nationality');
    const count = await Nationality.count();
    return Nationality.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateNationality(id: number, name: string): Promise<Nationality> {
    const cleanName = requireName(name, 'Nationality');
    const item = assertFound(await Nationality.findByPk(id), 'Nationality');
    const code = toCode(cleanName);
    await assertUniqueMaster(Nationality, { name: cleanName, code }, 'Nationality', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteNationality(id: number): Promise<void> {
    const item = assertFound(await Nationality.findByPk(id), 'Nationality');
    await item.destroy();
  }
}

export const nationalityService = new NationalityService();

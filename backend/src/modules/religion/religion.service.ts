import { Religion } from '../../database/models/religion.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class ReligionService {
  public async getAllReligions(): Promise<Religion[]> {
    return Religion.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createReligion(name: string): Promise<Religion> {
    const cleanName = requireName(name, 'Religion');
    const code = toCode(cleanName);
    await assertUniqueMaster(Religion, { name: cleanName, code }, 'Religion');
    const count = await Religion.count();
    return Religion.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateReligion(id: number, name: string): Promise<Religion> {
    const cleanName = requireName(name, 'Religion');
    const item = assertFound(await Religion.findByPk(id), 'Religion');
    const code = toCode(cleanName);
    await assertUniqueMaster(Religion, { name: cleanName, code }, 'Religion', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteReligion(id: number): Promise<void> {
    const item = assertFound(await Religion.findByPk(id), 'Religion');
    await item.destroy();
  }
}

export const religionService = new ReligionService();

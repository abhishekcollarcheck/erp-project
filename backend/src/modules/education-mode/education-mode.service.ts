import { EducationMode } from '../../database/models/education-mode.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class EducationModeService {
  public async getAllEducationModes(): Promise<EducationMode[]> {
    return EducationMode.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createEducationMode(name: string): Promise<EducationMode> {
    const cleanName = requireName(name, 'Education mode');
    const code = toCode(cleanName);
    await assertUniqueMaster(EducationMode, { name: cleanName, code }, 'Education mode');
    const count = await EducationMode.count();
    return EducationMode.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateEducationMode(id: number, name: string): Promise<EducationMode> {
    const cleanName = requireName(name, 'Education mode');
    const item = assertFound(await EducationMode.findByPk(id), 'Education mode');
    const code = toCode(cleanName);
    await assertUniqueMaster(EducationMode, { name: cleanName, code }, 'Education mode', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteEducationMode(id: number): Promise<void> {
    const item = assertFound(await EducationMode.findByPk(id), 'Education mode');
    await item.destroy();
  }
}

export const educationModeService = new EducationModeService();

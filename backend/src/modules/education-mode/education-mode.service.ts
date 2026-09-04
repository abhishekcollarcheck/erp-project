import { EducationMode } from '../../database/models/education-mode.model';

export class EducationModeService {
  public async getAllEducationModes(): Promise<EducationMode[]> {
    return EducationMode.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createEducationMode(name: string): Promise<EducationMode> {
    const count = await EducationMode.count();
    const cleanName = name.trim();
    return EducationMode.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateEducationMode(id: number, name: string): Promise<EducationMode> {
    const item = await EducationMode.findByPk(id);
    if (!item) throw new Error('Education mode not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
    });
  }

  public async deleteEducationMode(id: number): Promise<void> {
    const item = await EducationMode.findByPk(id);
    if (!item) throw new Error('Education mode not found');
    await item.destroy();
  }
}

export const educationModeService = new EducationModeService();
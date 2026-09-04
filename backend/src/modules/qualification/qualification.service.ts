import { Qualification } from '../../database/models/qualification.model';

export class QualificationService {
  public async getAllQualifications(): Promise<Qualification[]> {
    return Qualification.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createQualification(name: string): Promise<Qualification> {
    const count = await Qualification.count();
    const cleanName = name.trim();
    return Qualification.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateQualification(id: number, name: string): Promise<Qualification> {
    const item = await Qualification.findByPk(id);
    if (!item) throw new Error('Qualification not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/\s+/g, '_'),
    });
  }

  public async deleteQualification(id: number): Promise<void> {
    const item = await Qualification.findByPk(id);
    if (!item) throw new Error('Qualification not found');
    await item.destroy();
  }
}

export const qualificationService = new QualificationService();
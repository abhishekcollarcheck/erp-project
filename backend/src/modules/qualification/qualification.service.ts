import { Qualification } from '../../database/models/qualification.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class QualificationService {
  public async getAllQualifications(): Promise<Qualification[]> {
    return Qualification.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createQualification(name: string): Promise<Qualification> {
    const cleanName = requireName(name, 'Qualification');
    const code = toCode(cleanName);
    await assertUniqueMaster(Qualification, { name: cleanName, code }, 'Qualification');
    const count = await Qualification.count();
    return Qualification.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateQualification(id: number, name: string): Promise<Qualification> {
    const cleanName = requireName(name, 'Qualification');
    const item = assertFound(await Qualification.findByPk(id), 'Qualification');
    const code = toCode(cleanName);
    await assertUniqueMaster(Qualification, { name: cleanName, code }, 'Qualification', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteQualification(id: number): Promise<void> {
    const item = assertFound(await Qualification.findByPk(id), 'Qualification');
    await item.destroy();
  }
}

export const qualificationService = new QualificationService();

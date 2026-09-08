import { Salutation } from '../../database/models/salutation.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class SalutationService {
  public async getAllSalutations(): Promise<Salutation[]> {
    return Salutation.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createSalutation(name: string): Promise<Salutation> {
    const cleanName = requireName(name, 'Salutation');
    const code = toCode(cleanName);
    await assertUniqueMaster(Salutation, { name: cleanName, code }, 'Salutation');
    const count = await Salutation.count();
    return Salutation.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateSalutation(id: number, name: string): Promise<Salutation> {
    const cleanName = requireName(name, 'Salutation');
    const item = assertFound(await Salutation.findByPk(id), 'Salutation');
    const code = toCode(cleanName);
    await assertUniqueMaster(Salutation, { name: cleanName, code }, 'Salutation', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteSalutation(id: number): Promise<void> {
    const item = assertFound(await Salutation.findByPk(id), 'Salutation');
    await item.destroy();
  }
}

export const salutationService = new SalutationService();

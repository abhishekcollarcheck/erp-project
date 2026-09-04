import { Salutation } from '../../database/models/salutation.model';

export class SalutationService {
  public async getAllSalutations(): Promise<Salutation[]> {
    return Salutation.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createSalutation(name: string): Promise<Salutation> {
    const count = await Salutation.count();
    const cleanName = name.trim();
    return Salutation.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateSalutation(id: number, name: string): Promise<Salutation> {
    const item = await Salutation.findByPk(id);
    if (!item) throw new Error('Salutation not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteSalutation(id: number): Promise<void> {
    const item = await Salutation.findByPk(id);
    if (!item) throw new Error('Salutation not found');
    await item.destroy();
  }
}

export const salutationService = new SalutationService();
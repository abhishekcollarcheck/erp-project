import { ShirtSize } from '../../database/models/shirt-size.model';

export class ShirtSizeService {
  public async getAllShirtSizes(): Promise<ShirtSize[]> {
    return ShirtSize.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createShirtSize(name: string): Promise<ShirtSize> {
    const count = await ShirtSize.count();
    const cleanName = name.trim();
    return ShirtSize.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateShirtSize(id: number, name: string): Promise<ShirtSize> {
    const item = await ShirtSize.findByPk(id);
    if (!item) throw new Error('Shirt size not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteShirtSize(id: number): Promise<void> {
    const item = await ShirtSize.findByPk(id);
    if (!item) throw new Error('Shirt size not found');
    await item.destroy();
  }
}

export const shirtSizeService = new ShirtSizeService();
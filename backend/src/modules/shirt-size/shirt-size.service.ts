import { ShirtSize } from '../../database/models/shirt-size.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class ShirtSizeService {
  public async getAllShirtSizes(): Promise<ShirtSize[]> {
    return ShirtSize.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createShirtSize(name: string): Promise<ShirtSize> {
    const cleanName = requireName(name, 'Shirt size');
    const code = toCode(cleanName);
    await assertUniqueMaster(ShirtSize, { name: cleanName, code }, 'Shirt size');
    const count = await ShirtSize.count();
    return ShirtSize.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateShirtSize(id: number, name: string): Promise<ShirtSize> {
    const cleanName = requireName(name, 'Shirt size');
    const item = assertFound(await ShirtSize.findByPk(id), 'Shirt size');
    const code = toCode(cleanName);
    await assertUniqueMaster(ShirtSize, { name: cleanName, code }, 'Shirt size', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteShirtSize(id: number): Promise<void> {
    const item = assertFound(await ShirtSize.findByPk(id), 'Shirt size');
    await item.destroy();
  }
}

export const shirtSizeService = new ShirtSizeService();

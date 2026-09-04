import { HouseType } from '../../database/models/house-type.model';

export class HouseTypeService {
  public async getAllHouseTypes(): Promise<HouseType[]> {
    return HouseType.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createHouseType(name: string): Promise<HouseType> {
    const count = await HouseType.count();
    const cleanName = name.trim();
    return HouseType.create({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      display_order: count + 1,
    });
  }

  public async updateHouseType(id: number, name: string): Promise<HouseType> {
    const item = await HouseType.findByPk(id);
    if (!item) throw new Error('House type not found');
    const cleanName = name.trim();
    return item.update({
      name: cleanName,
      code: cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    });
  }

  public async deleteHouseType(id: number): Promise<void> {
    const item = await HouseType.findByPk(id);
    if (!item) throw new Error('House type not found');
    await item.destroy();
  }
}

export const houseTypeService = new HouseTypeService();
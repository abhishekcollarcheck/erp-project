import { HouseType } from '../../database/models/house-type.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export class HouseTypeService {
  public async getAllHouseTypes(): Promise<HouseType[]> {
    return HouseType.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createHouseType(name: string): Promise<HouseType> {
    const cleanName = requireName(name, 'House type');
    const code = toCode(cleanName);
    await assertUniqueMaster(HouseType, { name: cleanName, code }, 'House type');
    const count = await HouseType.count();
    return HouseType.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateHouseType(id: number, name: string): Promise<HouseType> {
    const cleanName = requireName(name, 'House type');
    const item = assertFound(await HouseType.findByPk(id), 'House type');
    const code = toCode(cleanName);
    await assertUniqueMaster(HouseType, { name: cleanName, code }, 'House type', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteHouseType(id: number): Promise<void> {
    const item = assertFound(await HouseType.findByPk(id), 'House type');
    await item.destroy();
  }
}

export const houseTypeService = new HouseTypeService();

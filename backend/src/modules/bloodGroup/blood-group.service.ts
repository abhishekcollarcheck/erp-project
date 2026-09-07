import { BloodGroup } from '../../database/models/bloodGroup';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) =>
  name.toUpperCase().replace(/\s+/g, '_').replace('+', '_POS').replace('-', '_NEG');

export class BloodGroupService {
  public async getAllBloodGroups(): Promise<BloodGroup[]> {
    return BloodGroup.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createBloodGroup(name: string): Promise<BloodGroup> {
    const cleanName = requireName(name, 'Blood group');
    const code = toCode(cleanName);
    await assertUniqueMaster(BloodGroup, { name: cleanName, code }, 'Blood group');
    const count = await BloodGroup.count();
    return BloodGroup.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateBloodGroup(id: number, name: string): Promise<BloodGroup> {
    const cleanName = requireName(name, 'Blood group');
    const item = assertFound(await BloodGroup.findByPk(id), 'Blood group');
    const code = toCode(cleanName);
    await assertUniqueMaster(BloodGroup, { name: cleanName, code }, 'Blood group', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteBloodGroup(id: number): Promise<void> {
    const item = assertFound(await BloodGroup.findByPk(id), 'Blood group');
    await item.destroy();
  }
}

export const bloodGroupService = new BloodGroupService();

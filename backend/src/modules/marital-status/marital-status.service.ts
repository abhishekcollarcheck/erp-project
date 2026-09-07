import { MaritalStatus } from '../../database/models/marital-status';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

const toCode = (name: string) => name.toUpperCase().replace(/\s+/g, '_');

export class MaritalStatusService {
  public async getAllMaritalStatuses(): Promise<MaritalStatus[]> {
    return MaritalStatus.findAll({ order: [['display_order', 'ASC'], ['id', 'ASC']] });
  }

  public async createMaritalStatus(name: string): Promise<MaritalStatus> {
    const cleanName = requireName(name, 'Marital status');
    const code = toCode(cleanName);
    await assertUniqueMaster(MaritalStatus, { name: cleanName, code }, 'Marital status');
    const count = await MaritalStatus.count();
    return MaritalStatus.create({ name: cleanName, code, display_order: count + 1 });
  }

  public async updateMaritalStatus(id: number, name: string): Promise<MaritalStatus> {
    const cleanName = requireName(name, 'Marital status');
    const item = assertFound(await MaritalStatus.findByPk(id), 'Marital status');
    const code = toCode(cleanName);
    await assertUniqueMaster(MaritalStatus, { name: cleanName, code }, 'Marital status', id);
    return item.update({ name: cleanName, code });
  }

  public async deleteMaritalStatus(id: number): Promise<void> {
    const item = assertFound(await MaritalStatus.findByPk(id), 'Marital status');
    await item.destroy();
  }
}

export const maritalStatusService = new MaritalStatusService();

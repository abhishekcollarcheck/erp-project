import { Bond } from '../../database/models/bond.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

export interface CreateBondInput {
  name: string;
  code?: string;
}

export interface UpdateBondInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class BondService {
  public async getAll(): Promise<Bond[]> {
    return Bond.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(id: number): Promise<Bond | null> {
    return Bond.findByPk(id);
  }

  public async create(data: CreateBondInput): Promise<Bond> {
    const name = requireName(data.name, 'Bond option');
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(Bond, { name, code: generatedCode }, 'Bond option');
    const count = await Bond.count();

    return Bond.create({
      name,
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateBondInput
  ): Promise<Bond> {
    const item = assertFound(await Bond.findByPk(id), 'Bond option');

    const updatePayload: Partial<UpdateBondInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, 'Bond option');
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(Bond, { name: updatePayload.name, code: updatePayload.code }, 'Bond option', id);
    }
    if (data.is_active !== undefined) {
      updatePayload.is_active = data.is_active;
    }

    return item.update(updatePayload);
  }

  public async updateOrder(orderedIds: number[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      Bond.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    const item = assertFound(await Bond.findByPk(id), 'Bond option');
    await item.destroy();
  }
}

export const bondService = new BondService();
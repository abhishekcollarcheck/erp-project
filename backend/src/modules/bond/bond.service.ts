import { Bond } from '../../database/models/bond.model';

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
    const count = await Bond.count();
    const generatedCode =
      data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

    return Bond.create({
      name: data.name.trim(),
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateBondInput
  ): Promise<Bond> {
    const item = await Bond.findByPk(id);
    if (!item) throw new Error('Bond option not found');

    const updatePayload: Partial<UpdateBondInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = data.name.trim();
      updatePayload.code = data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');
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
    const item = await Bond.findByPk(id);
    if (!item) throw new Error('Bond option not found');
    await item.destroy();
  }
}

export const bondService = new BondService();
import { NoticePeriod } from '../../database/models/noticePeriod.model';

export interface CreateNoticePeriodInput {
  name: string;
  code?: string;
}

export interface UpdateNoticePeriodInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class NoticePeriodService {
  public async getAll(): Promise<NoticePeriod[]> {
    return NoticePeriod.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(id: number): Promise<NoticePeriod | null> {
    return NoticePeriod.findByPk(id);
  }

  public async create(data: CreateNoticePeriodInput): Promise<NoticePeriod> {
    const count = await NoticePeriod.count();
    const generatedCode =
      data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

    return NoticePeriod.create({
      name: data.name.trim(),
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateNoticePeriodInput
  ): Promise<NoticePeriod> {
    const item = await NoticePeriod.findByPk(id);
    if (!item) throw new Error('Notice period not found');

    const updatePayload: Partial<UpdateNoticePeriodInput> = {};
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
      NoticePeriod.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    const item = await NoticePeriod.findByPk(id);
    if (!item) throw new Error('Notice period not found');
    await item.destroy();
  }
}

export const noticePeriodService = new NoticePeriodService();
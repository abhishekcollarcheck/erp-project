import { NoticePeriod } from '../../database/models/noticePeriod.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

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
    const name = requireName(data.name, 'Notice period');
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(NoticePeriod, { name, code: generatedCode }, 'Notice period');
    const count = await NoticePeriod.count();

    return NoticePeriod.create({
      name,
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateNoticePeriodInput
  ): Promise<NoticePeriod> {
    const item = assertFound(await NoticePeriod.findByPk(id), 'Notice period');

    const updatePayload: Partial<UpdateNoticePeriodInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, 'Notice period');
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(NoticePeriod, { name: updatePayload.name, code: updatePayload.code }, 'Notice period', id);
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
    const item = assertFound(await NoticePeriod.findByPk(id), 'Notice period');
    await item.destroy();
  }
}

export const noticePeriodService = new NoticePeriodService();
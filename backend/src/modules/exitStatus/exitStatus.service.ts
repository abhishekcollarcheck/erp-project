import { ExitStatus } from '../../database/models/exitStatus.model';

export interface CreateExitStatusInput {
  name: string;
  code?: string;
}

export interface UpdateExitStatusInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class ExitStatusService {
  public async getAll(): Promise<ExitStatus[]> {
    return ExitStatus.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(id: number): Promise<ExitStatus | null> {
    return ExitStatus.findByPk(id);
  }

  public async create(data: CreateExitStatusInput): Promise<ExitStatus> {
    const count = await ExitStatus.count();
    const generatedCode =
      data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

    return ExitStatus.create({
      name: data.name.trim(),
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateExitStatusInput
  ): Promise<ExitStatus> {
    const item = await ExitStatus.findByPk(id);
    if (!item) throw new Error('Exit status not found');

    const updatePayload: Partial<UpdateExitStatusInput> = {};
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
      ExitStatus.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    const item = await ExitStatus.findByPk(id);
    if (!item) throw new Error('Exit status not found');
    await item.destroy();
  }
}

export const exitStatusService = new ExitStatusService();
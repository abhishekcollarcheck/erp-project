import { ExitStatus } from '../../database/models/exitStatus.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

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
    const name = requireName(data.name, 'Exit status');
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(ExitStatus, { name, code: generatedCode }, 'Exit status');
    const count = await ExitStatus.count();

    return ExitStatus.create({
      name,
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateExitStatusInput
  ): Promise<ExitStatus> {
    const item = assertFound(await ExitStatus.findByPk(id), 'Exit status');

    const updatePayload: Partial<UpdateExitStatusInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, 'Exit status');
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(ExitStatus, { name: updatePayload.name, code: updatePayload.code }, 'Exit status', id);
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
    const item = assertFound(await ExitStatus.findByPk(id), 'Exit status');
    await item.destroy();
  }
}

export const exitStatusService = new ExitStatusService();
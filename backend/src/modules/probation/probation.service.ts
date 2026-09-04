import { ProbationPeriod } from '../../database/models/probationPeriod.model';
import { ProbationStatus } from '../../database/models/probationStatus.model';

export type ProbationType = 'periods' | 'statuses';

export interface CreateProbationInput {
  name: string;
  code?: string;
}

export interface UpdateProbationInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class ProbationService {
  private getModel(type: ProbationType) {
    return type === 'periods' ? ProbationPeriod : ProbationStatus;
  }

  public async getAll(type: ProbationType) {
    const ModelClass = this.getModel(type);
    return ModelClass.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(type: ProbationType, id: number) {
    const ModelClass = this.getModel(type);
    return ModelClass.findByPk(id);
  }

  public async create(type: ProbationType, data: CreateProbationInput) {
    const ModelClass = this.getModel(type);
    const count = await ModelClass.count();
    const generatedCode =
      data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

    return ModelClass.create({
      name: data.name.trim(),
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    type: ProbationType,
    id: number,
    data: UpdateProbationInput
  ) {
    const ModelClass = this.getModel(type);
    const item = await ModelClass.findByPk(id);
    if (!item) throw new Error(`Probation ${type === 'periods' ? 'period' : 'status'} not found`);

    const updatePayload: Partial<UpdateProbationInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = data.name.trim();
      updatePayload.code = data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');
    }
    if (data.is_active !== undefined) {
      updatePayload.is_active = data.is_active;
    }

    return item.update(updatePayload);
  }

  public async updateOrder(type: ProbationType, orderedIds: number[]): Promise<void> {
    const ModelClass = this.getModel(type);
    const updates = orderedIds.map((id, index) =>
      ModelClass.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(type: ProbationType, id: number): Promise<void> {
    const ModelClass = this.getModel(type);
    const item = await ModelClass.findByPk(id);
    if (!item) throw new Error(`Probation ${type === 'periods' ? 'period' : 'status'} not found`);
    await item.destroy();
  }
}

export const probationService = new ProbationService();
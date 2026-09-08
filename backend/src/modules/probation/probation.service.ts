import { ProbationPeriod } from '../../database/models/probationPeriod.model';
import { ProbationStatus } from '../../database/models/probationStatus.model';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

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
    const label = `Probation ${type === 'periods' ? 'period' : 'status'}`;
    const ModelClass = this.getModel(type);
    const name = requireName(data.name, label);
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(ModelClass, { name, code: generatedCode }, label);
    const count = await ModelClass.count();

    return ModelClass.create({
      name,
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
    const label = `Probation ${type === 'periods' ? 'period' : 'status'}`;
    const ModelClass = this.getModel(type);
    const item = assertFound(await ModelClass.findByPk(id), label);

    const updatePayload: Partial<UpdateProbationInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, label);
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(ModelClass, { name: updatePayload.name, code: updatePayload.code }, label, id);
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
    const label = `Probation ${type === 'periods' ? 'period' : 'status'}`;
    const ModelClass = this.getModel(type);
    const item = assertFound(await ModelClass.findByPk(id), label);
    await item.destroy();
  }
}

export const probationService = new ProbationService();
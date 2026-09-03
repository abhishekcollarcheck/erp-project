import { EmployeeStatus } from "../../database/models/employeeStatus.model";


export interface CreateEmployeeStatusInput {
  name: string;
  code?: string;
}

export interface UpdateEmployeeStatusInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class EmployeeStatusService {
  public async getAll(): Promise<EmployeeStatus[]> {
    return EmployeeStatus.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(id: number): Promise<EmployeeStatus | null> {
    return EmployeeStatus.findByPk(id);
  }

  public async create(data: CreateEmployeeStatusInput): Promise<EmployeeStatus> {
    const count = await EmployeeStatus.count();
    const generatedCode =
      data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

    return EmployeeStatus.create({
      name: data.name.trim(),
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateEmployeeStatusInput
  ): Promise<EmployeeStatus> {
    const item = await EmployeeStatus.findByPk(id);
    if (!item) throw new Error('Employee status not found');

    const updatePayload: Partial<UpdateEmployeeStatusInput> = {};
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
      EmployeeStatus.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    const item = await EmployeeStatus.findByPk(id);
    if (!item) throw new Error('Employee status not found');
    await item.destroy();
  }
}

export const employeeStatusService = new EmployeeStatusService();
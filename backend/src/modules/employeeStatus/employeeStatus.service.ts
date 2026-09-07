import { EmployeeStatus } from "../../database/models/employeeStatus.model";
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';


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
    const name = requireName(data.name, 'Employee status');
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(EmployeeStatus, { name, code: generatedCode }, 'Employee status');
    const count = await EmployeeStatus.count();

    return EmployeeStatus.create({
      name,
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateEmployeeStatusInput
  ): Promise<EmployeeStatus> {
    const item = assertFound(await EmployeeStatus.findByPk(id), 'Employee status');

    const updatePayload: Partial<UpdateEmployeeStatusInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, 'Employee status');
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(EmployeeStatus, { name: updatePayload.name, code: updatePayload.code }, 'Employee status', id);
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
    const item = assertFound(await EmployeeStatus.findByPk(id), 'Employee status');
    await item.destroy();
  }
}

export const employeeStatusService = new EmployeeStatusService();
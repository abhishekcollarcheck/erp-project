// // import { EmployeeType } from './employeeType.model';

// import { EmployeeType } from "../../database/models/EmployeeType";

// export interface CreateEmployeeTypeInput {
//   name: string;
//   code?: string;
// }

// export interface UpdateEmployeeTypeInput {
//   name?: string;
//   code?: string;
//   is_active?: boolean;
// }

// export class EmployeeTypeService {
//   public async getAll(): Promise<EmployeeType[]> {
//     return EmployeeType.findAll({
//       order: [
//         ['display_order', 'ASC'],
//         ['id', 'ASC'],
//       ],
//     });
//   }

//   public async getById(id: number): Promise<EmployeeType | null> {
//     return EmployeeType.findByPk(id);
//   }

//   public async create(data: CreateEmployeeTypeInput): Promise<EmployeeType> {
//     const count = await EmployeeType.count();
//     const generatedCode =
//       data.code || data.name.trim().toUpperCase().replace(/\s+/g, '_');

//     return EmployeeType.create({
//       name: data.name.trim(),
//       code: generatedCode,
//       display_order: count + 1,
//       is_active: true,
//     });
//   }

//   public async update(
//     id: number,
//     data: UpdateEmployeeTypeInput
//   ): Promise<EmployeeType> {
//     const item = await EmployeeType.findByPk(id);
//     if (!item) throw new Error('Employee type not found');

//     if (data.name && !data.code) {
//       data.code = data.name.trim().toUpperCase().replace(/\s+/g, '_');
//     }

//     return item.update(data);
//   }

//   public async updateOrder(orderedIds: number[]): Promise<void> {
//     const updates = orderedIds.map((id, index) =>
//       EmployeeType.update({ display_order: index + 1 }, { where: { id } })
//     );
//     await Promise.all(updates);
//   }

//   public async delete(id: number): Promise<void> {
//     const item = await EmployeeType.findByPk(id);
//     if (!item) throw new Error('Employee type not found');
//     await item.destroy();
//   }
// }

// export const employeeTypeService = new EmployeeTypeService();



import { EmployeeType } from '../../database/models/EmployeeType';
import { requireName, assertFound, assertUniqueMaster } from '../../utils/masterCrud';

export interface CreateEmployeeTypeInput {
  name: string;
  code?: string;
}

export interface UpdateEmployeeTypeInput {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export class EmployeeTypeService {
  public async getAll(): Promise<EmployeeType[]> {
    return EmployeeType.findAll({
      order: [
        ['display_order', 'ASC'],
        ['id', 'ASC'],
      ],
    });
  }

  public async getById(id: number): Promise<EmployeeType | null> {
    return EmployeeType.findByPk(id);
  }

  public async create(data: CreateEmployeeTypeInput): Promise<EmployeeType> {
    const name = requireName(data.name, 'Employee type');
    const generatedCode = data.code || name.toUpperCase().replace(/\s+/g, '_');
    await assertUniqueMaster(EmployeeType, { name, code: generatedCode }, 'Employee type');
    const count = await EmployeeType.count();

    return EmployeeType.create({
      name,
      code: generatedCode,
      display_order: count + 1,
      is_active: true,
    });
  }

  public async update(
    id: number,
    data: UpdateEmployeeTypeInput
  ): Promise<EmployeeType> {
    const item = assertFound(await EmployeeType.findByPk(id), 'Employee type');

    const updatePayload: Partial<UpdateEmployeeTypeInput> = {};
    if (data.name !== undefined) {
      updatePayload.name = requireName(data.name, 'Employee type');
      updatePayload.code = data.code || updatePayload.name.toUpperCase().replace(/\s+/g, '_');
      await assertUniqueMaster(EmployeeType, { name: updatePayload.name, code: updatePayload.code }, 'Employee type', id);
    }
    if (data.is_active !== undefined) {
      updatePayload.is_active = data.is_active;
    }

    return item.update(updatePayload);
  }

  public async updateOrder(orderedIds: number[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      EmployeeType.update({ display_order: index + 1 }, { where: { id } })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    const item = assertFound(await EmployeeType.findByPk(id), 'Employee type');
    await item.destroy();
  }
}

export const employeeTypeService = new EmployeeTypeService();
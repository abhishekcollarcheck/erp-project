import { Op, WhereOptions, fn, col } from 'sequelize';
import { SubDesignation } from '../../database/models/SubDesignation';
import { Employee } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface CreateSubDesignationDto {
  name: string;
}

export interface UpdateSubDesignationDto {
  name?: string;
  is_active?: boolean;
}

export interface SubDesignationQueryParams {
  is_active?: boolean | string;
  search?: string;
}

export class SubDesignationService {

  // ─── List ──────────────────────────────────────────────────────────────────
  async getAll(query: SubDesignationQueryParams = {}) {
    const where: WhereOptions = {};

    if (query.is_active === 'false' || query.is_active === false) {
      where['is_active'] = false;
    } else if (query.is_active === 'all') {
      // no filter
    } else {
      where['is_active'] = true;
    }

    if (query.search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
      ];
    }

    const subDesignations = await SubDesignation.findAll({
      where,
      order: [['name', 'ASC']],
    });

    // Attach employee count per sub-designation
    const subDesignationIds = subDesignations.map((sd) => sd.id);
    const empCounts = subDesignationIds.length
      ? await Employee.findAll({
          where: { sub_designation: subDesignationIds, status: ['Active', 'On_Probation'] },
          attributes: ['sub_designation', [fn('COUNT', col('id')), 'count']],
          group: ['sub_designation'],
          raw: true,
        })
      : [];

    const countMap = new Map<number, number>(
      (empCounts as any[]).map((r) => [r.sub_designation, Number(r.count)]),
    );

    return subDesignations.map((sd) => ({
      ...sd.toJSON(),
      employee_count: countMap.get(sd.id) ?? 0,
    }));
  }

  // ─── Single ────────────────────────────────────────────────────────────────
  async getById(id: number) {
    const subDesignation = await SubDesignation.findOne({
      where: { id },
      include: [
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'department_id', 'sub_department_id'],
          where: { status: ['Active', 'On_Probation'] },
          required: false,
        },
      ],
    });

    if (!subDesignation) throw new AppError('Sub-Designation not found', 404);
    return subDesignation;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, active] = await Promise.all([
      SubDesignation.count({ where: { is_active: true } }),
      SubDesignation.count({ where: { is_active: true } }),
    ]);

    // Most populated sub-designation
    const empCounts = await Employee.findAll({
      where: { status: ['Active', 'On_Probation'] },
      attributes: ['sub_designation', [fn('COUNT', col('Employee.id')), 'count']],
      include: [{
        model: SubDesignation,
        as: 'subDesignation',
        attributes: ['name'],
        required: true,
      }],
      group: ['sub_designation'],
      order: [[fn('COUNT', col('Employee.id')), 'DESC']],
      limit: 1,
      raw: true,
      nest: true,
    });

    const top = empCounts[0] as any;

    return {
      total,
      active,
      inactive: total - active,
      topSubDesignation: top ? { id: top.sub_designation, name: top['subDesignation.name'], count: Number(top.count) } : null,
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(companyId: number, dto: CreateSubDesignationDto, createdBy?: number): Promise<SubDesignation> {
    const subDesignation = await SubDesignation.create({
      name: dto.name.trim(),
      is_active: true,
      created_by: createdBy ?? null,
    });

    await logActivity({
      companyId: companyId,
      employeeId: createdBy,
      action: 'SUB_DESIGNATION_CREATED',
      module: 'sub_designations',
      entityId: subDesignation.id,
      newValues: { name: subDesignation.name },
    });

    return this.getById(subDesignation.id);
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(companyId: number, id: number, dto: UpdateSubDesignationDto, updatedBy?: number): Promise<SubDesignation> {
    const subDesignation = await this.findOrFail(id);

    const before = {
      name: subDesignation.name,
      is_active: subDesignation.is_active,
    };

    await subDesignation.update({
      name: dto.name?.trim() ?? subDesignation.name,
      is_active: dto.is_active !== undefined ? dto.is_active : subDesignation.is_active,
      updated_by: updatedBy ?? null,
    });

    await logActivity({
      companyId, 
      employeeId: updatedBy,
      action: 'SUB_DESIGNATION_UPDATED',
      module: 'sub_designations',
      entityId: id,
      oldValues: before as Record<string, unknown>,
      newValues: { name: subDesignation.name, is_active: subDesignation.is_active },
    });

    return this.getById(id);
  }

  // ─── Soft delete ───────────────────────────────────────────────────────────
  async delete(companyId:number, id: number, deletedBy?: number): Promise<void> {
    const subDesignation = await this.findOrFail(id);

    const empCount = await Employee.count({
      where: { sub_designation: id, status: ['Active', 'On_Probation'] },
    });
    if (empCount > 0) {
      throw new AppError(
        `Cannot delete "${subDesignation.name}" — ${empCount} active employee(s) hold this sub-designation. Reassign them first.`,
        409,
      );
    }

    await subDesignation.update({ is_active: false, updated_by: deletedBy ?? null });
    await subDesignation.destroy();

    await logActivity({
      companyId,
      employeeId: deletedBy,
      action: 'SUB_DESIGNATION_DELETED',
      module: 'sub_designations',
      entityId: id,
      oldValues: { name: subDesignation.name },
    });
  }

  // ─── Toggle active status ──────────────────────────────────────────────────
  // async toggleActive(id: number, updatedBy?: number): Promise<SubDesignation> {
  //   const subDesignation = await this.findOrFail(id);
  //   return this.update(id, { is_active: !subDesignation.is_active }, updatedBy);
  // }

  // ─── Private ───────────────────────────────────────────────────────────────
  private async findOrFail(id: number): Promise<SubDesignation> {
    const sd = await SubDesignation.findOne({ where: { id } });
    if (!sd) throw new AppError('Sub-Designation not found', 404);
    return sd;
  }
}
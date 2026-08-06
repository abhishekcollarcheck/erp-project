import { Op, WhereOptions, fn, col } from 'sequelize';
import { Designation } from '../../database/models/Designation';
import { Employee }    from '../../database/models/Employee';
import { AppError }    from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface CreateDesignationDto {
  designation_name:   string;
}

export interface UpdateDesignationDto {
  designation_name?:  string;
  is_active?:         boolean;
}

export interface DesignationQueryParams {
  is_active?:         boolean | string;
  search?:            string;
}

export class DesignationService {
  async getAll(query: DesignationQueryParams = {}) {
    const where: WhereOptions = { };
    if (query.is_active === 'false' || query.is_active === false) {
      where['is_active'] = false;
    } else if (query.is_active === 'all') {
    } else {
      where['is_active'] = true;
    }

    if (query.search) {
      (where as any)[Op.or] = [
        { designation_name:  { [Op.like]: `%${query.search}%` } },
      ];
    }

    const designations = await Designation.findAll({
      where,
      order: [['designation_name', 'ASC']],
    });

    const designationIds = designations.map((d) => d.id);
    const empCounts = designationIds.length
      ? await Employee.findAll({
          where: { designation_id: designationIds, status: ['Active', 'On_Probation'] },
          attributes: ['designation_id', [fn('COUNT', col('id')), 'count']],
          group: ['designation_id'],
          raw: true,
        })
      : [];

    const countMap = new Map<number, number>(
      (empCounts as any[]).map((r) => [r.designation_id, Number(r.count)]),
    );

    return designations.map((d) => ({
      ...d.toJSON(),
      employee_count: countMap.get(d.id) ?? 0,
    }));
  }

  async getById(id: number, companyId: number) {
    const designation = await Designation.findOne({
      where: { id },
      include: [
        {
          model:      Employee,
          as:         'employees',
          attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'department_id'],
          where:      { status: ['Active', 'On_Probation'] },
          required:   false,
        },
      ],
    });

    if (!designation) throw new AppError('Designation not found', 404);
    return designation;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────
  async getStats() {
    const [total, active] = await Promise.all([
      Designation.count({ where: { is_active: true } }),
      Designation.count({ where: { is_active: true } }),
    ]);

    const empCounts = await Employee.findAll({
      where:      { status: ['Active', 'On_Probation'] },
      attributes: ['designation_id', [fn('COUNT', col('Employee.id')), 'count']],
      include:    [{
        model:      Designation,
        as:         'designation',
        where:      { },
        attributes: ['designation_name'],
        required:   true,
      }],
      group:   ['designation_id'],
      order:   [[fn('COUNT', col('Employee.id')), 'DESC']],
      limit:   1,
      raw:     true,
      nest:    true,
    });

    const top = empCounts[0] as any;
    return {
      total,
      active,
      inactive: total - active,
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(companyId: number, dto: CreateDesignationDto, createdBy?: number): Promise<Designation> {
    const designation = await Designation.create({
      designation_name:  dto.designation_name.trim(),
      is_active:     true,
      created_by:    createdBy ?? null,
    });

    await logActivity({
      companyId, employeeId: createdBy,
      action: 'DESIGNATION_CREATED', module: 'designations', entityId: designation.id,
    });

    return this.getById(designation.id, companyId);
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: number, companyId: number, dto: UpdateDesignationDto, updatedBy?: number): Promise<Designation> {
    const designation = await this.findOrFail(id, companyId);

    const before = {
      designation_name: designation.designation_name,
      is_active:     designation.is_active,
    };

    await designation.update({
      designation_name: dto.designation_name?.trim()  ?? designation.designation_name,
      is_active:     dto.is_active     !== undefined ? dto.is_active    : designation.is_active,
      updated_by:    updatedBy         ?? null,
    });

    await logActivity({
      companyId, employeeId: updatedBy,
      action: 'DESIGNATION_UPDATED', module: 'designations', entityId: id,
      oldValues: before as Record<string, unknown>,
      newValues: { name: designation.designation_name, is_active: designation.is_active },
    });

    return this.getById(id, companyId);
  }

  // ─── Soft delete ───────────────────────────────────────────────────────────
  async delete(id: number, companyId: number, deletedBy?: number): Promise<void> {
    const designation = await this.findOrFail(id, companyId);

    const empCount = await Employee.count({
      where: { designation_id: id, status: ['Active', 'On_Probation'] },
    });
    if (empCount > 0) {
      throw new AppError(
        `Cannot delete "${designation.designation_name}" — ${empCount} active employee(s) hold this designation. Reassign them first.`,
        409,
      );
    }

    await designation.update({ is_active: false, updated_by: deletedBy ?? null });
    await designation.destroy();

    await logActivity({
      companyId, employeeId: deletedBy,
      action: 'DESIGNATION_DELETED', module: 'designations', entityId: id,
      oldValues: { name: designation.designation_name },
    });
  }

  // ─── Toggle active status ──────────────────────────────────────────────────
  async toggleActive(id: number, companyId: number, updatedBy?: number): Promise<Designation> {
    const designation = await this.findOrFail(id, companyId);
    return this.update(id, companyId, { is_active: !designation.is_active }, updatedBy);
  }

  // ─── Private ───────────────────────────────────────────────────────────────
  private async findOrFail(id: number, companyId: number): Promise<Designation> {
    const d = await Designation.findOne({ where: { id } });
    if (!d) throw new AppError('Designation not found', 404);
    return d;
  }
}

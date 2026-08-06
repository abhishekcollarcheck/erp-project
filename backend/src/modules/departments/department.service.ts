import { Op, WhereOptions, fn, col, literal } from 'sequelize';
import { Department }  from '../../database/models/Department';
import { Designation } from '../../database/models/Designation';
import { Employee }    from '../../database/models/Employee';
import { AppError }    from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface CreateDepartmentDto {
  department_name:     string;
  department_code?:    string | null;
  head_id?:            number | null;
}

export interface UpdateDepartmentDto {
  department_name?:    string;
  department_code?:    string | null;
  head_id?:            number | null;
  is_active?:          boolean;
}

export interface DepartmentQueryParams {
  search?:    string;
  is_active?: string | boolean;
}

export class DepartmentService {

async getAll(query: DepartmentQueryParams = {}) {
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
      { department_name: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const departments = await Department.findAll({
    where,
    order: [['department_name', 'ASC']],
  });

  const deptIds = departments.map((d) => d.id);

  const empCounts = await Employee.findAll({
    where: {
      department_id: deptIds,
      status: ['Active', 'On_Probation'],
    },
    attributes: [
      'department_id',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['department_id'],
    raw: true,
  });

  const countMap = new Map<number, number>(
    empCounts.map((r: any) => [r.department_id, Number(r.count)]),
  );

  return departments.map((d) => ({
    ...d.toJSON(),
    employee_count: countMap.get(d.id) ?? 0,
  }));
}

  async getById(id: number, companyId: number) {
    const dept = await Department.findOne({
      where: { id},
      include: [
        {
          model:      Employee,
          as:         'head',
          attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
          required:   false,
        },
        {
          model:      Employee,
          as:         'employees',
          attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
          where:      { status: ['Active', 'On_Probation'] },
          required:   false,
        },
      ],
    });

    if (!dept) throw new AppError('Department not found', 404);
    return dept;
  }

  // ─── Summary stats ────────────────────────────────────────────────────────
  async getStats() {
    const [total, active] = await Promise.all([
      Department.count(),
      Department.count({ where: { is_active: true } }),
    ]);

    const empCounts = await Employee.findAll({
      where: { status: ['Active', 'On_Probation'] },
      include: [{
        model:      Department,
        as:         'department',
        where:      { },
        attributes: [],
        required:   true,
      }],
      attributes: ['department_id', [fn('COUNT', col('Employee.id')), 'count']],
      group: ['department_id'],
      raw: true,
    });

    const largest = empCounts.reduce(
      (max: any, r: any) => (Number(r.count) > Number(max?.count ?? 0) ? r : max),
      null,
    );

    return {
      total,
      active,
      inactive: total - active,
      largestDeptId: largest ? Number(largest.department_id) : null,
      largestDeptCount: largest ? Number(largest.count) : 0,
    };
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  async create(companyId: number, dto: CreateDepartmentDto, createdBy?: number) {
    const existing = await Department.findOne({
      where: { department_name: dto.department_name.trim(), is_active: true },
    });
    if (existing) throw new AppError(`Department "${dto.department_name}" already exists`, 409);

    const dept = await Department.create({
      department_name:       dto.department_name.trim(),
      department_code:       dto.department_code?.toUpperCase().trim() || null,
      is_active:  true,
      created_by: createdBy ?? null,
    });

    await logActivity({
      companyId, employeeId: createdBy,
      action: 'DEPARTMENT_CREATED', module: 'departments', entityId: dept.id,
      newValues: { department_name: dept.department_name,},
    });

    return this.getById(dept.id, companyId);
  }

  // ─── Update ───────────────────────────────────────────────────────────────
  async update(id: number, companyId: number, dto: UpdateDepartmentDto, updatedBy?: number) {
    const dept = await Department.findOne({ where: { id } });
    if (!dept) throw new AppError('Department not found', 404);

    const before = { department_name: dept.department_name, is_active: dept.is_active };

    await dept.update({
      department_name: dto.department_name?.trim() ?? dept.department_name,
      department_code: dto.department_code?.toUpperCase().trim() ?? dept.department_code,
      is_active:  dto.is_active !== undefined ? dto.is_active : dept.is_active,
      updated_by: updatedBy ?? null,
    });

    await logActivity({
      companyId, employeeId: updatedBy,
      action: 'DEPARTMENT_UPDATED', module: 'departments', entityId: id,
      oldValues: before as Record<string, unknown>,
      newValues: { department_name: dept.department_name, is_active: dept.is_active },
    });

    return this.getById(id, companyId);
  }

  // ─── Soft delete ──────────────────────────────────────────────────────────
  async delete(id: number, companyId: number, deletedBy?: number) {
    const dept = await Department.findOne({ where: { id } });
    if (!dept) throw new AppError('Department not found', 404);

    const empCount = await Employee.count({
      where: { department_id: id, status: ['Active', 'On_Probation'] },
    });
    if (empCount > 0)
      throw new AppError(
        `Cannot delete "${dept.department_name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
        409,
      );

    await dept.update({ is_active: false, deleted_by: deletedBy ?? null });
    await dept.destroy();

    await logActivity({
      companyId, employeeId: deletedBy,
      action: 'DEPARTMENT_DELETED', module: 'departments', entityId: id,
      oldValues: { department_name: dept.department_name },
    });
  }
}

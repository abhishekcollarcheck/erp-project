import { Op, WhereOptions, fn, col, literal } from 'sequelize';
import { SubDepartment } from '../../database/models';
import { Employee } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface CreateSubDepartmentDto {
    name: string;
}

export interface UpdateSubDepartmentDto {
    name?: string;
    is_active?: boolean;
}

export interface SubDepartmentQueryParams {
    search?: string;
    is_active?: string | boolean;
}

export class SubDepartmentService {
    async getAll(query: SubDepartmentQueryParams = {}) {
        const where: WhereOptions = {};

        if (query.is_active === 'false' || query.is_active === false) {
            where['is_active'] = false;
        } else if (query.is_active === 'all') {
        } else {
            where['is_active'] = true;
        }

        if (query.search) {
            (where as any)[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
            ];
        }

        const subdepartments = await SubDepartment.findAll({
            where,
            order: [['name', 'ASC']],
        });

        const deptIds = subdepartments.map((d) => d.id);

        const empCounts = await Employee.findAll({
            where: {
                sub_department_id: deptIds,
                status: ['Active', 'On_Probation'],
            },
            attributes: [
                'sub_department_id',
                [fn('COUNT', col('id')), 'count'],
            ],
            group: ['sub_department_id'],
            raw: true,
        });

        const countMap = new Map<number, number>(
            empCounts.map((r: any) => [r.sub_department_id, Number(r.count)]),
        );

        return subdepartments.map((d) => ({
            ...d.toJSON(),
            employee_count: countMap.get(d.id) ?? 0,
        }));
    }

    async getById(id: number) {
        const dept = await SubDepartment.findOne({
            where: { id },
            include: [
                {
                    model: Employee,
                    as: 'employees',
                    attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
                    where: { status: ['Active', 'On_Probation'] },
                    required: false,
                },
            ],
        });
        if (!dept) throw new AppError('Sub Department not found', 404);
        return dept;
    }

    async create(dto: CreateSubDepartmentDto, createdBy?: number) {
        const existing = await SubDepartment.findOne({
            where: { name: dto.name.trim(), is_active: true },
        });
        if (existing) throw new AppError(`Sub Department "${dto.name}" already exists`, 409);

        const dept = await SubDepartment.create({
            name: dto.name.trim(),
            is_active: true,
            created_by: createdBy ?? null,
        });

        await logActivity({
            companyId: 0, employeeId: createdBy,
            action: 'SUBDEPARTMENT_CREATED', module: 'subdepartments', entityId: dept.id,
            newValues: { name: dept.name, },
        });

        return this.getById(dept.id);
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    async update(id: number, companyId: number, dto: UpdateSubDepartmentDto, updatedBy?: number) {
        const dept = await SubDepartment.findOne({ where: { id } });
        if (!dept) throw new AppError('Sub Department not found', 404);

        const before = { name: dept.name, is_active: dept.is_active };

        await dept.update({
            name: dto.name?.trim() ?? dept.name,
            is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
            updated_by: updatedBy ?? null,
        });

        await logActivity({
            companyId, employeeId: updatedBy,
            action: 'SUBDEPARTMENT_UPDATED', module: 'subdepartments', entityId: id,
            oldValues: before as Record<string, unknown>,
            newValues: { name: dept.name, is_active: dept.is_active },
        });

        return this.getById(id);
    }

    // ─── Soft delete ──────────────────────────────────────────────────────────
    async delete(id: number, companyId: number, deletedBy?: number) {
        const dept = await SubDepartment.findOne({ where: { id } });
        if (!dept) throw new AppError('Sub Department not found', 404);

        const empCount = await Employee.count({
            where: { sub_department_id: id, status: ['Active', 'On_Probation'] },
        });
        if (empCount > 0)
            throw new AppError(
                `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
                409,
            );
        await dept.update({ is_active: false, deleted_by: deletedBy ?? null });
        await dept.destroy();

        await logActivity({
            companyId, employeeId: deletedBy,
            action: 'SUBDEPARTMENT_DELETED', module: 'subdepartments', entityId: id,
            oldValues: { name: dept.name },
        });
    }
}
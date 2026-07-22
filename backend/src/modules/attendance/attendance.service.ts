import { Op } from 'sequelize';
import { Attendance, AttendanceStatus } from '../../database/models/Attendance';
import { AttendanceRegularization, RegularizationStatus } from '../../database/models/AttendanceRegularization';
import { Employee } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { PaginatedResponse } from "@/utils/response";

export interface MarkAttendanceDto {
  company_id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  remarks?: string | null;
  created_by?: number | null;
}

export interface AttendanceQueryParams {
  page?: number | string;
  limit?: number | string;
  employee_id?: number | string;
  search?: string;
  status?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
  month?: number | string;
  year?: number | string;
  sort?: 'date_asc' | 'date_desc';
}

export interface CreateRegularizationDto {
  company_id: number;
  employee_id: number;
  date: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  reason: string;
  created_by: number;
}

// Shape attached to attendance/regularization rows in place of Sequelize's
// `include` — built manually below to avoid depending on how your
// Attendance<->Employee association alias is configured.
interface EmployeeSummary {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
}

export class AttendanceService {
  // ─── Today summary for dashboard ──────────────────────────────────────────
  async getTodaySummary(companyId: number) {
    // Fixed: toISOString() is UTC — between 00:00–05:30 IST this returned
    // yesterday's date, same bug already fixed in attendance.mssql.service.ts.
    // Using the identical approach here so both services agree on "today".
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const companyEmployeeIds = (
      await Employee.findAll({ where: { company_id: companyId }, attributes: ['id'] })
    ).map((e: any) => e.id);

    const totalActive = await Employee.count({
      where: { company_id: companyId, status: 'Active' },
    });

    const records = companyEmployeeIds.length
      ? await Attendance.findAll({
          where: { date: today, employee_id: { [Op.in]: companyEmployeeIds } },
        })
      : [];

    const summary = { total: totalActive, present: 0, absent: 0, wfh: 0, onLeave: 0, halfDay: 0 };
    for (const r of records) {
      if (r.status === 'Present') summary.present++;
      else if (r.status === 'Absent') summary.absent++;
      else if (r.status === 'WFH') summary.wfh++;
      else if (r.status === 'Leave') summary.onLeave++;
      else if (r.status === 'Half-Day') summary.halfDay++;
    }
    return summary;
  }

  async getByEmployee(employeeId: number, month: number, year: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const paddedMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    return Attendance.findAll({
      where: {
        employee_id: employeeId,
        date: {
          [Op.between]: [`${year}-${paddedMonth}-01`, `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`],
        },
      },
      order: [['date', 'ASC']],
    });
  }

  // ─── Paginated list with the full filter set ──────────────────────────────
  async getAll(
    query: AttendanceQueryParams,
    companyId: number
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

    // Step 1: resolve which employees are in scope (tenant + optional search)
    // as a plain query — no include/alias involved.
    const employeeWhere: Record<string, unknown> = { company_id: companyId };
    if (query.search) {
      employeeWhere[Op.or as any] = [
        { first_name: { [Op.like]: `%${query.search}%` } },
        { last_name: { [Op.like]: `%${query.search}%` } },
        { employee_code: { [Op.like]: `%${query.search}%` } },
      ];
    }
    const scopedEmployees = await Employee.findAll({
      where: employeeWhere,
      attributes: ['id', 'first_name', 'last_name', 'employee_code'],
    });
    const employeeMap = new Map<number, EmployeeSummary>(
      scopedEmployees.map((e: any) => [e.id, {
        id: e.id, first_name: e.first_name, last_name: e.last_name, employee_code: e.employee_code,
      }])
    );

    if (employeeMap.size === 0) {
      return { data: [], meta: buildPaginationMeta(page, limit, 0) };
    }

    // Step 2: attendance filters
    const where: Record<string, unknown> = {
      employee_id: query.employee_id ? query.employee_id : { [Op.in]: Array.from(employeeMap.keys()) },
    };
    if (query.status) where['status'] = query.status;
    if (query.source) where['source'] = query.source;

    if (query.date_from && query.date_to) {
      where['date'] = { [Op.between]: [query.date_from, query.date_to] };
    } else if (query.date_from) {
      where['date'] = { [Op.gte]: query.date_from };
    } else if (query.date_to) {
      where['date'] = { [Op.lte]: query.date_to };
    } else if (query.month && query.year) {
      const month = Number(query.month);
      const year = Number(query.year);
      const paddedMonth = String(month).padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      where['date'] = {
        [Op.between]: [`${year}-${paddedMonth}-01`, `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`],
      };
    }

    const sortDir = query.sort === 'date_asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', sortDir]],
    });

    // Step 3: attach employee info manually (plain objects, not Sequelize
    // instances, so the extra `Employee` key actually serializes in the
    // JSON response — assigning it onto a Sequelize instance would not).
    const data = rows.map((r: any) => ({
      ...r.get({ plain: true }),
      Employee: employeeMap.get(r.employee_id) ?? null,
    }));

    return { data, meta: buildPaginationMeta(page, limit, count) };
  }

  // ─── Mark / update attendance (upsert on company_id + employee_id + date) ─
  async mark(dto: MarkAttendanceDto) {
    const [record, created] = await Attendance.upsert({
      company_id: dto.company_id,
      employee_id: dto.employee_id,
      date: dto.date,
      status: dto.status,
      check_in: dto.check_in ?? null,
      check_out: dto.check_out ?? null,
      remarks: dto.remarks ?? null,
      created_by: dto.created_by ?? null,
      source: 'Manual',
    });
    return { record, created };
  }

  // ─── Bulk mark for a team / department ────────────────────────────────────
  async bulkMark(
    records: MarkAttendanceDto[],
    createdBy: number,
    companyId: number,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const dto of records) {
      try {
        await this.mark({ ...dto, company_id: companyId, created_by: createdBy });
        success++;
      } catch (e: any) {
        failed++;
        errors.push(`employee_id ${dto.employee_id} on ${dto.date}: ${e.message}`);
      }
    }
    return { success, failed, errors };
  }

  // ─── Find single record (tenant-scoped) ───────────────────────────────────
  async findById(id: number, companyId: number) {
    // Fixed: same alias issue — verify tenant ownership via a separate
    // Employee lookup instead of an aliased include.
    const record = await Attendance.findByPk(id);
    if (!record) throw new AppError('Attendance record not found', 404);

    const employee = await Employee.findOne({ where: { id: record.employee_id, company_id: companyId } });
    if (!employee) throw new AppError('Attendance record not found', 404); // don't leak cross-tenant existence

    return record;
  }

  // ─── Update existing record (tenant-scoped, whitelisted fields) ───────────
  async update(
    id: number,
    dto: Partial<Pick<MarkAttendanceDto, 'status' | 'check_in' | 'check_out' | 'remarks'>>,
    companyId: number,
  ) {
    const record = await this.findById(id, companyId);
    await record.update({
      status: dto.status ?? record.status,
      check_in: dto.check_in ?? record.check_in,
      check_out: dto.check_out ?? record.check_out,
      remarks: dto.remarks ?? record.remarks,
    });
    return record;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Regularization requests
  // ═══════════════════════════════════════════════════════════════════════

  async createRegularization(dto: CreateRegularizationDto) {
    if (!dto.requested_check_in && !dto.requested_check_out) {
      throw new AppError('Provide at least a requested check-in or check-out time', 400);
    }
    return AttendanceRegularization.create({
      company_id: dto.company_id,
      employee_id: dto.employee_id,
      date: dto.date,
      requested_check_in: dto.requested_check_in ?? null,
      requested_check_out: dto.requested_check_out ?? null,
      reason: dto.reason,
      created_by: dto.created_by,
    });
  }

  async listMyRegularizations(employeeId: number, companyId: number) {
    return AttendanceRegularization.findAll({
      where: { employee_id: employeeId, company_id: companyId },
      order: [['created_at', 'DESC']],
    });
  }

  async listPendingRegularizations(companyId: number) {
    // Fixed: same alias issue — batch-load employees separately, then
    // attach them manually onto plain objects.
    const requests = await AttendanceRegularization.findAll({
      where: { company_id: companyId, status: 'Pending' },
      order: [['created_at', 'ASC']],
    });
    if (requests.length === 0) return [];

    const employeeIds = Array.from(new Set(requests.map((r: any) => r.employee_id)));
    const employees = await Employee.findAll({
      where: { id: { [Op.in]: employeeIds }, company_id: companyId },
      attributes: ['id', 'first_name', 'last_name', 'employee_code'],
    });
    const employeeMap = new Map<number, EmployeeSummary>(
      employees.map((e: any) => [e.id, {
        id: e.id, first_name: e.first_name, last_name: e.last_name, employee_code: e.employee_code,
      }])
    );

    return requests.map((r: any) => ({
      ...r.get({ plain: true }),
      Employee: employeeMap.get(r.employee_id) ?? null,
    }));
  }

  async reviewRegularization(
    id: number,
    companyId: number,
    decision: RegularizationStatus,
    reviewerId: number,
    remarks?: string,
  ) {
    const request = await AttendanceRegularization.findOne({ where: { id, company_id: companyId } });
    if (!request) throw new AppError('Regularization request not found', 404);
    if (request.status !== 'Pending') throw new AppError(`Request already ${request.status.toLowerCase()}`, 409);

    await request.update({
      status: decision,
      reviewed_by: reviewerId,
      reviewed_at: new Date(),
      review_remarks: remarks ?? null,
    });

    if (decision === 'Approved') {
      await this.mark({
        company_id: companyId,
        employee_id: request.employee_id,
        date: request.date,
        status: 'Present',
        check_in: request.requested_check_in,
        check_out: request.requested_check_out,
        remarks: `Regularized: ${request.reason}`,
        created_by: reviewerId,
      });
    }
    return request;
  }
}
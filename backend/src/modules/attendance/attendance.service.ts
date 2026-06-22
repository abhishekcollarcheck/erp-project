import { Op } from 'sequelize';
import { Attendance, AttendanceStatus } from '../../database/models/Attendance';
import { Employee } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { PaginatedResponse } from "@/utils/response";

export interface MarkAttendanceDto {
  company_id: number;    // ← added — required for isolation
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
  month?: number | string;
  year?: number | string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export class AttendanceService {

  // ─── Today summary for dashboard ──────────────────────────────────────────
  async getTodaySummary(companyId: number) {
    const today = new Date().toISOString().split('T')[0];

    const totalActive = await Employee.count({
      where: { company_id: companyId, status: 'Active' },
    });

    // Now uses company_id directly — no JOIN needed
    const records = await Attendance.findAll({
      where: { company_id: companyId, date: today },
    });

    const summary = { total: totalActive, present: 0, absent: 0, wfh: 0, onLeave: 0, halfDay: 0 };
    for (const r of records) {
      if      (r.status === 'Present')  summary.present++;
      else if (r.status === 'Absent')   summary.absent++;
      else if (r.status === 'WFH')      summary.wfh++;
      else if (r.status === 'Leave')    summary.onLeave++;
      else if (r.status === 'Half-Day') summary.halfDay++;
    }

    return summary;
  }

  // ─── Monthly records for one employee ─────────────────────────────────────
  async getByEmployee(employeeId: number, month: number, year: number, companyId: number) {
    const paddedMonth = String(month).padStart(2, '0');
    return Attendance.findAll({
      where: {
        company_id: companyId,      // ← direct filter
        employee_id: employeeId,
        date: {
          [Op.between]: [`${year}-${paddedMonth}-01`, `${year}-${paddedMonth}-31`],
        },
      },
      order: [['date', 'ASC']],
    });
  }

  // ─── Paginated list (company-scoped) ──────────────────────────────────────
  async getAll(
    query: AttendanceQueryParams,
    companyId: number,
  ): Promise<PaginatedResponse<any>> {
    const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

    const where: Record<string, unknown> = {
      company_id: companyId,   // ← direct filter — no JOIN required
    };

    if (query.employee_id) where['employee_id'] = Number(query.employee_id);
    if (query.status)      where['status']      = query.status;

    if (query.date_from && query.date_to) {
      where['date'] = { [Op.between]: [query.date_from, query.date_to] };
    } else if (query.date_from) {
      where['date'] = { [Op.gte]: query.date_from };
    } else if (query.month && query.year) {
      const m = String(query.month).padStart(2, '0');
      where['date'] = { [Op.between]: [`${query.year}-${m}-01`, `${query.year}-${m}-31`] };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'DESC']],
      include: [{
        model:      Employee,
        attributes: ['id', 'first_name', 'last_name', 'employee_code'],
        required:   false,
      }],
    });

    return {
      data: rows,
      meta: buildPaginationMeta(page, limit, count),
    };
  }

  // ─── Mark / update attendance (upsert on company_id + employee_id + date) ─
  async mark(dto: MarkAttendanceDto) {
    const [record, created] = await Attendance.upsert({
      company_id:    dto.company_id,    // ← included in upsert key
      employee_id:   dto.employee_id,
      date:          dto.date,
      status:        dto.status,
      check_in:      dto.check_in  ?? null,
      check_out:     dto.check_out ?? null,
      remarks:       dto.remarks   ?? null,
      created_by:    dto.created_by ?? null,
      source:        'Manual',
    });
    return { record, created };
  }

  // ─── Bulk mark for a team / department ────────────────────────────────────
  async bulkMark(
    records: MarkAttendanceDto[],
    createdBy: number,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed  = 0;

    for (const dto of records) {
      try {
        await this.mark({ ...dto, created_by: createdBy });
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  // ─── Find single record ───────────────────────────────────────────────────
  async findById(id: number, companyId: number) {
    const record = await Attendance.findOne({
      where: { id, company_id: companyId },   // ← company check on findById too
    });
    if (!record) throw new AppError('Attendance record not found', 404);
    return record;
  }

  // ─── Update existing record ───────────────────────────────────────────────
  async update(
    id: number,
    companyId: number,
    dto: Partial<MarkAttendanceDto>,
    updatedBy?: number,
  ) {
    const record = await this.findById(id, companyId);
    await record.update({ ...dto });
    return record;
  }
}
import { Op, WhereOptions } from 'sequelize';
import { LeaveRequest, LeaveType } from '../../database/models/LeaveModels';
import { Employee } from '../../database/models/Employee';
import { EmployeeCommitmentProbation } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { logActivity } from '../../utils/activityLogger';
import { computeMonthlyAccrualHistory } from './leave-accrual.service';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * FIELD-NAME ASSUMPTIONS — ISOLATED HERE SO ANY ONE OF THEM IS A ONE-LINE FIX
 * ═══════════════════════════════════════════════════════════════════════
 *   L1 manager       Employee.l1_manager_id  — CONFIRMED by you
 *   L2 manager       Employee.l2_manager_id  — CONFIRMED by you
 *   Join date        Employee.current_doj    — CONFIRMED field exists, but
 *                    I picked current_doj over actual_doj myself (reasoning:
 *                    current_doj should reflect the start of CURRENT
 *                    continuous service, which is what leave-year accrual
 *                    should be based on; actual_doj sounds like the
 *                    original/historical hire date). CONFIRM THIS CHOICE.
 *   Probation        EmployeeCommitmentProbation.on_probation — CONFIRMED
 *                    field/table exists, but the model IMPORT PATH and the
 *                    FK column name linking it to Employee are GUESSED
 *                    below (assumed `employee_id`). Correct if wrong.
 *   Override perm    'leaves:approve' — your original code's own slug.
 * ═══════════════════════════════════════════════════════════════════════
 */
const OVERRIDE_PERMISSION = 'leaves:approve';

// Leave type codes with special handling in apply() — see below
const EL_CODE = 'EL';
const SHORT_LEAVE_CODE = 'ShL';

export interface ApplyLeaveDto {
  employee_id: number;
  leave_type_id: number;
  from_date: string;
  to_date: string;
  days: number;
  half_day?: boolean;
  reason?: string;
}

export interface LeaveQueryParams {
  page?: number | string;
  limit?: number | string;
  employee_id?: number | string;
  status?: string;
  leave_type_id?: number | string;
}

export class LeaveService {
  // ─── List leave requests (self-scoped by default) ──────────────────────────
  async getAll(query: LeaveQueryParams, requestingEmployeeId: number, companyId: number) {
    const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

    const where: WhereOptions = { employee_id: requestingEmployeeId };
    if (query.status)        where['status']        = query.status;
    if (query.leave_type_id) where['leave_type_id'] = Number(query.leave_type_id);

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'code', 'is_paid'] },
        {
          model: Employee,
          as: 'employee',
          where: { company_id: companyId },
          attributes: ['id', 'first_name', 'last_name', 'employee_code', 'avatar_url'],
        },
      ],
    });

    return { rows, meta: buildPaginationMeta(page, limit, count) };
  }

  // ─── Pending approvals ──────────────────────────────────────────────────────
  // Shows: if caller has the override permission, ALL pending requests
  // company-wide. Otherwise, only requests where caller is the L1 OR L2
  // manager of that employee.
  async getPendingForManager(managerId: number, companyId: number, hasOverridePermission: boolean) {
    const employeeWhere: WhereOptions = { company_id: companyId };
    if (!hasOverridePermission) {
      (employeeWhere as any)[Op.or] = [
        { l1_manager_id: managerId },
        { l2_manager_id: managerId },
      ];
    }

    return LeaveRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] },
        {
          model: Employee,
          as: 'employee',
          where: employeeWhere,
          attributes: ['id', 'first_name', 'last_name', 'employee_code'],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  // ─── Apply for leave ───────────────────────────────────────────────────────
  async apply(dto: ApplyLeaveDto, companyId: number) {
    const employee = await Employee.findOne({ where: { id: dto.employee_id, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found in this company', 404);

    const leaveType = await LeaveType.findOne({
      where: {
        id: dto.leave_type_id,
        is_active: true,
        [Op.or]: [{ company_id: null }, { company_id: companyId }],
      },
    });
    if (!leaveType) throw new AppError('Leave type not found or inactive', 404);

    // Probation gate: Short Leave and Casual Leave remain available during
    // probation; Earned Leave does not, per your point 5. Looked up from
    // the separate employee_commitment_probation table, not a date field
    // on Employee.
    const probationRecord = await EmployeeCommitmentProbation.findOne({
      where: { employee_id: dto.employee_id },
    });
    const isOnProbation = !!probationRecord?.on_probation;
    if (isOnProbation && leaveType.code === EL_CODE) {
      throw new AppError('Earned Leave is not available during probation', 403);
    }

    // Short Leave increment check: must be exactly 0.5 or 1.0 (30 or 60 min),
    // not an arbitrary value — per "30min-30min or full 1 hour".
    if (leaveType.code === SHORT_LEAVE_CODE && dto.days !== 0.5 && dto.days !== 1) {
      throw new AppError('Short Leave must be 0.5 (30 min) or 1 (60 min)', 400);
    }

    // Balance check — skipped for Short Leave for now (deferred: how it
    // interacts with Attendance wasn't decided yet). CL/EL now use the
    // month-by-month ARREARS engine (leave-accrual.service.ts) instead of
    // the old single-formula advance calculation — each completed month is
    // credited only if that month's actual working-days count cleared the
    // threshold.
    if (leaveType.code !== SHORT_LEAVE_CODE) {
      if (!employee.current_doj) {
        throw new AppError('Employee has no join date on record — cannot compute leave balance', 500);
      }
      const joinDate = new Date(employee.current_doj);
      const leaveYearStart = new Date(new Date().getFullYear(), 0, 1);
      const history = await computeMonthlyAccrualHistory(dto.employee_id, companyId, joinDate, leaveYearStart);
      const accrued = leaveType.code === EL_CODE ? history.totalEL : history.totalCL;

      const usedSoFar = await this.getUsedDaysThisYear(dto.employee_id, dto.leave_type_id);
      const available = Math.max(0, Math.round((accrued - usedSoFar) * 100) / 100);

      if (dto.days > available) {
        throw new AppError(
          `Insufficient ${leaveType.name} balance — ${available} day(s) available, ${dto.days} requested`,
          400,
        );
      }
    }

    // Check for overlapping approved/pending leaves
    const overlap = await LeaveRequest.findOne({
      where: {
        employee_id: dto.employee_id,
        status:      { [Op.in]: ['Pending', 'Approved'] },
        [Op.or]: [
          { from_date: { [Op.between]: [dto.from_date, dto.to_date] } },
          { to_date:   { [Op.between]: [dto.from_date, dto.to_date] } },
          {
            from_date: { [Op.lte]: dto.from_date },
            to_date:   { [Op.gte]: dto.to_date },
          },
        ],
      },
    });

    if (overlap) {
      throw new AppError(
        `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
        409,
      );
    }

    return LeaveRequest.create({
      employee_id:   dto.employee_id,
      leave_type_id: dto.leave_type_id,
      from_date:     dto.from_date,
      to_date:       dto.to_date,
      days:          dto.days,
      half_day:      dto.half_day ?? false,
      reason:        dto.reason   ?? null,
      status:        'Pending',
    });
  }

  // ─── Approve ───────────────────────────────────────────────────────────────
  async approve(
    id: number,
    approvedBy: number,
    companyId: number,
    caller: { permissions: string[] },
  ) {
    const leave = await this.findByIdScoped(id, companyId);
    this.assertCanActOnLeave(leave, approvedBy, caller);
    if (leave.status !== 'Pending')
      throw new AppError('Only Pending requests can be approved', 400);

    await leave.update({ status: 'Approved', approved_by: approvedBy, approved_at: new Date() });

    await logActivity({
      companyId,
      employeeId:   approvedBy,
      action:   'LEAVE_APPROVED',
      module:   'leaves',
      entityId: id,
      newValues: { status: 'Approved', approved_by: approvedBy },
    });

    return leave;
  }

  // ─── Reject ────────────────────────────────────────────────────────────────
  async reject(
    id: number,
    rejectedBy: number,
    companyId: number,
    reason: string | undefined,
    caller: { permissions: string[] },
  ) {
    const leave = await this.findByIdScoped(id, companyId);
    this.assertCanActOnLeave(leave, rejectedBy, caller);
    if (leave.status !== 'Pending')
      throw new AppError('Only Pending requests can be rejected', 400);

    await leave.update({ status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null });

    await logActivity({
      companyId,
      employeeId:    rejectedBy,
      action:    'LEAVE_REJECTED',
      module:    'leaves',
      entityId:  id,
      newValues: { status: 'Rejected', reason },
    });

    return leave;
  }

  // ─── Cancel (by employee) ──────────────────────────────────────────────────
  async cancel(id: number, employeeId: number, companyId: number) {
    const leave = await this.findByIdScoped(id, companyId);
    if (leave.employee_id !== employeeId)
      throw new AppError('You can only cancel your own leave requests', 403);
    if (!['Pending', 'Approved'].includes(leave.status))
      throw new AppError('Leave cannot be cancelled in its current state', 400);

    await leave.update({ status: 'Cancelled' });
    return leave;
  }

  // ─── Leave types ───────────────────────────────────────────────────────────
  async getLeaveTypes(companyId: number) {
    return LeaveType.findAll({
      where: {
        is_active: true,
        [Op.or]: [{ company_id: null }, { company_id: companyId }],
      },
      order: [['name', 'ASC']],
    });
  }

  // ─── My balances (self-service) ─────────────────────────────────────────────
  // CL/EL: month-by-month arrears engine (leave-accrual.service.ts).
  // Short Leave: flat monthly allowance, "used" = sum THIS CALENDAR MONTH only.
  async getMyBalances(employeeId: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const leaveTypes = await this.getLeaveTypes(companyId);
    const results = [];

    let cachedHistory: Awaited<ReturnType<typeof computeMonthlyAccrualHistory>> | null = null;

    for (const lt of leaveTypes) {
      if (lt.accrual_period === 'monthly_reset') {
        const usedThisMonth = await this.getUsedDaysThisMonth(employeeId, lt.id);
        const accrued = Number(lt.days_per_year); // flat monthly allowance, no join-date dependency
        results.push({
          leaveTypeId: lt.id, leaveTypeName: lt.name, unit: lt.accrual_unit,
          accrued, used: usedThisMonth, available: Math.max(0, Math.round((accrued - usedThisMonth) * 100) / 100),
        });
      } else {
        if (!employee.current_doj) {
          results.push({
            leaveTypeId: lt.id, leaveTypeName: lt.name, unit: lt.accrual_unit,
            accrued: 0, used: 0, available: 0,
            note: 'No join date on record — cannot compute accrual',
          });
          continue;
        }

        // Compute the month-by-month history once, reuse for both CL and EL
        // — same employee, same join date, same completed-months window.
        if (!cachedHistory) {
          const joinDate = new Date(employee.current_doj);
          const leaveYearStart = new Date(new Date().getFullYear(), 0, 1);
          cachedHistory = await computeMonthlyAccrualHistory(employeeId, companyId, joinDate, leaveYearStart);
        }

        const accrued = lt.code === 'EL' ? cachedHistory.totalEL : cachedHistory.totalCL;
        const usedSoFar = await this.getUsedDaysThisYear(employeeId, lt.id);
        const available = Math.max(0, Math.round((accrued - usedSoFar) * 100) / 100);

        results.push({ leaveTypeId: lt.id, leaveTypeName: lt.name, unit: lt.accrual_unit, accrued, used: usedSoFar, available });
      }
    }

    return results;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────
  private async findByIdScoped(id: number, companyId: number) {
    const leave = await LeaveRequest.findOne({
      where: { id },
      include: [{
        model: Employee,
        as: 'employee',
        where: { company_id: companyId },
        attributes: ['id', 'l1_manager_id', 'l2_manager_id'],
      }],
    });
    if (!leave) throw new AppError('Leave request not found', 404);
    return leave;
  }

  // Approval authority = has the override permission, OR is this specific
  // employee's L1 manager, OR is their L2 manager. Either manager suffices
  // (first mover wins) — no sequential requirement, no escalation.
  private assertCanActOnLeave(
    leave: LeaveRequest & { employee?: { l1_manager_id: number | null; l2_manager_id?: number | null } },
    callerId: number,
    caller: { permissions: string[] },
  ): void {
    if (caller.permissions?.includes(OVERRIDE_PERMISSION) || caller.permissions?.includes('*')) {
      return;
    }

    const employee = (leave as any).employee;
    const isL1 = employee?.l1_manager_id === callerId;
    const isL2 = employee?.l2_manager_id === callerId;

    if (isL1 || isL2) return;

    throw new AppError('You are not authorized to approve/reject this leave request', 403);
  }

  // Sum of Approved + Pending days for this leave type, within the current
  // calendar-year leave period (matches the accrual formula's leave-year
  // assumption in leave-balance.util.ts).
  private async getUsedDaysThisYear(employeeId: number, leaveTypeId: number): Promise<number> {
    const yearStart = `${new Date().getFullYear()}-01-01`;
    const rows = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        status: { [Op.in]: ['Pending', 'Approved'] },
        from_date: { [Op.gte]: yearStart },
      },
      attributes: ['days'],
    });
    return rows.reduce((sum, r) => sum + Number(r.days), 0);
  }

  // Same idea, scoped to the current calendar month — used for Short Leave's
  // monthly_reset balance, since last month's usage shouldn't count against
  // this month's fresh 1-hour allowance.
  private async getUsedDaysThisMonth(employeeId: number, leaveTypeId: number): Promise<number> {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const rows = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        status: { [Op.in]: ['Pending', 'Approved'] },
        from_date: { [Op.gte]: monthStart },
      },
      attributes: ['days'],
    });
    return rows.reduce((sum, r) => sum + Number(r.days), 0);
  }
}
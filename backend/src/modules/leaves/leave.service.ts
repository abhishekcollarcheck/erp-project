// import { Op, Transaction, WhereOptions } from 'sequelize';
// import { LeaveRequest, LeaveType, LeaveApplicationType, EmployeeLeaveBalance } from '../../database/models/LeaveModels';
// import { Employee, EmployeeCommitmentProbation } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
// import { logActivity } from '../../utils/activityLogger';
// import { sequelize } from '../../config/database';
// import { EmployeeMonthlyAttendance } from '../../database/models/EmployeeMonthlyAttendance';


// const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
// const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

// // Leave types whose balance is tracked via EmployeeLeaveBalance
// // (allocated / used / pending / carried_forward). Short Leave is
// // intentionally excluded — it stays on its existing days_per_year check,
// // per instruction to leave that part alone for now.
// const BALANCE_TRACKED_LEAVE_CODES = ['CL', 'EL'];

// // import { Employee } from '../../models/Employee';

// export type EmployeeLeaveStatus =
//   | 'PROBATION'
//   | 'REGULAR_AFTER_PROBATION'
//   | 'REGULAR_CONTINUING'
//   | 'CONTRACTUAL';

// // EmployeeCommitmentProbation

// export interface MonthlyAttendanceSummary {
//   employeeId: number;

//   year: number;
//   month: number;

//   totalCalendarDays: number;
//   workingDays: number;

//   presentDays: number;
//   absentDays: number;
//   halfDays: number;
//   wfhDays: number;
//   leaveDays: number;

//   holidayWorkedDays: number;
//   weeklyOffWorkedDays: number;

//   totalWorkingHours: number;
// }


// export interface EmployeeLeaveInformation {
//   employee: {
//     id: number;
//     employee_code: string | null;

//     first_name: string | null;
//     middle_name: string | null;
//     last_name: string | null;

//     full_name: string;

//     company_id: number | null;

//     status: string | null;
//     employment_type: string | null;

//     email: string | null;
//     phone: string | null;

//     department_id: number | null;
//     sub_department_id: number | null;
//     designation_id: number | null;

//     l1_manager_id: number | null;
//     l2_manager_id: number | null;
//     reporting_manager_id: number | null;

//     actual_doj: string | null;
//     current_doj: string | null;

//     working_site: string | null;
//     working_city: string | null;
//     working_state_country: string | null;
//     pay_register_location: string | null;

//     shift_id: number | null;
//     saturday_off: unknown;

//     grace_minutes: number | null;
//   };

//   probation: {
//     exists: boolean;

//     on_probation: boolean;

//     probation_period: number | null;
//     probation_end_date: string | null;

//     probation_status: string | null;

//     probation_extended_period: number | null;

//     probation_final_status: string | null;

//     confirmation_status: string | null;
//     confirmed_on: string | null;
//     probation_el_credit: number;
//     probation_el_transferred: number;
//   };

//   leave_status: EmployeeLeaveStatus;

//   joining_date: string | null;

//   probation_completed: boolean;
// }



// export interface ApplyLeaveDto {
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string;
//   to_time?: string;
//   days: number;
//   half_day?: boolean;
//   reason?: string;
//   submission_type?: 'self' | 'admin';
//   applied_by: number;
//   hod_name?: string;
//   coordinator_name?: string;
//   undertaking_accepted: boolean;
// }

// export interface LeaveQueryParams {
//   page?: number | string;
//   limit?: number | string;
//   employee_id?: number | string;
//   status?: string;
//   leave_type_id?: number | string;
// }

// export class LeaveService {
//   // ─── List all leave requests (company-scoped) ──────────────────────────────
//   async getAll(query: LeaveQueryParams, companyId: number) {
//     const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

//     const where: WhereOptions = {};
//     if (query.status) where['status'] = query.status;
//     if (query.employee_id) where['employee_id'] = Number(query.employee_id);
//     if (query.leave_type_id) where['leave_type_id'] = Number(query.leave_type_id);

//     const { count, rows } = await LeaveRequest.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: [['created_at', 'DESC']],
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code', 'is_paid'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'avatar_url'],
//         },
//       ],
//     });

//     return { rows, meta: buildPaginationMeta(page, limit, count) };
//   }

//   // ─── Pending approvals ───────────────────────────────────────────────────
//   // Company-wide, not scoped to the caller's direct reports: this route is
//   // already gated behind the `leaves:approve` permission (a broad module-level
//   // grant in this app, not a per-manager relationship), so anyone who can call
//   // it is meant to see and act on every pending request in their company.
//   async getPendingForManager(_managerId: number, companyId: number) {
//     return LeaveRequest.findAll({
//       where: { status: 'Pending' },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//         },
//       ],
//       order: [['created_at', 'ASC']],
//     });
//   }

//   // ─── Apply for leave ───────────────────────────────────────────────────────
//   async apply(dto: ApplyLeaveDto, companyId: number) {
//     // Validate leave type belongs to company
//     const leaveType = await LeaveType.findOne({
//       where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
//     });
//     if (!leaveType) throw new AppError('Leave type not found or inactive', 404);

//     if (SHORT_LEAVE_APPLICATION_TYPES.includes(dto.leave_application_type) && (!dto.from_time || !dto.to_time)) {
//       throw new AppError('From/To time are required for Arrival Late / Leaving Early', 400);
//     }

//     const targetEmployee = await Employee.findOne({
//       where: { id: dto.employee_id, company_id: companyId },
//     });
//     if (!targetEmployee) throw new AppError('Employee not found', 404);

//     // Check for overlapping approved/pending leaves. A 1st Half + 2nd Half pair
//     // on the exact same single date is NOT a conflict — they occupy different
//     // halves of the day (e.g. CL morning + EL afternoon). Every other combination
//     // (full day, multi-day range, same half twice, etc.) is treated as a clash.
//     const candidates = await LeaveRequest.findAll({
//       where: {
//         employee_id: dto.employee_id,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         [Op.or]: [
//           { from_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           { to_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           {
//             from_date: { [Op.lte]: dto.from_date },
//             to_date: { [Op.gte]: dto.to_date },
//           },
//         ],
//       },
//     });

//     const newIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(dto.leave_application_type) && dto.from_date === dto.to_date;

//     const overlap = candidates.find((existing) => {
//       const existingIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(existing.leave_application_type)
//         && existing.from_date === existing.to_date;
//       const sameSingleDay = newIsHalfDay && existingIsHalfDay && existing.from_date === dto.from_date;
//       const differentHalves = existing.leave_application_type !== dto.leave_application_type;
//       if (sameSingleDay && differentHalves) return false; // compatible — different halves of the same day
//       return true;
//     });

//     if (overlap) {
//       throw new AppError(
//         `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
//         409,
//       );
//     }

//     const leaveRequestPayload = {
//       employee_id: dto.employee_id,
//       leave_type_id: dto.leave_type_id,
//       leave_application_type: dto.leave_application_type,
//       from_date: dto.from_date,
//       to_date: dto.to_date,
//       from_time: dto.from_time ?? null,
//       to_time: dto.to_time ?? null,
//       days: dto.days,
//       half_day: dto.days % 1 !== 0,
//       reason: dto.reason ?? null,
//       status: 'Pending' as const,
//       submission_type: dto.submission_type ?? 'self',
//       applied_by: dto.applied_by,
//       hod_name: dto.hod_name ?? null,
//       coordinator_name: dto.coordinator_name ?? null,
//       undertaking_accepted: dto.undertaking_accepted,
//     };

//     // CL / EL: balance-tracked via EmployeeLeaveBalance. Check available
//     // (allocated + carried_forward - used - pending) and, if there's enough,
//     // add the requested days to `pending` and create the request atomically —
//     // so a pending request always has a matching hold on the balance.
//     if (BALANCE_TRACKED_LEAVE_CODES.includes(leaveType.code)) {
//       const year = new Date(dto.from_date).getFullYear();

//       return sequelize.transaction(async (transaction) => {
//         const [balance] = await EmployeeLeaveBalance.findOrCreate({
//           where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year },
//           defaults: {
//             employee_id: dto.employee_id,
//             leave_type_id: leaveType.id,
//             year,
//             allocated: 0,
//             used: 0,
//             pending: 0,
//             carried_forward: 0,
//           },
//           transaction,
//           lock: transaction.LOCK.UPDATE,
//         });

//         const available =
//           Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);

//         if (dto.days > available) {
//           throw new AppError(
//             `Insufficient ${leaveType.name} balance: ${available} day(s) remaining, requested ${dto.days}`,
//             400,
//           );
//         }

//         balance.pending = Number(balance.pending) + dto.days;
//         await balance.save({ transaction });

//         return LeaveRequest.create(leaveRequestPayload, { transaction });
//       });
//     }

//     // Everything else (Short Leave for now) — unchanged simple days_per_year check.
//     if (Number(leaveType.days_per_year) > 0) {
//       const year = new Date(dto.from_date).getFullYear();
//       const used = await this.getUsedDays(dto.employee_id, leaveType.id, year);
//       const remaining = Number(leaveType.days_per_year) - used;
//       if (dto.days > remaining) {
//         throw new AppError(
//           `Insufficient ${leaveType.name} balance: ${remaining} day(s) remaining, requested ${dto.days}`,
//           400,
//         );
//       }
//     }

//     return LeaveRequest.create(leaveRequestPayload);
//   }

//   // ─── Approve ───────────────────────────────────────────────────────────────
//   async approve(id: number, approvedBy: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be approved', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Approved', approved_by: approvedBy, approved_at: new Date() },
//         { transaction },
//       );
//       // Move the hold from pending -> used now that it's actually approved.
//       await this.moveBalancePendingToUsed(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: approvedBy,
//       action: 'LEAVE_APPROVED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Approved', approved_by: approvedBy },
//     });

//     return leave;
//   }

//   // ─── Reject ────────────────────────────────────────────────────────────────
//   async reject(id: number, rejectedBy: number, companyId: number, reason?: string) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be rejected', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null },
//         { transaction },
//       );
//       // Not approved — release the pending hold, nothing was ever used.
//       await this.releaseBalancePending(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: rejectedBy,
//       action: 'LEAVE_REJECTED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Rejected', reason },
//     });

//     return leave;
//   }

//   // ─── Cancel (by employee) ──────────────────────────────────────────────────
//   async cancel(id: number, employeeId: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.employee_id !== employeeId)
//       throw new AppError('You can only cancel your own leave requests', 403);
//     if (!['Pending', 'Approved'].includes(leave.status))
//       throw new AppError('Leave cannot be cancelled in its current state', 400);

//     const wasApproved = leave.status === 'Approved';

//     await sequelize.transaction(async (transaction) => {
//       await leave.update({ status: 'Cancelled' }, { transaction });
//       // Give the days back to the employee: a cancelled Pending request
//       // releases its hold on `pending`; a cancelled Approved request gives
//       // the days back from `used` (it was already deducted at approval).
//       if (wasApproved) {
//         await this.releaseBalanceUsed(leave, transaction);
//       } else {
//         await this.releaseBalancePending(leave, transaction);
//       }
//     });

//     return leave;
//   }

//   // ─── Leave types ───────────────────────────────────────────────────────────
//   async getLeaveTypes(companyId: number) {
//     return LeaveType.findAll({
//       where: { company_id: companyId, is_active: true },
//       order: [['name', 'ASC']],
//     });
//   }

//   // ─── Leave balances for an employee, current calendar year ────────────────
//   // Simple annual-pool model: allocated = LeaveType.days_per_year, used = sum of
//   // Pending + Approved request days this year, remaining = allocated - used.
//   // Only covers types with days_per_year > 0 — Short Leave (seeded at 0) isn't
//   // a days-per-year pool in this app (see leave-accrual.service.ts), so it's
//   // omitted rather than shown with a misleading 0/0 balance.
//   // async getBalances(employeeId: number, companyId: number, year = new Date().getFullYear()) {
//   //   const types = await LeaveType.findAll({
//   //     where: { company_id: companyId, is_active: true },
//   //     order: [['name', 'ASC']],
//   //   });

//   //   const balances = [];
//   //   for (const type of types) {
//   //     if (Number(type.days_per_year) <= 0) continue;
//   //     const used = await this.getUsedDays(employeeId, type.id, year);
//   //     const allocated = Number(type.days_per_year);
//   //     balances.push({
//   //       leave_type_id: type.id,
//   //       name: type.name,
//   //       code: type.code,
//   //       allocated,
//   //       used,
//   //       remaining: Math.max(0, allocated - used),
//   //     });
//   //   }
//   //   return balances;
//   // }

//   // async getBalances(
//   //   employeeId: number,
//   //   year = new Date().getFullYear()
//   // ) {

//   //   console.log("hitted");
//   //   console.log(employeeId);
//   //   const balances = await EmployeeLeaveBalance.findAll({
//   //     where: {
//   //       employee_id: employeeId,
//   //       year,
//   //     },
//   //     order: [['leave_type_id', 'ASC']],
//   //   });

//   //   console.log(balances);

//   //   if (!balances.length) {
//   //     return [];
//   //   }

//   //   const leaveTypeIds = balances.map(
//   //     (balance) => balance.leave_type_id
//   //   );

//   //   const leaveTypes = await LeaveType.findAll({
//   //     where: {
//   //       id: leaveTypeIds,
//   //       is_active: true,
//   //     },
//   //     order: [['name', 'ASC']],
//   //   });

//   //   const leaveTypeMap = new Map(
//   //     leaveTypes.map((type) => [type.id, type])
//   //   );

//   //   return balances
//   //     .filter((balance) => leaveTypeMap.has(balance.leave_type_id))
//   //     .map((balance) => {
//   //       const leaveType = leaveTypeMap.get(balance.leave_type_id)!;

//   //       const allocated = Number(balance.allocated);
//   //       const used = Number(balance.used);
//   //       const pending = Number(balance.pending);
//   //       const carriedForward = Number(balance.carried_forward);

//   //       const available =
//   //         allocated +
//   //         carriedForward -
//   //         used -
//   //         pending;

//   //       return {
//   //         leave_type_id: balance.leave_type_id,

//   //         name: leaveType.name,
//   //         code: leaveType.code,

//   //         year: balance.year,

//   //         allocated,
//   //         used,
//   //         pending,
//   //         carried_forward: carriedForward,

//   //         available: Math.max(0, available),
//   //       };
//   //     });
//   // }
//   async getBalances(
//     employeeId: number,
//     year = new Date().getFullYear()
//   ) {
//     console.log('========== GET BALANCES ==========');
//     console.log('employeeId:', employeeId);
//     console.log('year:', year);

//     const balances = await EmployeeLeaveBalance.findAll({
//       where: {
//         employee_id: employeeId,
//         year: year,
//       },
//       logging: console.log,
//     });

//     console.log('BALANCES COUNT:', balances.length);
//     console.log(
//       'BALANCES:',
//       balances.map((b) => b.toJSON())
//     );

//     if (!balances.length) {
//       return [];
//     }

//     const leaveTypeIds = balances.map(
//       (balance) => balance.leave_type_id
//     );

//     console.log('LEAVE TYPE IDS:', leaveTypeIds);

//     const leaveTypes = await LeaveType.findAll({
//       where: {
//         id: leaveTypeIds,
//         is_active: true,
//       },
//       order: [['name', 'ASC']],
//       logging: console.log,
//     });

//     console.log(
//       'LEAVE TYPES:',
//       leaveTypes.map((type) => type.toJSON())
//     );

//     const leaveTypeMap = new Map(
//       leaveTypes.map((type) => [type.id, type])
//     );

//     const result = balances
//       .filter((balance) =>
//         leaveTypeMap.has(balance.leave_type_id)
//       )
//       .map((balance) => {
//         const leaveType =
//           leaveTypeMap.get(balance.leave_type_id)!;

//         const allocated = Number(balance.allocated);
//         const used = Number(balance.used);
//         const pending = Number(balance.pending);
//         const carriedForward = Number(
//           balance.carried_forward
//         );

//         const available =
//           allocated +
//           carriedForward -
//           used -
//           pending;

//         return {
//           leave_type_id: balance.leave_type_id,

//           name: leaveType.name,
//           code: leaveType.code,

//           year: balance.year,

//           allocated,
//           used,
//           pending,
//           carried_forward: carriedForward,

//           available: Math.max(0, available),
//         };
//       });

//     console.log('FINAL RESULT:', result);

//     return result;
//   }

//   // ─── Private helpers ───────────────────────────────────────────────────────
//   // Days already committed (Pending or Approved) against a leave type this year.
//   private async getUsedDays(employeeId: number, leaveTypeId: number, year: number) {
//     const rows = await LeaveRequest.findAll({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveTypeId,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         from_date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] },
//       },
//       attributes: ['days'],
//     });
//     return rows.reduce((sum, r) => sum + Number(r.days), 0);
//   }

//   private async findByIdScoped(id: number, companyId: number) {
//     const leave = await LeaveRequest.findOne({
//       where: { id },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['id', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id'],
//         },
//       ],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
//   }

//   // Only CL/EL carry a balance row worth touching — see BALANCE_TRACKED_LEAVE_CODES.
//   private isBalanceTracked(leave: LeaveRequest): boolean {
//     const code = (leave as any).leaveType?.code;
//     return Boolean(code) && BALANCE_TRACKED_LEAVE_CODES.includes(code);
//   }

//   private async getBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
//     const year = new Date(leave.from_date).getFullYear();
//     return EmployeeLeaveBalance.findOne({
//       where: { employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });
//   }

//   // Approval: the hold becomes a real deduction — pending down, used up.
//   private async moveBalancePendingToUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return; // no balance row — nothing to move (shouldn't happen, apply() creates one)

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     balance.used = Number(balance.used) + Number(leave.days);
//     await balance.save({ transaction });
//   }

//   // Reject / cancel-while-pending: release the hold, nothing was ever used.
//   private async releaseBalancePending(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     await balance.save({ transaction });
//   }

//   // Cancel-while-approved: give the previously-deducted days back.
//   private async releaseBalanceUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.used = Math.max(0, Number(balance.used) - Number(leave.days));
//     await balance.save({ transaction });
//   }
// }



// export async function getEmployeeLeaveInformation(
//   employeeId: number,
//   processingDate: Date = new Date()
// ): Promise<EmployeeLeaveInformation> {
//   const employee = await Employee.findByPk(employeeId);
//   if (!employee) {
//     throw new Error(`Employee not found: ${employeeId}`);
//   }
//   // const probation = await EmployeeCommitmentProbation.findOne({
//   //   where: {
//   //     employee_id: employeeId,
//   //   },
//   //   order: [['id', 'DESC']],
//   // });

//   let probation: EmployeeCommitmentProbation | null = null;
//   try {
//     probation = await EmployeeCommitmentProbation.findOne({
//       where: {
//         employee_id: employeeId,
//       },
//       logging: console.log,
//     });

//     console.log(
//       'PROBATION RESULT:',
//       probation?.toJSON()
//     );
//   } catch (error: any) {
//     console.error('========== PROBATION ERROR ==========');
//     console.error('message:', error.message);
//     console.error('name:', error.name);
//     console.error('original:', error.original);
//     console.error('sql:', error.sql);

//     throw error;
//   }
//   /*
//    * ---------------------------------------------------------
//    * EMPLOYEE INFORMATION
//    * ---------------------------------------------------------
//    */
//   const employeeData = employee.toJSON() as any;
//   const fullName = [
//     employeeData.first_name,
//     employeeData.middle_name,
//     employeeData.last_name,
//   ]
//     .filter(Boolean)
//     .join(' ')
//     .trim();
//   /*
//    * ---------------------------------------------------------
//    * JOINING DATE
//    * ---------------------------------------------------------
//    *
//    * Prefer current_doj when available.
//    * Otherwise fallback to actual_doj.
//    */
//   const joiningDate =
//     employeeData.current_doj ||
//     employeeData.actual_doj ||
//     null;
//   /*
//    * ---------------------------------------------------------
//    * PROBATION INFORMATION
//    * ---------------------------------------------------------
//    */
//   const probationData = probation
//     ? (probation.toJSON() as any)
//     : null;
//   const onProbation = Boolean(
//     probationData?.on_probation
//   );
//   const probationEndDate =
//     probationData?.probation_end_date || null;
//   /*
//    * ---------------------------------------------------------
//    * DETERMINE WHETHER PROBATION HAS COMPLETED
//    * ---------------------------------------------------------
//    */
//   let probationCompleted = false;
//   if (probationData) {
//     /*
//      * Explicit confirmation is the strongest indication.
//      */
//     if (
//       probationData.confirmation_status === 'Confirmed' ||
//       probationData.confirmation_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//     /*
//      * If there is a probation end date and the processing
//      * date is after that date, probation is considered complete.
//      */
//     if (probationEndDate) {
//       const endDate = new Date(probationEndDate);
//       if (
//         !Number.isNaN(endDate.getTime()) &&
//         processingDate >= endDate
//       ) {
//         probationCompleted = true;
//       }
//     }
//     /*
//      * Explicit final status can also indicate completion.
//      */
//     if (
//       probationData.probation_final_status === 'Completed' ||
//       probationData.probation_final_status === 'completed' ||
//       probationData.probation_final_status === 'Confirmed' ||
//       probationData.probation_final_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//   }
//   /*
//    * ---------------------------------------------------------
//    * EMPLOYEE LEAVE STATUS
//    * ---------------------------------------------------------
//    */
//   let leaveStatus: EmployeeLeaveStatus;
//   if (employeeData.employment_type === 'Contractual') {
//     leaveStatus = 'CONTRACTUAL';
//   } else if (
//     employeeData.employment_type === 'Permanent' &&
//     onProbation &&
//     !probationCompleted
//   ) {
//     leaveStatus = 'PROBATION';
//   } else if (
//     employeeData.employment_type === 'Permanent' &&
//     probationCompleted
//   ) {
//     /*
//      * Later we will distinguish:
//      *
//      * REGULAR_AFTER_PROBATION
//      * REGULAR_CONTINUING
//      *
//      * based on the month being processed.
//      */
//     leaveStatus = 'REGULAR_AFTER_PROBATION';
//   } else {
//     leaveStatus = 'REGULAR_CONTINUING';
//   }
//   /*
//    * ---------------------------------------------------------
//    * RETURN NORMALIZED EMPLOYEE DATA
//    * ---------------------------------------------------------
//    */
//   return {
//     employee: {
//       id: employeeData.id,
//       employee_code:
//         employeeData.employee_code ?? null,
//       first_name:
//         employeeData.first_name ?? null,
//       middle_name:
//         employeeData.middle_name ?? null,
//       last_name:
//         employeeData.last_name ?? null,
//       full_name: fullName,
//       company_id:
//         employeeData.company_id ?? null,
//       status:
//         employeeData.status ?? null,
//       employment_type:
//         employeeData.employment_type ?? null,
//       email:
//         employeeData.email ?? null,
//       phone:
//         employeeData.phone ?? null,
//       department_id:
//         employeeData.department_id ?? null,
//       sub_department_id:
//         employeeData.sub_department_id ?? null,
//       designation_id:
//         employeeData.designation_id ?? null,
//       l1_manager_id:
//         employeeData.l1_manager_id ?? null,
//       l2_manager_id:
//         employeeData.l2_manager_id ?? null,
//       reporting_manager_id:
//         employeeData.reporting_manager_id ?? null,
//       actual_doj:
//         employeeData.actual_doj ?? null,
//       current_doj:
//         employeeData.current_doj ?? null,
//       working_site:
//         employeeData.working_site ?? null,
//       working_city:
//         employeeData.working_city ?? null,
//       working_state_country:
//         employeeData.working_state_country ?? null,
//       pay_register_location:
//         employeeData.pay_register_location ?? null,
//       shift_id:
//         employeeData.shift_id ?? null,
//       saturday_off:
//         employeeData.saturday_off ?? null,
//       grace_minutes:
//         employeeData.grace_minutes ?? null,
//     },
//     probation: {
//       exists: Boolean(probationData),
//       on_probation: onProbation,
//       probation_period:
//         probationData?.probation_period ?? null,
//       probation_end_date:
//         probationData?.probation_end_date ?? null,
//       probation_status:
//         probationData?.probation_status ?? null,
//       probation_extended_period:
//         probationData?.probation_extended_period ?? null,
//       probation_final_status:
//         probationData?.probation_final_status ?? null,
//       confirmation_status:
//         probationData?.confirmation_status ?? null,
//       confirmed_on:
//         probationData?.confirmed_on ?? null,

//       // ==================================================
//       // PROBATION EARNED LEAVE
//       // ==================================================

//       probation_el_credit:
//         Number(
//           probationData?.probation_el_credit ?? 0
//         ),

//       probation_el_transferred:
//         Number(
//           probationData?.probation_el_transferred ?? 0
//         ),
//     },
//     leave_status: leaveStatus,
//     joining_date: joiningDate,
//     probation_completed: probationCompleted,
//   };
// }

// // export async function getMonthlyAttendanceSummary(
// //   employeeId: number,
// //   year: number,
// //   month: number
// // ): Promise<MonthlyAttendanceSummary> {
// //   console.log('========== STATIC ATTENDANCE SUMMARY ==========');
// //   console.log('Employee ID:', employeeId);
// //   console.log('Year:', year);
// //   console.log('Month:', month);
// //   /*
// //    * For now every employee gets this static attendance.
// //    *
// //    * Example:
// //    *
// //    * Working Days      = 22
// //    * Present Days      = 21
// //    * WFH               = 1
// //    * Half Days         = 0
// //    * Absent Days       = 0
// //    * Leave Days        = 0
// //    * Holiday Worked    = 1
// //    * Weekly Off Worked = 1
// //    * Working Hours     = 176
// //    */
// //   const summary: MonthlyAttendanceSummary = {
// //     employeeId,
// //     year,
// //     month,
// //     totalCalendarDays: 31,
// //     workingDays: 22,
// //     presentDays: 20,
// //     absentDays: 0,
// //     halfDays: 0,
// //     wfhDays: 1,
// //     leaveDays: 0,
// //     holidayWorkedDays: 1,
// //     weeklyOffWorkedDays: 1,
// //     totalWorkingHours: 176,
// //   };
// //   console.log('Attendance Summary:', summary);
// //   return summary;
// // }



// export async function getMonthlyAttendanceSummary(
//   employeeId: number,
//   year: number,
//   month: number
// ): Promise<MonthlyAttendanceSummary> {
//   const record = await EmployeeMonthlyAttendance.findOne({
//     where: { employee_id: employeeId, year, month },
//   });

//   if (!record) {
//     throw new AppError(
//       `No monthly attendance found for employee ${employeeId} for ${year}-${String(month).padStart(2, '0')}. ` +
//         `Has the monthly attendance job run for this period yet?`,
//       404,
//     );
//   }

//   const data = record.toJSON() as any;

//   // NOTE: wfhDays, holidayWorkedDays, weeklyOffWorkedDays are NOT currently
//   // tracked as their own columns in employee_monthly_attendance — that table
//   // only records whether a calendar day WAS a holiday/week-off
//   // (holiday_days / weekly_off_days), not whether the employee actually
//   // punched in during it. Defaulting to 0 rather than fabricating a number.
//   // If real figures are needed here, the rule engine already has the right
//   // statuses for it (PRESENT_ON_HOLIDAY / PRESENT_ON_WEEK_OFF in
//   // shift-rule-evaluator.service.ts) — they're just never produced today,
//   // because attendance-combined.service.ts short-circuits to HOLIDAY/WEEK_OFF
//   // before evaluateAttendanceStatus() ever runs, regardless of punches.
//   const summary: MonthlyAttendanceSummary = {
//     employeeId: data.employee_id,
//     year: data.year,
//     month: data.month,
//     totalCalendarDays: data.total_days,
//     workingDays: data.working_days,
//     presentDays: data.present_days,
//     absentDays: data.absent_days,
//     halfDays: Number(data.half_days),
//     wfhDays: 0,
//     leaveDays: data.leave_days,
//     holidayWorkedDays: 0,
//     weeklyOffWorkedDays: 0,
//     totalWorkingHours: Number(data.total_working_hours),
//   };

//   return summary;
// }



// import { Op, Transaction, WhereOptions } from 'sequelize';
// import {
//   LeaveRequest,
//   LeaveRequestDay,
//   LeaveType,
//   LeaveApplicationType,
//   LeavePolicySetting,
//   EmployeeWeeklyOffAssignment,
//   EmployeeLeaveBalance,
//   EmployeeLeaveMinutesBalance,
//   EmployeeLeaveAccrual,
//   LeaveCredit,
// } from '../../database/models/LeaveModels';
// import { WeeklyOffPreset } from '../../database/models/weeklyOffPreset';
// import { Employee, EmployeeCommitmentProbation } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
// import { logActivity } from '../../utils/activityLogger';
// import { sequelize } from '../../config/database';
// import { EmployeeMonthlyAttendance } from '../../database/models/EmployeeMonthlyAttendance';
// import { processMonthlyLeave as runMonthlyLeaveJob } from './monthlyLeave.service';

// const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
// const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

// // Leave types whose balance is tracked via EmployeeLeaveBalance
// // (allocated / used / pending / carried_forward).
// //
// // CORRECTED: added 'SPECIAL'. It was missing before — since SPECIAL's
// // days_per_year is 0 (it's earned via LeaveCredit, not an annual grant),
// // the old fallback branch in apply() ("if days_per_year > 0") silently
// // skipped ALL balance checking for Special Leave, meaning an employee
// // could apply for unlimited Special Leave regardless of actual credited
// // balance. EmployeeLeaveBalance is generic per (employee, leave_type,
// // year) — it already supports SPECIAL with no schema change needed.
// const BALANCE_TRACKED_LEAVE_CODES = ['CL', 'EL', 'SPECIAL'];

// export type EmployeeLeaveStatus =
//   | 'PROBATION'
//   | 'REGULAR_AFTER_PROBATION'
//   | 'REGULAR_CONTINUING'
//   | 'CONTRACTUAL';

// export interface MonthlyAttendanceSummary {
//   employeeId: number;
//   year: number;
//   month: number;
//   totalCalendarDays: number;
//   workingDays: number;
//   presentDays: number;
//   absentDays: number;
//   halfDays: number;
//   wfhDays: number;
//   leaveDays: number;
//   holidayWorkedDays: number;
//   weeklyOffWorkedDays: number;
//   totalWorkingHours: number;
// }

// export interface EmployeeLeaveInformation {
//   employee: {
//     id: number;
//     employee_code: string | null;
//     first_name: string | null;
//     middle_name: string | null;
//     last_name: string | null;
//     full_name: string;
//     company_id: number | null;
//     status: string | null;
//     employment_type: string | null;
//     email: string | null;
//     phone: string | null;
//     department_id: number | null;
//     sub_department_id: number | null;
//     designation_id: number | null;
//     l1_manager_id: number | null;
//     l2_manager_id: number | null;
//     reporting_manager_id: number | null;
//     actual_doj: string | null;
//     current_doj: string | null;
//     working_site: string | null;
//     working_city: string | null;
//     working_state_country: string | null;
//     pay_register_location: string | null;
//     shift_id: number | null;
//     saturday_off: unknown;
//     grace_minutes: number | null;
//   };
//   probation: {
//     exists: boolean;
//     on_probation: boolean;
//     probation_period: number | null;
//     probation_end_date: string | null;
//     probation_status: string | null;
//     probation_extended_period: number | null;
//     probation_final_status: string | null;
//     confirmation_status: string | null;
//     confirmed_on: string | null;
//     probation_el_credit: number;
//     probation_el_transferred: number;
//   };
//   leave_status: EmployeeLeaveStatus;
//   joining_date: string | null;
//   probation_completed: boolean;
// }

// export interface ApplyLeaveDto {
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string;
//   to_time?: string;
//   days: number;
//   half_day?: boolean;
//   reason?: string;
//   submission_type?: 'self' | 'admin';
//   applied_by: number;
//   hod_name?: string;
//   coordinator_name?: string;
//   undertaking_accepted: boolean;
// }

// export interface LeaveQueryParams {
//   page?: number | string;
//   limit?: number | string;
//   employee_id?: number | string;
//   status?: string;
//   leave_type_id?: number | string;
// }

// export interface LeaveTypeDto {
//   name: string;
//   code: string;
//   unit?: 'day' | 'minutes';
//   days_per_year?: number;
//   monthly_quota_minutes?: number;
//   split_chunk_minutes?: number;
//   allow_split?: boolean;
//   is_paid?: boolean;
//   carry_forward?: boolean;
//   max_carry_days?: number;
//   min_advance_days?: number;
//   max_backdate_days?: number;
//   sandwich_applies?: boolean;
//   allow_half_day?: boolean;
//   requires_approval?: boolean;
//   is_earned?: boolean;
//   deduct_from_leave_type_id?: number | null;
// }

// export interface LeavePolicyDto {
//   sandwich_enabled?: boolean;
//   sandwich_include_weekly_off?: boolean;
//   sandwich_include_holidays?: boolean;
// }

// export interface CreditSpecialLeaveDto {
//   employee_id: number;
//   leave_type_id: number; // the SPECIAL LeaveType's id
//   credit_date: string;
//   days: number;
//   holiday_name?: string;
//   note?: string;
// }

// // Whitelisted fields only — never let a caller overwrite id/company_id/etc.
// const LEAVE_TYPE_UPDATABLE_FIELDS: (keyof LeaveTypeDto)[] = [
//   'name', 'code', 'unit', 'days_per_year', 'monthly_quota_minutes', 'split_chunk_minutes',
//   'allow_split', 'is_paid', 'carry_forward', 'max_carry_days', 'min_advance_days',
//   'max_backdate_days', 'sandwich_applies', 'allow_half_day', 'requires_approval',
//   'is_earned', 'deduct_from_leave_type_id',
// ];

// export class LeaveService {
//   // ─── LeaveRequest ═══════════════════════════════════════════════════════

//   // ─── List all leave requests (company-scoped) ──────────────────────────────
//   async getAll(query: LeaveQueryParams, companyId: number) {
//     const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

//     const where: WhereOptions = {};
//     if (query.status) where['status'] = query.status;
//     if (query.employee_id) where['employee_id'] = Number(query.employee_id);
//     if (query.leave_type_id) where['leave_type_id'] = Number(query.leave_type_id);

//     const { count, rows } = await LeaveRequest.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: [['created_at', 'DESC']],
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code', 'is_paid'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'avatar_url'],
//         },
//       ],
//     });

//     return { rows, meta: buildPaginationMeta(page, limit, count) };
//   }

//   // ─── Pending approvals ───────────────────────────────────────────────────
//   async getPendingForManager(_managerId: number, companyId: number) {
//     return LeaveRequest.findAll({
//       where: { status: 'Pending' },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//         },
//       ],
//       order: [['created_at', 'ASC']],
//     });
//   }

//   // ─── Single leave request, full detail (NEW — controller's getLeaveById) ──
//   async getById(id: number, companyId: number) {
//     const leave = await LeaveRequest.findOne({
//       where: { id },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'unit', 'is_paid'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//         },
//       ],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
//   }

//   // ─── Per-day sandwich/charged breakdown (NEW — LeaveRequestDay) ───────────
//   async getBreakdown(leaveRequestId: number) {
//     const exists = await LeaveRequest.findByPk(leaveRequestId, { attributes: ['id'] });
//     if (!exists) throw new AppError('Leave request not found', 404);

//     return LeaveRequestDay.findAll({
//       where: { leave_request_id: leaveRequestId },
//       order: [['date', 'ASC']],
//     });
//   }

//   // ─── Apply for leave ───────────────────────────────────────────────────────
//   async apply(dto: ApplyLeaveDto, companyId: number) {
//     const leaveType = await LeaveType.findOne({
//       where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
//     });
//     if (!leaveType) throw new AppError('Leave type not found or inactive', 404);

//     if (SHORT_LEAVE_APPLICATION_TYPES.includes(dto.leave_application_type) && (!dto.from_time || !dto.to_time)) {
//       throw new AppError('From/To time are required for Arrival Late / Leaving Early', 400);
//     }

//     const targetEmployee = await Employee.findOne({
//       where: { id: dto.employee_id, company_id: companyId },
//     });
//     if (!targetEmployee) throw new AppError('Employee not found', 404);

//     // Check for overlapping approved/pending leaves. A 1st Half + 2nd Half pair
//     // on the exact same single date is NOT a conflict.
//     const candidates = await LeaveRequest.findAll({
//       where: {
//         employee_id: dto.employee_id,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         [Op.or]: [
//           { from_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           { to_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           {
//             from_date: { [Op.lte]: dto.from_date },
//             to_date: { [Op.gte]: dto.to_date },
//           },
//         ],
//       },
//     });

//     const newIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(dto.leave_application_type) && dto.from_date === dto.to_date;

//     const overlap = candidates.find((existing) => {
//       const existingIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(existing.leave_application_type)
//         && existing.from_date === existing.to_date;
//       const sameSingleDay = newIsHalfDay && existingIsHalfDay && existing.from_date === dto.from_date;
//       const differentHalves = existing.leave_application_type !== dto.leave_application_type;
//       if (sameSingleDay && differentHalves) return false;
//       return true;
//     });

//     if (overlap) {
//       throw new AppError(
//         `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
//         409,
//       );
//     }

//     const leaveRequestPayload = {
//       employee_id: dto.employee_id,
//       leave_type_id: dto.leave_type_id,
//       leave_application_type: dto.leave_application_type,
//       from_date: dto.from_date,
//       to_date: dto.to_date,
//       from_time: dto.from_time ?? null,
//       to_time: dto.to_time ?? null,
//       days: dto.days,
//       half_day: dto.days % 1 !== 0,
//       reason: dto.reason ?? null,
//       status: 'Pending' as const,
//       submission_type: dto.submission_type ?? 'self',
//       applied_by: dto.applied_by,
//       hod_name: dto.hod_name ?? null,
//       coordinator_name: dto.coordinator_name ?? null,
//       undertaking_accepted: dto.undertaking_accepted,
//     };

//     if (BALANCE_TRACKED_LEAVE_CODES.includes(leaveType.code)) {
//       const year = new Date(dto.from_date).getFullYear();

//       return sequelize.transaction(async (transaction) => {
//         const [balance] = await EmployeeLeaveBalance.findOrCreate({
//           where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year },
//           defaults: {
//             employee_id: dto.employee_id,
//             leave_type_id: leaveType.id,
//             year,
//             allocated: 0,
//             used: 0,
//             pending: 0,
//             carried_forward: 0,
//           },
//           transaction,
//           lock: transaction.LOCK.UPDATE,
//         });

//         const available =
//           Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);

//         if (dto.days > available) {
//           throw new AppError(
//             `Insufficient ${leaveType.name} balance: ${available} day(s) remaining, requested ${dto.days}`,
//             400,
//           );
//         }

//         balance.pending = Number(balance.pending) + dto.days;
//         await balance.save({ transaction });

//         return this.createLeaveRequestWithRefNo(leaveRequestPayload, transaction);
//       });
//     }

//     // Short Leave — simple monthly-minutes model, not day-balance tracked here.
//     if (Number(leaveType.days_per_year) > 0) {
//       const year = new Date(dto.from_date).getFullYear();
//       const used = await this.getUsedDays(dto.employee_id, leaveType.id, year);
//       const remaining = Number(leaveType.days_per_year) - used;
//       if (dto.days > remaining) {
//         throw new AppError(
//           `Insufficient ${leaveType.name} balance: ${remaining} day(s) remaining, requested ${dto.days}`,
//           400,
//         );
//       }
//     }

//     return this.createLeaveRequestWithRefNo(leaveRequestPayload);
//   }

//   // ref_no is required + unique on LeaveRequest but was never supplied by
//   // apply() — that's what threw the TS error. Generated as LV-<year>-<seq>,
//   // same convention your original demo seed data used (LV-2026-0001, ...).
//   // Wrapped with a small retry-on-collision loop since the sequence number
//   // comes from a plain COUNT rather than a DB sequence, so two concurrent
//   // applies in the same millisecond could in theory race for the same
//   // number — the unique index catches it and this retries with a fresh one.
//   private async generateRefNo(): Promise<string> {
//     const year = new Date().getFullYear();
//     const prefix = `LV-${year}-`;
//     const count = await LeaveRequest.count({ where: { ref_no: { [Op.like]: `${prefix}%` } } });
//     return `${prefix}${String(count + 1).padStart(4, '0')}`;
//   }

//   private async createLeaveRequestWithRefNo(
//     payload: Record<string, unknown>,
//     transaction?: Transaction,
//     attempt = 0,
//   ): Promise<LeaveRequest> {
//     const ref_no = await this.generateRefNo();
//     try {
//       return await LeaveRequest.create({ ...payload, ref_no } as any, transaction ? { transaction } : undefined);
//     } catch (err: any) {
//       if (err?.name === 'SequelizeUniqueConstraintError' && attempt < 3) {
//         return this.createLeaveRequestWithRefNo(payload, transaction, attempt + 1);
//       }
//       throw err;
//     }
//   }

//   // ─── Approve ───────────────────────────────────────────────────────────────
//   async approve(id: number, approvedBy: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be approved', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Approved', approved_by: approvedBy, approved_at: new Date() },
//         { transaction },
//       );
//       await this.moveBalancePendingToUsed(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: approvedBy,
//       action: 'LEAVE_APPROVED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Approved', approved_by: approvedBy },
//     });

//     return leave;
//   }

//   // ─── Reject ────────────────────────────────────────────────────────────────
//   async reject(id: number, rejectedBy: number, companyId: number, reason?: string) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be rejected', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null },
//         { transaction },
//       );
//       await this.releaseBalancePending(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: rejectedBy,
//       action: 'LEAVE_REJECTED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Rejected', reason },
//     });

//     return leave;
//   }

//   // ─── Cancel (by employee) ──────────────────────────────────────────────────
//   async cancel(id: number, employeeId: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.employee_id !== employeeId)
//       throw new AppError('You can only cancel your own leave requests', 403);
//     if (!['Pending', 'Approved'].includes(leave.status))
//       throw new AppError('Leave cannot be cancelled in its current state', 400);

//     const wasApproved = leave.status === 'Approved';

//     await sequelize.transaction(async (transaction) => {
//       await leave.update({ status: 'Cancelled' }, { transaction });
//       if (wasApproved) {
//         await this.releaseBalanceUsed(leave, transaction);
//       } else {
//         await this.releaseBalancePending(leave, transaction);
//       }
//     });

//     return leave;
//   }

//   // ─── LeaveType ══════════════════════════════════════════════════════════

//   async getLeaveTypes(companyId: number) {
//     return LeaveType.findAll({
//       where: { company_id: companyId, is_active: true },
//       order: [['name', 'ASC']],
//     });
//   }

//   async getLeaveTypeById(id: number, companyId: number) {
//     const type = await LeaveType.findOne({ where: { id, company_id: companyId } });
//     if (!type) throw new AppError('Leave type not found', 404);
//     return type;
//   }

//   async createLeaveType(dto: LeaveTypeDto, companyId: number) {
//     if (!dto.name || !dto.code) throw new AppError('name and code are required', 400);

//     const existing = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code } });
//     if (existing) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);

//     return LeaveType.create({
//       company_id: companyId,
//       name: dto.name,
//       code: dto.code,
//       unit: dto.unit ?? 'day',
//       days_per_year: dto.days_per_year ?? 0,
//       monthly_quota_minutes: dto.monthly_quota_minutes ?? 0,
//       split_chunk_minutes: dto.split_chunk_minutes ?? 0,
//       allow_split: dto.allow_split ?? false,
//       is_paid: dto.is_paid ?? true,
//       carry_forward: dto.carry_forward ?? false,
//       max_carry_days: dto.max_carry_days ?? 0,
//       min_advance_days: dto.min_advance_days ?? 0,
//       max_backdate_days: dto.max_backdate_days ?? 0,
//       sandwich_applies: dto.sandwich_applies ?? false,
//       allow_half_day: dto.allow_half_day ?? false,
//       requires_approval: dto.requires_approval ?? true,
//       is_earned: dto.is_earned ?? false,
//       deduct_from_leave_type_id: dto.deduct_from_leave_type_id ?? null,
//     });
//   }

//   async updateLeaveType(id: number, dto: Partial<LeaveTypeDto>, companyId: number) {
//     const type = await this.getLeaveTypeById(id, companyId);

//     if (dto.code && dto.code !== type.code) {
//       const clash = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code, id: { [Op.ne]: id } } });
//       if (clash) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);
//     }

//     const patch: Record<string, unknown> = {};
//     for (const field of LEAVE_TYPE_UPDATABLE_FIELDS) {
//       if (dto[field] !== undefined) patch[field] = dto[field];
//     }
//     await type.update(patch);
//     return type;
//   }

//   async setLeaveTypeActive(id: number, isActive: boolean, companyId: number) {
//     const type = await this.getLeaveTypeById(id, companyId);
//     await type.update({ is_active: isActive });
//     return type;
//   }

//   // ─── LeavePolicySetting ═════════════════════════════════════════════════

//   async getLeavePolicy(companyId: number) {
//     const [policy] = await LeavePolicySetting.findOrCreate({
//       where: { company_id: companyId },
//       defaults: {
//         company_id: companyId,
//         sandwich_enabled: true,
//         sandwich_include_weekly_off: true,
//         sandwich_include_holidays: true,
//       },
//     });
//     return policy;
//   }

//   async updateLeavePolicy(companyId: number, dto: LeavePolicyDto) {
//     const policy = await this.getLeavePolicy(companyId);
//     const patch: Record<string, unknown> = {};
//     if (dto.sandwich_enabled !== undefined) patch.sandwich_enabled = dto.sandwich_enabled;
//     if (dto.sandwich_include_weekly_off !== undefined) patch.sandwich_include_weekly_off = dto.sandwich_include_weekly_off;
//     if (dto.sandwich_include_holidays !== undefined) patch.sandwich_include_holidays = dto.sandwich_include_holidays;
//     await policy.update(patch);
//     return policy;
//   }

//   // ─── EmployeeWeeklyOffAssignment ════════════════════════════════════════

//   async getEmployeeWeeklyOff(employeeId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return EmployeeWeeklyOffAssignment.findOne({
//       where: { employee_id: employeeId },
//       include: [{ model: WeeklyOffPreset, as: 'weeklyOffPreset' }],
//     });
//   }

//   async assignEmployeeWeeklyOff(employeeId: number, weeklyOffPresetId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const preset = await WeeklyOffPreset.findByPk(weeklyOffPresetId);
//     if (!preset) throw new AppError('Weekly-off preset not found', 404);

//     const [assignment] = await EmployeeWeeklyOffAssignment.findOrCreate({
//       where: { employee_id: employeeId },
//       defaults: { employee_id: employeeId, weekly_off_preset_id: weeklyOffPresetId },
//     });
//     if (assignment.weekly_off_preset_id !== weeklyOffPresetId) {
//       await assignment.update({ weekly_off_preset_id: weeklyOffPresetId });
//     }
//     return assignment;
//   }

//   // ─── EmployeeLeaveBalance (annual, day-based) ══════════════════════════

//   async getBalances(employeeId: number, year = new Date().getFullYear()) {
//     const balances = await EmployeeLeaveBalance.findAll({
//       where: { employee_id: employeeId, year },
//     });

//     if (!balances.length) return [];

//     const leaveTypeIds = balances.map((balance) => balance.leave_type_id);
//     const leaveTypes = await LeaveType.findAll({
//       where: { id: leaveTypeIds, is_active: true },
//       order: [['name', 'ASC']],
//     });
//     const leaveTypeMap = new Map(leaveTypes.map((type) => [type.id, type]));

//     return balances
//       .filter((balance) => leaveTypeMap.has(balance.leave_type_id))
//       .map((balance) => {
//         const leaveType = leaveTypeMap.get(balance.leave_type_id)!;
//         const allocated = Number(balance.allocated);
//         const used = Number(balance.used);
//         const pending = Number(balance.pending);
//         const carriedForward = Number(balance.carried_forward);
//         const available = allocated + carriedForward - used - pending;

//         return {
//           leave_type_id: balance.leave_type_id,
//           name: leaveType.name,
//           code: leaveType.code,
//           year: balance.year,
//           allocated,
//           used,
//           pending,
//           carried_forward: carriedForward,
//           available: Math.max(0, available),
//         };
//       });
//   }

//   // ─── Company-wide balances overview (NEW) ════════════════════════════════
//   // Needed for an admin "all employees" balances table (EL/CL/SPECIAL columns
//   // + this month's Short Leave usage) — getBalances() above is per-employee
//   // only, there was no bulk read. Kept lean: two queries plus one for the
//   // minutes table, no N+1 per employee.
//   async getCompanyBalancesOverview(companyId: number, year = new Date().getFullYear()) {
//     const now = new Date();
//     const month = now.getMonth() + 1;

//     const employees = await Employee.findAll({
//       where: { company_id: companyId },
//       attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//       order: [['first_name', 'ASC']],
//     });
//     if (!employees.length) return [];
//     const employeeIds = employees.map((e) => e.id);

//     const leaveTypes = await LeaveType.findAll({ where: { company_id: companyId } });
//     const typeByCode = new Map(leaveTypes.map((t) => [t.code, t]));

//     const balances = await EmployeeLeaveBalance.findAll({
//       where: { employee_id: employeeIds, year },
//     });
//     // employee_id -> leave_type_id -> available days
//     const balanceMap = new Map<number, Map<number, number>>();
//     for (const b of balances) {
//       const available = Number(b.allocated) + Number(b.carried_forward) - Number(b.used) - Number(b.pending);
//       if (!balanceMap.has(b.employee_id)) balanceMap.set(b.employee_id, new Map());
//       balanceMap.get(b.employee_id)!.set(b.leave_type_id, Math.max(0, available));
//     }

//     const shortType = typeByCode.get('SHORT');
//     const shortByEmployee = new Map<number, { allocated: number; used: number }>();
//     if (shortType) {
//       const shortBalances = await EmployeeLeaveMinutesBalance.findAll({
//         where: { employee_id: employeeIds, leave_type_id: shortType.id, year, month },
//       });
//       for (const s of shortBalances) {
//         shortByEmployee.set(s.employee_id, {
//           allocated: Number(s.allocated_minutes),
//           used: Number(s.used_minutes),
//         });
//       }
//     }

//     const elId = typeByCode.get('EL')?.id;
//     const clId = typeByCode.get('CL')?.id;
//     const specialId = typeByCode.get('SPECIAL')?.id;

//     return employees.map((e) => {
//       const empBalances = balanceMap.get(e.id);
//       const short = shortByEmployee.get(e.id);
//       const shortAllocated = short?.allocated ?? Number(shortType?.monthly_quota_minutes ?? 60);
//       const shortUsed = short?.used ?? 0;

//       return {
//         employee_id: e.id,
//         name: [e.first_name, e.last_name].filter(Boolean).join(' '),
//         employee_code: e.employee_code,
//         EL: elId ? (empBalances?.get(elId) ?? 0) : 0,
//         CL: clId ? (empBalances?.get(clId) ?? 0) : 0,
//         SPECIAL: specialId ? (empBalances?.get(specialId) ?? 0) : 0,
//         short_used_minutes: shortUsed,
//         short_allocated_minutes: shortAllocated,
//       };
//     });
//   }

//   // ─── EmployeeLeaveMinutesBalance (Short Leave, monthly) ════════════════

//   async getShortLeaveBalance(employeeId: number, year: number, month: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const shortType = await LeaveType.findOne({ where: { company_id: companyId, code: 'SHORT' } });
//     if (!shortType) throw new AppError('Short Leave type not configured for this company', 404);

//     const [balance] = await EmployeeLeaveMinutesBalance.findOrCreate({
//       where: { employee_id: employeeId, leave_type_id: shortType.id, year, month },
//       defaults: {
//         employee_id: employeeId,
//         leave_type_id: shortType.id,
//         year,
//         month,
//         allocated_minutes: Number(shortType.monthly_quota_minutes) || 60,
//         used_minutes: 0,
//       },
//     });

//     const allocated = Number(balance.allocated_minutes);
//     const used = Number(balance.used_minutes);
//     return {
//       leave_type_id: shortType.id,
//       year,
//       month,
//       allocated_minutes: allocated,
//       used_minutes: used,
//       available_minutes: Math.max(0, allocated - used),
//     };
//   }

//   // ─── EmployeeLeaveAccrual ═══════════════════════════════════════════════

//   async getLeaveAccruals(employeeId: number, year: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return EmployeeLeaveAccrual.findAll({
//       where: { employee_id: employeeId, year },
//       include: [{ model: LeaveType, attributes: ['name', 'code'] }],
//       order: [['month', 'ASC']],
//     });
//   }

//   // ─── LeaveCredit (Special Leave earn ledger) ═══════════════════════════

//   async creditSpecialLeave(dto: CreditSpecialLeaveDto, creditedBy: number, companyId: number) {
//     if (!dto.employee_id || !dto.leave_type_id || !dto.credit_date || !dto.days || dto.days <= 0) {
//       throw new AppError('employee_id, leave_type_id, credit_date and a positive days value are required', 400);
//     }

//     const employee = await Employee.findOne({ where: { id: dto.employee_id, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const leaveType = await LeaveType.findOne({
//       where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
//     });
//     if (!leaveType) throw new AppError('Leave type not found or inactive', 404);
//     if (!leaveType.is_earned) {
//       throw new AppError(`"${leaveType.name}" is not configured as an earned/credited leave type`, 400);
//     }

//     const year = new Date(dto.credit_date).getFullYear();

//     return sequelize.transaction(async (transaction) => {
//       const credit = await LeaveCredit.create(
//         {
//           employee_id: dto.employee_id,
//           leave_type_id: dto.leave_type_id,
//           credit_date: dto.credit_date,
//           days: dto.days,
//           holiday_name: dto.holiday_name ?? null,
//           note: dto.note ?? null,
//           credited_by: creditedBy,
//         },
//         { transaction },
//       );

//       // Credited days increase the pool this leave type can be used against —
//       // same EmployeeLeaveBalance table CL/EL use, just adding to `allocated`.
//       const [balance] = await EmployeeLeaveBalance.findOrCreate({
//         where: { employee_id: dto.employee_id, leave_type_id: dto.leave_type_id, year },
//         defaults: {
//           employee_id: dto.employee_id,
//           leave_type_id: dto.leave_type_id,
//           year,
//           allocated: 0,
//           used: 0,
//           pending: 0,
//           carried_forward: 0,
//         },
//         transaction,
//         lock: transaction.LOCK.UPDATE,
//       });
//       balance.allocated = Number(balance.allocated) + Number(dto.days);
//       await balance.save({ transaction });

//       return credit;
//     });
//   }

//   async getLeaveCredits(employeeId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return LeaveCredit.findAll({
//       where: { employee_id: employeeId },
//       order: [['credit_date', 'DESC']],
//     });
//   }

//   // ─── Monthly leave processing (delegates to existing job) ═══════════════

//   async processMonthlyLeave(employeeId: number, year: number, month: number) {
//     return runMonthlyLeaveJob(employeeId, year, month);
//   }

//   // ─── Private helpers ───────────────────────────────────────────────────────

//   private async getUsedDays(employeeId: number, leaveTypeId: number, year: number) {
//     const rows = await LeaveRequest.findAll({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveTypeId,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         from_date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] },
//       },
//       attributes: ['days'],
//     });
//     return rows.reduce((sum, r) => sum + Number(r.days), 0);
//   }

//   private async findByIdScoped(id: number, companyId: number) {
//     const leave = await LeaveRequest.findOne({
//       where: { id },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['id', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id'],
//         },
//       ],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
//   }

//   private isBalanceTracked(leave: LeaveRequest): boolean {
//     const code = (leave as any).leaveType?.code;
//     return Boolean(code) && BALANCE_TRACKED_LEAVE_CODES.includes(code);
//   }

//   private async getBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
//     const year = new Date(leave.from_date).getFullYear();
//     return EmployeeLeaveBalance.findOne({
//       where: { employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });
//   }

//   private async moveBalancePendingToUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     balance.used = Number(balance.used) + Number(leave.days);
//     await balance.save({ transaction });
//   }

//   private async releaseBalancePending(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     await balance.save({ transaction });
//   }

//   private async releaseBalanceUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.used = Math.max(0, Number(balance.used) - Number(leave.days));
//     await balance.save({ transaction });
//   }
// }

// // ─── Standalone exports (unrelated to LeaveService's leave-model CRUD,
// // kept exactly as in your original file so nothing else importing them
// // breaks) ─────────────────────────────────────────────────────────────────

// export async function getEmployeeLeaveInformation(
//   employeeId: number,
//   processingDate: Date = new Date(),
// ): Promise<EmployeeLeaveInformation> {
//   const employee = await Employee.findByPk(employeeId);
//   if (!employee) {
//     throw new Error(`Employee not found: ${employeeId}`);
//   }

//   const probation = await EmployeeCommitmentProbation.findOne({
//     where: { employee_id: employeeId },
//     order: [['id', 'DESC']],
//   });

//   const employeeData = employee.toJSON() as any;
//   const fullName = [employeeData.first_name, employeeData.middle_name, employeeData.last_name]
//     .filter(Boolean)
//     .join(' ')
//     .trim();

//   const joiningDate = employeeData.current_doj || employeeData.actual_doj || null;

//   const probationData = probation ? (probation.toJSON() as any) : null;
//   const onProbation = Boolean(probationData?.on_probation);
//   const probationEndDate = probationData?.probation_end_date || null;

//   let probationCompleted = false;
//   if (probationData) {
//     if (
//       probationData.confirmation_status === 'Confirmed' ||
//       probationData.confirmation_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//     if (probationEndDate) {
//       const endDate = new Date(probationEndDate);
//       if (!Number.isNaN(endDate.getTime()) && processingDate >= endDate) {
//         probationCompleted = true;
//       }
//     }
//     if (
//       probationData.probation_final_status === 'Completed' ||
//       probationData.probation_final_status === 'completed' ||
//       probationData.probation_final_status === 'Confirmed' ||
//       probationData.probation_final_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//   }

//   let leaveStatus: EmployeeLeaveStatus;
//   if (employeeData.employment_type === 'Contractual') {
//     leaveStatus = 'CONTRACTUAL';
//   } else if (employeeData.employment_type === 'Permanent' && onProbation && !probationCompleted) {
//     leaveStatus = 'PROBATION';
//   } else if (employeeData.employment_type === 'Permanent' && probationCompleted) {
//     leaveStatus = 'REGULAR_AFTER_PROBATION';
//   } else {
//     leaveStatus = 'REGULAR_CONTINUING';
//   }

//   return {
//     employee: {
//       id: employeeData.id,
//       employee_code: employeeData.employee_code ?? null,
//       first_name: employeeData.first_name ?? null,
//       middle_name: employeeData.middle_name ?? null,
//       last_name: employeeData.last_name ?? null,
//       full_name: fullName,
//       company_id: employeeData.company_id ?? null,
//       status: employeeData.status ?? null,
//       employment_type: employeeData.employment_type ?? null,
//       email: employeeData.email ?? null,
//       phone: employeeData.phone ?? null,
//       department_id: employeeData.department_id ?? null,
//       sub_department_id: employeeData.sub_department_id ?? null,
//       designation_id: employeeData.designation_id ?? null,
//       l1_manager_id: employeeData.l1_manager_id ?? null,
//       l2_manager_id: employeeData.l2_manager_id ?? null,
//       reporting_manager_id: employeeData.reporting_manager_id ?? null,
//       actual_doj: employeeData.actual_doj ?? null,
//       current_doj: employeeData.current_doj ?? null,
//       working_site: employeeData.working_site ?? null,
//       working_city: employeeData.working_city ?? null,
//       working_state_country: employeeData.working_state_country ?? null,
//       pay_register_location: employeeData.pay_register_location ?? null,
//       shift_id: employeeData.shift_id ?? null,
//       saturday_off: employeeData.saturday_off ?? null,
//       grace_minutes: employeeData.grace_minutes ?? null,
//     },
//     probation: {
//       exists: Boolean(probationData),
//       on_probation: onProbation,
//       probation_period: probationData?.probation_period ?? null,
//       probation_end_date: probationData?.probation_end_date ?? null,
//       probation_status: probationData?.probation_status ?? null,
//       probation_extended_period: probationData?.probation_extended_period ?? null,
//       probation_final_status: probationData?.probation_final_status ?? null,
//       confirmation_status: probationData?.confirmation_status ?? null,
//       confirmed_on: probationData?.confirmed_on ?? null,
//       probation_el_credit: Number(probationData?.probation_el_credit ?? 0),
//       probation_el_transferred: Number(probationData?.probation_el_transferred ?? 0),
//     },
//     leave_status: leaveStatus,
//     joining_date: joiningDate,
//     probation_completed: probationCompleted,
//   };
// }

// export async function getMonthlyAttendanceSummary(
//   employeeId: number,
//   year: number,
//   month: number,
// ): Promise<MonthlyAttendanceSummary> {
//   const record = await EmployeeMonthlyAttendance.findOne({
//     where: { employee_id: employeeId, year, month },
//   });

//   if (!record) {
//     throw new AppError(
//       `No monthly attendance found for employee ${employeeId} for ${year}-${String(month).padStart(2, '0')}. ` +
//         `Has the monthly attendance job run for this period yet?`,
//       404,
//     );
//   }

//   const data = record.toJSON() as any;

//   // NOTE: wfhDays, holidayWorkedDays, weeklyOffWorkedDays are not currently
//   // tracked as their own columns in employee_monthly_attendance — defaulting
//   // to 0 rather than fabricating a number (see original comment in your file
//   // for why: attendance-combined.service.ts short-circuits to HOLIDAY/WEEK_OFF
//   // before evaluateAttendanceStatus() ever runs).
//   return {
//     employeeId: data.employee_id,
//     year: data.year,
//     month: data.month,
//     totalCalendarDays: data.total_days,
//     workingDays: data.working_days,
//     presentDays: data.present_days,
//     absentDays: data.absent_days,
//     halfDays: Number(data.half_days),
//     wfhDays: 0,
//     leaveDays: data.leave_days,
//     holidayWorkedDays: 0,
//     weeklyOffWorkedDays: 0,
//     totalWorkingHours: Number(data.total_working_hours),
//   };
// }



// import { Op, Transaction, WhereOptions } from 'sequelize';
// import {
//   LeaveRequest,
//   LeaveRequestDay,
//   LeaveType,
//   LeaveApplicationType,
//   LeavePolicySetting,
//   EmployeeWeeklyOffAssignment,
//   EmployeeLeaveBalance,
//   EmployeeLeaveMinutesBalance,
//   EmployeeLeaveAccrual,
//   LeaveCredit,
// } from '../../database/models/LeaveModels';
// import { WeeklyOffPreset } from '../../database/models/weeklyOffPreset';
// import { Employee, EmployeeCommitmentProbation, EmployeeManagersWorkContact } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
// import { logActivity } from '../../utils/activityLogger';
// import { sequelize } from '../../config/database';
// import { EmployeeMonthlyAttendance } from '../../database/models/EmployeeMonthlyAttendance';
// import { processMonthlyLeave as runMonthlyLeaveJob } from './monthlyLeave.service';

// const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
// const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

// // Leave types whose balance is tracked via EmployeeLeaveBalance
// // (allocated / used / pending / carried_forward).
// //
// // CORRECTED: added 'SPECIAL'. It was missing before — since SPECIAL's
// // days_per_year is 0 (it's earned via LeaveCredit, not an annual grant),
// // the old fallback branch in apply() ("if days_per_year > 0") silently
// // skipped ALL balance checking for Special Leave, meaning an employee
// // could apply for unlimited Special Leave regardless of actual credited
// // balance. EmployeeLeaveBalance is generic per (employee, leave_type,
// // year) — it already supports SPECIAL with no schema change needed.
// const BALANCE_TRACKED_LEAVE_CODES = ['CL', 'EL', 'SPECIAL'];

// export type EmployeeLeaveStatus =
//   | 'PROBATION'
//   | 'REGULAR_AFTER_PROBATION'
//   | 'REGULAR_CONTINUING'
//   | 'CONTRACTUAL';

// export interface MonthlyAttendanceSummary {
//   employeeId: number;
//   year: number;
//   month: number;
//   totalCalendarDays: number;
//   workingDays: number;
//   presentDays: number;
//   absentDays: number;
//   halfDays: number;
//   wfhDays: number;
//   leaveDays: number;
//   holidayWorkedDays: number;
//   weeklyOffWorkedDays: number;
//   totalWorkingHours: number;
// }

// export interface EmployeeLeaveInformation {
//   employee: {
//     id: number;
//     employee_code: string | null;
//     first_name: string | null;
//     middle_name: string | null;
//     last_name: string | null;
//     full_name: string;
//     company_id: number | null;
//     status: string | null;
//     employment_type: string | null;
//     email: string | null;
//     phone: string | null;
//     department_id: number | null;
//     sub_department_id: number | null;
//     designation_id: number | null;
//     l1_manager_id: number | null;
//     l2_manager_id: number | null;
//     reporting_manager_id: number | null;
//     actual_doj: string | null;
//     current_doj: string | null;
//     working_site: string | null;
//     working_city: string | null;
//     working_state_country: string | null;
//     pay_register_location: string | null;
//     shift_id: number | null;
//     saturday_off: unknown;
//     grace_minutes: number | null;
//   };
//   probation: {
//     exists: boolean;
//     on_probation: boolean;
//     probation_period: number | null;
//     probation_end_date: string | null;
//     probation_status: string | null;
//     probation_extended_period: number | null;
//     probation_final_status: string | null;
//     confirmation_status: string | null;
//     confirmed_on: string | null;
//     probation_el_credit: number;
//     probation_el_transferred: number;
//   };
//   leave_status: EmployeeLeaveStatus;
//   joining_date: string | null;
//   probation_completed: boolean;
// }

// export interface ApplyLeaveDto {
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string;
//   to_time?: string;
//   days: number;
//   minutes?: number; // required for SHORT leave (arrival_late / leaving_early)
//   half_day?: boolean;
//   reason?: string;
//   submission_type?: 'self' | 'admin';
//   applied_by: number;
//   hod_name?: string;
//   coordinator_name?: string;
//   undertaking_accepted: boolean;
// }

// export interface LeaveQueryParams {
//   page?: number | string;
//   limit?: number | string;
//   employee_id?: number | string;
//   status?: string;
//   leave_type_id?: number | string;
// }

// export interface LeaveTypeDto {
//   name: string;
//   code: string;
//   unit?: 'day' | 'minutes';
//   days_per_year?: number;
//   monthly_quota_minutes?: number;
//   split_chunk_minutes?: number;
//   allow_split?: boolean;
//   is_paid?: boolean;
//   carry_forward?: boolean;
//   max_carry_days?: number;
//   min_advance_days?: number;
//   max_backdate_days?: number;
//   sandwich_applies?: boolean;
//   allow_half_day?: boolean;
//   requires_approval?: boolean;
//   is_earned?: boolean;
//   deduct_from_leave_type_id?: number | null;
// }

// export interface LeavePolicyDto {
//   sandwich_enabled?: boolean;
//   sandwich_include_weekly_off?: boolean;
//   sandwich_include_holidays?: boolean;
// }

// export interface CreditSpecialLeaveDto {
//   employee_id: number;
//   leave_type_id: number; // the SPECIAL LeaveType's id
//   credit_date: string;
//   days: number;
//   holiday_name?: string;
//   note?: string;
// }

// interface ManagerEmployee {
//   id: number;
//   employee_code: string;
//   first_name: string;
//   middle_name: string | null;
//   last_name: string;
//   email: string | null;
//   phone: string | null;
//   status: string;
//   employment_type: string;
//   company_id: number;
//   department_id: number | null;
//   sub_department_id: number | null;
//   designation_id: number | null;
//   avatar_url: string | null;
// }

// interface MyManagersResponse {
//   l1_manager: ManagerEmployee | null;
//   l2_manager: ManagerEmployee | null;
// }

// // Whitelisted fields only — never let a caller overwrite id/company_id/etc.
// const LEAVE_TYPE_UPDATABLE_FIELDS: (keyof LeaveTypeDto)[] = [
//   'name', 'code', 'unit', 'days_per_year', 'monthly_quota_minutes', 'split_chunk_minutes',
//   'allow_split', 'is_paid', 'carry_forward', 'max_carry_days', 'min_advance_days',
//   'max_backdate_days', 'sandwich_applies', 'allow_half_day', 'requires_approval',
//   'is_earned', 'deduct_from_leave_type_id',
// ];

// export class LeaveService {
//   // ─── LeaveRequest ═══════════════════════════════════════════════════════

//   // ─── List all leave requests (company-scoped) ──────────────────────────────
//   async getAll(query: LeaveQueryParams, companyId: number) {
//     const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

//     const where: WhereOptions = {};
//     if (query.status) where['status'] = query.status;
//     if (query.employee_id) where['employee_id'] = Number(query.employee_id);
//     if (query.leave_type_id) where['leave_type_id'] = Number(query.leave_type_id);

//     const { count, rows } = await LeaveRequest.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: [['created_at', 'DESC']],
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code', 'is_paid'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'avatar_url'],
//         },
//       ],
//     });

//     return { rows, meta: buildPaginationMeta(page, limit, count) };
//   }

//   // ─── Pending approvals ───────────────────────────────────────────────────
//   async getPendingForManager(_managerId: number, companyId: number) {
//     return LeaveRequest.findAll({
//       where: { status: 'Pending' },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//         },
//       ],
//       order: [['created_at', 'ASC']],
//     });
//   }

//   // ─── Single leave request, full detail (NEW — controller's getLeaveById) ──
//   async getById(id: number, companyId: number) {
//     const leave = await LeaveRequest.findOne({
//       where: { id },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'unit', 'is_paid'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//         },
//       ],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
//   }

//   // ─── Per-day sandwich/charged breakdown (NEW — LeaveRequestDay) ───────────
//   async getBreakdown(leaveRequestId: number) {
//     const exists = await LeaveRequest.findByPk(leaveRequestId, { attributes: ['id'] });
//     if (!exists) throw new AppError('Leave request not found', 404);

//     return LeaveRequestDay.findAll({
//       where: { leave_request_id: leaveRequestId },
//       order: [['date', 'ASC']],
//     });
//   }

//   // ─── Apply for leave ───────────────────────────────────────────────────────
//   async apply(dto: ApplyLeaveDto, companyId: number) {
//     const leaveType = await LeaveType.findOne({
//       where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
//     });
//     if (!leaveType) throw new AppError('Leave type not found or inactive', 404);

//     if (SHORT_LEAVE_APPLICATION_TYPES.includes(dto.leave_application_type) && (!dto.from_time || !dto.to_time)) {
//       throw new AppError('From/To time are required for Arrival Late / Leaving Early', 400);
//     }

//     const targetEmployee = await Employee.findOne({
//       where: { id: dto.employee_id, company_id: companyId },
//     });
//     if (!targetEmployee) throw new AppError('Employee not found', 404);

//     // Check for overlapping approved/pending leaves. A 1st Half + 2nd Half pair
//     // on the exact same single date is NOT a conflict.
//     const candidates = await LeaveRequest.findAll({
//       where: {
//         employee_id: dto.employee_id,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         [Op.or]: [
//           { from_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           { to_date: { [Op.between]: [dto.from_date, dto.to_date] } },
//           {
//             from_date: { [Op.lte]: dto.from_date },
//             to_date: { [Op.gte]: dto.to_date },
//           },
//         ],
//       },
//     });

//     const newIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(dto.leave_application_type) && dto.from_date === dto.to_date;

//     const overlap = candidates.find((existing) => {
//       const existingIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(existing.leave_application_type)
//         && existing.from_date === existing.to_date;
//       const sameSingleDay = newIsHalfDay && existingIsHalfDay && existing.from_date === dto.from_date;
//       const differentHalves = existing.leave_application_type !== dto.leave_application_type;
//       if (sameSingleDay && differentHalves) return false;
//       return true;
//     });

//     if (overlap) {
//       throw new AppError(
//         `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
//         409,
//       );
//     }

//     const leaveRequestPayload = {
//       employee_id: dto.employee_id,
//       leave_type_id: dto.leave_type_id,
//       leave_application_type: dto.leave_application_type,
//       from_date: dto.from_date,
//       to_date: dto.to_date,
//       from_time: dto.from_time ?? null,
//       to_time: dto.to_time ?? null,
//       days: dto.days,
//       minutes: dto.minutes ?? 0,
//       half_day: dto.days % 1 !== 0,
//       reason: dto.reason ?? null,
//       status: 'Pending' as const,
//       submission_type: dto.submission_type ?? 'self',
//       applied_by: dto.applied_by,
//       hod_name: dto.hod_name ?? null,
//       coordinator_name: dto.coordinator_name ?? null,
//       undertaking_accepted: dto.undertaking_accepted,
//     };

//     // CORRECTED — this branch didn't exist before. SHORT leave fell through
//     // to the "days_per_year > 0" check below, which SHORT never satisfies
//     // (its quota lives in monthly_quota_minutes, days_per_year is always 0
//     // in the seed data) — so that check silently no-opped and Short Leave
//     // could be applied for with NO balance check and NO deduction at all.
//     if (leaveType.code === 'SHORT') {
//       const minutes = Number(dto.minutes) || 0;
//       if (minutes <= 0) {
//         throw new AppError('minutes is required for Short Leave', 400);
//       }
//       const chunk = Number(leaveType.split_chunk_minutes) || 30;
//       const quota = Number(leaveType.monthly_quota_minutes) || 60;
//       const validAmount = minutes === quota || (leaveType.allow_split && minutes === chunk);
//       if (!validAmount) {
//         throw new AppError(`Short Leave must be ${chunk} or ${quota} minutes`, 400);
//       }

//       const from = new Date(dto.from_date);
//       const year = from.getFullYear();
//       const month = from.getMonth() + 1;

//       return sequelize.transaction(async (transaction) => {
//         const [balance] = await EmployeeLeaveMinutesBalance.findOrCreate({
//           where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year, month },
//           defaults: {
//             employee_id: dto.employee_id,
//             leave_type_id: leaveType.id,
//             year,
//             month,
//             allocated_minutes: quota,
//             used_minutes: 0,
//             pending_minutes: 0,
//           },
//           transaction,
//           lock: transaction.LOCK.UPDATE,
//         });

//         const available =
//           Number(balance.allocated_minutes) - Number(balance.used_minutes) - Number(balance.pending_minutes);

//         if (minutes > available) {
//           throw new AppError(
//             `Insufficient Short Leave balance: ${available} minute(s) remaining this month, requested ${minutes}`,
//             400,
//           );
//         }

//         balance.pending_minutes = Number(balance.pending_minutes) + minutes;
//         await balance.save({ transaction });

//         return this.createLeaveRequestWithRefNo(leaveRequestPayload, transaction);
//       });
//     }

//     if (BALANCE_TRACKED_LEAVE_CODES.includes(leaveType.code)) {
//       const year = new Date(dto.from_date).getFullYear();

//       return sequelize.transaction(async (transaction) => {
//         const [balance] = await EmployeeLeaveBalance.findOrCreate({
//           where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year },
//           defaults: {
//             employee_id: dto.employee_id,
//             leave_type_id: leaveType.id,
//             year,
//             allocated: 0,
//             used: 0,
//             pending: 0,
//             carried_forward: 0,
//           },
//           transaction,
//           lock: transaction.LOCK.UPDATE,
//         });

//         const available =
//           Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);

//         if (dto.days > available) {
//           throw new AppError(
//             `Insufficient ${leaveType.name} balance: ${available} day(s) remaining, requested ${dto.days}`,
//             400,
//           );
//         }

//         balance.pending = Number(balance.pending) + dto.days;
//         await balance.save({ transaction });

//         return this.createLeaveRequestWithRefNo(leaveRequestPayload, transaction);
//       });
//     }

//     // Everything else (leave types not in BALANCE_TRACKED_LEAVE_CODES and
//     // not SHORT) falls through with no balance check — there shouldn't be
//     // any such type in normal seed data, but this isn't a silent gap: it's
//     // the explicit "untracked" path for a leave type an admin marked as
//     // unlimited/unmetered.
//     return this.createLeaveRequestWithRefNo(leaveRequestPayload);
//   }

//   // ref_no is required + unique on LeaveRequest but was never supplied by
//   // apply() — that's what threw the TS error. Generated as LV-<year>-<seq>,
//   // same convention your original demo seed data used (LV-2026-0001, ...).
//   // Wrapped with a small retry-on-collision loop since the sequence number
//   // comes from a plain COUNT rather than a DB sequence, so two concurrent
//   // applies in the same millisecond could in theory race for the same
//   // number — the unique index catches it and this retries with a fresh one.
//   private async generateRefNo(): Promise<string> {
//     const year = new Date().getFullYear();
//     const prefix = `LV-${year}-`;
//     const count = await LeaveRequest.count({ where: { ref_no: { [Op.like]: `${prefix}%` } } });
//     return `${prefix}${String(count + 1).padStart(4, '0')}`;
//   }

//   private async createLeaveRequestWithRefNo(
//     payload: Record<string, unknown>,
//     transaction?: Transaction,
//     attempt = 0,
//   ): Promise<LeaveRequest> {
//     const ref_no = await this.generateRefNo();
//     try {
//       return await LeaveRequest.create({ ...payload, ref_no } as any, transaction ? { transaction } : undefined);
//     } catch (err: any) {
//       if (err?.name === 'SequelizeUniqueConstraintError' && attempt < 3) {
//         return this.createLeaveRequestWithRefNo(payload, transaction, attempt + 1);
//       }
//       throw err;
//     }
//   }

//   // ─── Approve ───────────────────────────────────────────────────────────────
//   async approve(id: number, approvedBy: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be approved', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Approved', approved_by: approvedBy, approved_at: new Date() },
//         { transaction },
//       );
//       await this.moveBalancePendingToUsed(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: approvedBy,
//       action: 'LEAVE_APPROVED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Approved', approved_by: approvedBy },
//     });

//     return leave;
//   }

//   // ─── Reject ────────────────────────────────────────────────────────────────
//   async reject(id: number, rejectedBy: number, companyId: number, reason?: string) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be rejected', 400);

//     await sequelize.transaction(async (transaction) => {
//       await leave.update(
//         { status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null },
//         { transaction },
//       );
//       await this.releaseBalancePending(leave, transaction);
//     });

//     await logActivity({
//       companyId,
//       employeeId: rejectedBy,
//       action: 'LEAVE_REJECTED',
//       module: 'leaves',
//       entityId: id,
//       newValues: { status: 'Rejected', reason },
//     });

//     return leave;
//   }

//   // ─── Cancel (by employee) ──────────────────────────────────────────────────
//   async cancel(id: number, employeeId: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.employee_id !== employeeId)
//       throw new AppError('You can only cancel your own leave requests', 403);
//     if (!['Pending', 'Approved'].includes(leave.status))
//       throw new AppError('Leave cannot be cancelled in its current state', 400);

//     const wasApproved = leave.status === 'Approved';

//     await sequelize.transaction(async (transaction) => {
//       await leave.update({ status: 'Cancelled' }, { transaction });
//       if (wasApproved) {
//         await this.releaseBalanceUsed(leave, transaction);
//       } else {
//         await this.releaseBalancePending(leave, transaction);
//       }
//     });

//     return leave;
//   }

//   // ─── LeaveType ══════════════════════════════════════════════════════════

//   async getLeaveTypes(companyId: number) {
//     return LeaveType.findAll({
//       where: { company_id: companyId, is_active: true },
//       order: [['name', 'ASC']],
//     });
//   }

//   async getLeaveTypeById(id: number, companyId: number) {
//     const type = await LeaveType.findOne({ where: { id, company_id: companyId } });
//     if (!type) throw new AppError('Leave type not found', 404);
//     return type;
//   }

//   async createLeaveType(dto: LeaveTypeDto, companyId: number) {
//     if (!dto.name || !dto.code) throw new AppError('name and code are required', 400);

//     const existing = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code } });
//     if (existing) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);

//     return LeaveType.create({
//       company_id: companyId,
//       name: dto.name,
//       code: dto.code,
//       unit: dto.unit ?? 'day',
//       days_per_year: dto.days_per_year ?? 0,
//       monthly_quota_minutes: dto.monthly_quota_minutes ?? 0,
//       split_chunk_minutes: dto.split_chunk_minutes ?? 0,
//       allow_split: dto.allow_split ?? false,
//       is_paid: dto.is_paid ?? true,
//       carry_forward: dto.carry_forward ?? false,
//       max_carry_days: dto.max_carry_days ?? 0,
//       min_advance_days: dto.min_advance_days ?? 0,
//       max_backdate_days: dto.max_backdate_days ?? 0,
//       sandwich_applies: dto.sandwich_applies ?? false,
//       allow_half_day: dto.allow_half_day ?? false,
//       requires_approval: dto.requires_approval ?? true,
//       is_earned: dto.is_earned ?? false,
//       deduct_from_leave_type_id: dto.deduct_from_leave_type_id ?? null,
//     });
//   }

//   async updateLeaveType(id: number, dto: Partial<LeaveTypeDto>, companyId: number) {
//     const type = await this.getLeaveTypeById(id, companyId);

//     if (dto.code && dto.code !== type.code) {
//       const clash = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code, id: { [Op.ne]: id } } });
//       if (clash) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);
//     }

//     const patch: Record<string, unknown> = {};
//     for (const field of LEAVE_TYPE_UPDATABLE_FIELDS) {
//       if (dto[field] !== undefined) patch[field] = dto[field];
//     }
//     await type.update(patch);
//     return type;
//   }

//   async setLeaveTypeActive(id: number, isActive: boolean, companyId: number) {
//     const type = await this.getLeaveTypeById(id, companyId);
//     await type.update({ is_active: isActive });
//     return type;
//   }

//   // ─── LeavePolicySetting ═════════════════════════════════════════════════

//   async getLeavePolicy(companyId: number) {
//     const [policy] = await LeavePolicySetting.findOrCreate({
//       where: { company_id: companyId },
//       defaults: {
//         company_id: companyId,
//         sandwich_enabled: true,
//         sandwich_include_weekly_off: true,
//         sandwich_include_holidays: true,
//       },
//     });
//     return policy;
//   }

//   async updateLeavePolicy(companyId: number, dto: LeavePolicyDto) {
//     const policy = await this.getLeavePolicy(companyId);
//     const patch: Record<string, unknown> = {};
//     if (dto.sandwich_enabled !== undefined) patch.sandwich_enabled = dto.sandwich_enabled;
//     if (dto.sandwich_include_weekly_off !== undefined) patch.sandwich_include_weekly_off = dto.sandwich_include_weekly_off;
//     if (dto.sandwich_include_holidays !== undefined) patch.sandwich_include_holidays = dto.sandwich_include_holidays;
//     await policy.update(patch);
//     return policy;
//   }

//   // ─── EmployeeWeeklyOffAssignment ════════════════════════════════════════

//   async getEmployeeWeeklyOff(employeeId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return EmployeeWeeklyOffAssignment.findOne({
//       where: { employee_id: employeeId },
//       include: [{ model: WeeklyOffPreset, as: 'weeklyOffPreset' }],
//     });
//   }

//   async assignEmployeeWeeklyOff(employeeId: number, weeklyOffPresetId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const preset = await WeeklyOffPreset.findByPk(weeklyOffPresetId);
//     if (!preset) throw new AppError('Weekly-off preset not found', 404);

//     const [assignment] = await EmployeeWeeklyOffAssignment.findOrCreate({
//       where: { employee_id: employeeId },
//       defaults: { employee_id: employeeId, weekly_off_preset_id: weeklyOffPresetId },
//     });
//     if (assignment.weekly_off_preset_id !== weeklyOffPresetId) {
//       await assignment.update({ weekly_off_preset_id: weeklyOffPresetId });
//     }
//     return assignment;
//   }

//   // ─── EmployeeLeaveBalance (annual, day-based) ══════════════════════════

//   async getBalances(employeeId: number, year = new Date().getFullYear()) {
//     const balances = await EmployeeLeaveBalance.findAll({
//       where: { employee_id: employeeId, year },
//     });

//     if (!balances.length) return [];

//     const leaveTypeIds = balances.map((balance) => balance.leave_type_id);
//     const leaveTypes = await LeaveType.findAll({
//       where: { id: leaveTypeIds, is_active: true },
//       order: [['name', 'ASC']],
//     });
//     const leaveTypeMap = new Map(leaveTypes.map((type) => [type.id, type]));

//     return balances
//       .filter((balance) => leaveTypeMap.has(balance.leave_type_id))
//       .map((balance) => {
//         const leaveType = leaveTypeMap.get(balance.leave_type_id)!;
//         const allocated = Number(balance.allocated);
//         const used = Number(balance.used);
//         const pending = Number(balance.pending);
//         const carriedForward = Number(balance.carried_forward);
//         const available = allocated + carriedForward - used - pending;

//         return {
//           leave_type_id: balance.leave_type_id,
//           name: leaveType.name,
//           code: leaveType.code,
//           year: balance.year,
//           allocated,
//           used,
//           pending,
//           carried_forward: carriedForward,
//           available: Math.max(0, available),
//         };
//       });
//   }

//   // ─── Company-wide balances overview (NEW) ════════════════════════════════
//   // Needed for an admin "all employees" balances table (EL/CL/SPECIAL columns
//   // + this month's Short Leave usage) — getBalances() above is per-employee
//   // only, there was no bulk read. Kept lean: two queries plus one for the
//   // minutes table, no N+1 per employee.
//   async getCompanyBalancesOverview(companyId: number, year = new Date().getFullYear()) {
//     const now = new Date();
//     const month = now.getMonth() + 1;

//     const employees = await Employee.findAll({
//       where: { company_id: companyId },
//       attributes: ['id', 'first_name', 'last_name', 'employee_code'],
//       order: [['first_name', 'ASC']],
//     });
//     if (!employees.length) return [];
//     const employeeIds = employees.map((e) => e.id);

//     const leaveTypes = await LeaveType.findAll({ where: { company_id: companyId } });
//     const typeByCode = new Map(leaveTypes.map((t) => [t.code, t]));

//     const balances = await EmployeeLeaveBalance.findAll({
//       where: { employee_id: employeeIds, year },
//     });
//     // employee_id -> leave_type_id -> available days
//     const balanceMap = new Map<number, Map<number, number>>();
//     for (const b of balances) {
//       const available = Number(b.allocated) + Number(b.carried_forward) - Number(b.used) - Number(b.pending);
//       if (!balanceMap.has(b.employee_id)) balanceMap.set(b.employee_id, new Map());
//       balanceMap.get(b.employee_id)!.set(b.leave_type_id, Math.max(0, available));
//     }

//     const shortType = typeByCode.get('SHORT');
//     const shortByEmployee = new Map<number, { allocated: number; used: number }>();
//     if (shortType) {
//       const shortBalances = await EmployeeLeaveMinutesBalance.findAll({
//         where: { employee_id: employeeIds, leave_type_id: shortType.id, year, month },
//       });
//       for (const s of shortBalances) {
//         shortByEmployee.set(s.employee_id, {
//           allocated: Number(s.allocated_minutes),
//           used: Number(s.used_minutes),
//         });
//       }
//     }

//     const elId = typeByCode.get('EL')?.id;
//     const clId = typeByCode.get('CL')?.id;
//     const specialId = typeByCode.get('SPECIAL')?.id;

//     return employees.map((e) => {
//       const empBalances = balanceMap.get(e.id);
//       const short = shortByEmployee.get(e.id);
//       const shortAllocated = short?.allocated ?? Number(shortType?.monthly_quota_minutes ?? 60);
//       const shortUsed = short?.used ?? 0;

//       return {
//         employee_id: e.id,
//         name: [e.first_name, e.last_name].filter(Boolean).join(' '),
//         employee_code: e.employee_code,
//         EL: elId ? (empBalances?.get(elId) ?? 0) : 0,
//         CL: clId ? (empBalances?.get(clId) ?? 0) : 0,
//         SPECIAL: specialId ? (empBalances?.get(specialId) ?? 0) : 0,
//         short_used_minutes: shortUsed,
//         short_allocated_minutes: shortAllocated,
//       };
//     });
//   }

//   // ─── EmployeeLeaveMinutesBalance (Short Leave, monthly) ════════════════

//   async getShortLeaveBalance(employeeId: number, year: number, month: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const shortType = await LeaveType.findOne({ where: { company_id: companyId, code: 'SHORT' } });
//     if (!shortType) throw new AppError('Short Leave type not configured for this company', 404);

//     const [balance] = await EmployeeLeaveMinutesBalance.findOrCreate({
//       where: { employee_id: employeeId, leave_type_id: shortType.id, year, month },
//       defaults: {
//         employee_id: employeeId,
//         leave_type_id: shortType.id,
//         year,
//         month,
//         allocated_minutes: Number(shortType.monthly_quota_minutes) || 60,
//         used_minutes: 0,
//         pending_minutes: 0,
//       },
//     });

//     const allocated = Number(balance.allocated_minutes);
//     const used = Number(balance.used_minutes);
//     const pending = Number(balance.pending_minutes);
//     return {
//       leave_type_id: shortType.id,
//       year,
//       month,
//       allocated_minutes: allocated,
//       used_minutes: used,
//       pending_minutes: pending,
//       // CORRECTED — previously ignored pending_minutes entirely (the column
//       // didn't exist yet), so a Pending Short Leave request didn't actually
//       // reserve anything and a second request could overdraw the quota.
//       available_minutes: Math.max(0, allocated - used - pending),
//     };
//   }

//   // ─── EmployeeLeaveAccrual ═══════════════════════════════════════════════

//   async getLeaveAccruals(employeeId: number, year: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return EmployeeLeaveAccrual.findAll({
//       where: { employee_id: employeeId, year },
//       include: [{ model: LeaveType, attributes: ['name', 'code'] }],
//       order: [['month', 'ASC']],
//     });
//   }

//   // ─── LeaveCredit (Special Leave earn ledger) ═══════════════════════════

//   async creditSpecialLeave(dto: CreditSpecialLeaveDto, creditedBy: number, companyId: number) {
//     if (!dto.employee_id || !dto.leave_type_id || !dto.credit_date || !dto.days || dto.days <= 0) {
//       throw new AppError('employee_id, leave_type_id, credit_date and a positive days value are required', 400);
//     }

//     const employee = await Employee.findOne({ where: { id: dto.employee_id, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     const leaveType = await LeaveType.findOne({
//       where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
//     });
//     if (!leaveType) throw new AppError('Leave type not found or inactive', 404);
//     if (!leaveType.is_earned) {
//       throw new AppError(`"${leaveType.name}" is not configured as an earned/credited leave type`, 400);
//     }

//     const year = new Date(dto.credit_date).getFullYear();

//     return sequelize.transaction(async (transaction) => {
//       const credit = await LeaveCredit.create(
//         {
//           employee_id: dto.employee_id,
//           leave_type_id: dto.leave_type_id,
//           credit_date: dto.credit_date,
//           days: dto.days,
//           holiday_name: dto.holiday_name ?? null,
//           note: dto.note ?? null,
//           credited_by: creditedBy,
//         },
//         { transaction },
//       );

//       // Credited days increase the pool this leave type can be used against —
//       // same EmployeeLeaveBalance table CL/EL use, just adding to `allocated`.
//       const [balance] = await EmployeeLeaveBalance.findOrCreate({
//         where: { employee_id: dto.employee_id, leave_type_id: dto.leave_type_id, year },
//         defaults: {
//           employee_id: dto.employee_id,
//           leave_type_id: dto.leave_type_id,
//           year,
//           allocated: 0,
//           used: 0,
//           pending: 0,
//           carried_forward: 0,
//         },
//         transaction,
//         lock: transaction.LOCK.UPDATE,
//       });
//       balance.allocated = Number(balance.allocated) + Number(dto.days);
//       await balance.save({ transaction });

//       return credit;
//     });
//   }

//   async getLeaveCredits(employeeId: number, companyId: number) {
//     const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
//     if (!employee) throw new AppError('Employee not found', 404);

//     return LeaveCredit.findAll({
//       where: { employee_id: employeeId },
//       order: [['credit_date', 'DESC']],
//     });
//   }


//   async getMyManagedEmployees(managerEmployeeId: number, companyId: number) {
//     // First find employees whose L1 or L2 manager is the logged-in employee
//     const managerMappings = await EmployeeManagersWorkContact.findAll({
//       where: {
//         [Op.or]: [
//           { l1_manager_id: managerEmployeeId },
//           { l2_manager_id: managerEmployeeId },
//         ],
//       },
//       attributes: [
//         'employee_id',
//         'l1_manager_id',
//         'l2_manager_id',
//       ],
//       raw: true,
//     });

//     if (!managerMappings.length) {
//       return [];
//     }

//     const employeeIds = managerMappings.map(
//       (row: any) => Number(row.employee_id),
//     );

//     // Fetch the actual employee records, scoped to the logged-in user's company
//     const employees = await Employee.findAll({
//       where: {
//         id: {
//           [Op.in]: employeeIds,
//         },
//         company_id: companyId,
//       },
//       attributes: [
//         'id',
//         'employee_code',
//         'first_name',
//         'middle_name',
//         'last_name',
//         'email',
//         'phone',
//         'status',
//         'employment_type',
//         'company_id',
//         'department_id',
//         'sub_department_id',
//         'designation_id',
//         'avatar_url',
//       ],
//       order: [
//         ['first_name', 'ASC'],
//         ['last_name', 'ASC'],
//       ],
//     });

//     const mappingMap = new Map(
//       managerMappings.map((row: any) => [
//         Number(row.employee_id),
//         row,
//       ]),
//     );

//     return employees.map((employee) => {
//       const data = employee.toJSON() as any;
//       const mapping = mappingMap.get(Number(data.id));

//       const isL1 =
//         Number(mapping?.l1_manager_id) === Number(managerEmployeeId);

//       const isL2 =
//         Number(mapping?.l2_manager_id) === Number(managerEmployeeId);

//       return {
//         ...data,

//         // Tells frontend why this employee belongs to this manager
//         manager_type:
//           isL1 && isL2
//             ? ['L1', 'L2']
//             : isL1
//               ? ['L1']
//               : ['L2'],
//       };
//     });
//   }


//   // Get the L1/L2 managers of the logged-in employee
//   // async getMyManagers(employeeId: number, companyId: number): Promise<MyManagersResponse>{
//   //   const employee = await Employee.findOne({
//   //     where: {
//   //       id: employeeId,
//   //       company_id: companyId,
//   //     },
//   //     attributes: ['id'],
//   //     raw: true,
//   //   });

//   //   if (!employee) {
//   //     throw new AppError('Employee not found', 404);
//   //   }

//   //   const managerMapping = await EmployeeManagersWorkContact.findOne({
//   //     where: {
//   //       employee_id: employeeId,
//   //     },
//   //     attributes: [
//   //       'employee_id',
//   //       'l1_manager_id',
//   //       'l2_manager_id',
//   //     ],
//   //     raw: true,
//   //   });

//   //   if (!managerMapping) {
//   //     return {
//   //       l1_manager: null,
//   //       l2_manager: null,
//   //     };
//   //   }

//   //   const managerIds = [
//   //     managerMapping.l1_manager_id,
//   //     managerMapping.l2_manager_id,
//   //   ]
//   //     .filter((id): id is number => id !== null && id !== undefined)
//   //     .map(Number);

//   //   if (!managerIds.length) {
//   //     return {
//   //       l1_manager: null,
//   //       l2_manager: null,
//   //     };
//   //   }

//   //   const managers = await Employee.findAll({
//   //     where: {
//   //       id: {
//   //         [Op.in]: managerIds,
//   //       },
//   //       company_id: companyId,
//   //     },
//   //     attributes: [
//   //       'id',
//   //       'employee_code',
//   //       'first_name',
//   //       'middle_name',
//   //       'last_name',
//   //       'email',
//   //       'phone',
//   //       'status',
//   //       'employment_type',
//   //       'company_id',
//   //       'department_id',
//   //       'sub_department_id',
//   //       'designation_id',
//   //       'avatar_url',
//   //     ],
//   //     order: [
//   //       ['first_name', 'ASC'],
//   //       ['last_name', 'ASC'],
//   //     ],
//   //   });

//   //   const managerMap = new Map(
//   //     managers.map((manager) => [
//   //       Number(manager.id),
//   //       manager.toJSON(),
//   //     ]),
//   //   );

//   //   return {
//   //     l1_manager: managerMapping.l1_manager_id
//   //       ? managerMap.get(Number(managerMapping.l1_manager_id)) ?? null
//   //       : null,

//   //     l2_manager: managerMapping.l2_manager_id
//   //       ? managerMap.get(Number(managerMapping.l2_manager_id)) ?? null
//   //       : null,
//   //   };
//   // }



//   async getMyManagers(
//     employeeId: number,
//     companyId: number,
//   ): Promise<MyManagersResponse> {
//     const employee = await Employee.findOne({
//       where: {
//         id: employeeId,
//         company_id: companyId,
//       },
//       attributes: ['id'],
//       raw: true,
//     });

//     if (!employee) {
//       throw new AppError('Employee not found', 404);
//     }

//     const managerMapping = await EmployeeManagersWorkContact.findOne({
//       where: {
//         employee_id: employeeId,
//       },
//       attributes: [
//         'employee_id',
//         'l1_manager_id',
//         'l2_manager_id',
//       ],
//       raw: true,
//     });

//     if (!managerMapping) {
//       return {
//         l1_manager: null,
//         l2_manager: null,
//       };
//     }

//     const managerIds = [
//       managerMapping.l1_manager_id,
//       managerMapping.l2_manager_id,
//     ]
//       .filter(
//         (id): id is number =>
//           id !== null && id !== undefined,
//       )
//       .map(Number);

//     if (!managerIds.length) {
//       return {
//         l1_manager: null,
//         l2_manager: null,
//       };
//     }

//     const managers = await Employee.findAll({
//       where: {
//         id: {
//           [Op.in]: managerIds,
//         },
//         company_id: companyId,
//       },
//       attributes: [
//         'id',
//         'employee_code',
//         'first_name',
//         'middle_name',
//         'last_name',
//         'email',
//         'phone',
//         'status',
//         'employment_type',
//         'company_id',
//         'department_id',
//         'sub_department_id',
//         'designation_id',
//         'avatar_url',
//       ],
//     });

//     const managerMap = new Map<number, ManagerEmployee>(
//       managers.map((manager) => {
//         const data = manager.toJSON() as ManagerEmployee;

//         return [Number(data.id), data];
//       }),
//     );

//     return {
//       l1_manager: managerMapping.l1_manager_id
//         ? managerMap.get(
//           Number(managerMapping.l1_manager_id),
//         ) ?? null
//         : null,

//       l2_manager: managerMapping.l2_manager_id
//         ? managerMap.get(
//           Number(managerMapping.l2_manager_id),
//         ) ?? null
//         : null,
//     };
//   }

//   // ─── Monthly leave processing (delegates to existing job) ═══════════════

//   async processMonthlyLeave(employeeId: number, year: number, month: number) {
//     return runMonthlyLeaveJob(employeeId, year, month);
//   }

//   // ─── Private helpers ───────────────────────────────────────────────────────

//   private async getUsedDays(employeeId: number, leaveTypeId: number, year: number) {
//     const rows = await LeaveRequest.findAll({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveTypeId,
//         status: { [Op.in]: ['Pending', 'Approved'] },
//         from_date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] },
//       },
//       attributes: ['days'],
//     });
//     return rows.reduce((sum, r) => sum + Number(r.days), 0);
//   }

//   private async findByIdScoped(id: number, companyId: number) {
//     const leave = await LeaveRequest.findOne({
//       where: { id },
//       include: [
//         { model: LeaveType, as: 'leaveType', attributes: ['id', 'code'] },
//         {
//           model: Employee,
//           as: 'employee',
//           where: { company_id: companyId },
//           attributes: ['id'],
//         },
//       ],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
//   }

//   private isBalanceTracked(leave: LeaveRequest): boolean {
//     const code = (leave as any).leaveType?.code;
//     return Boolean(code) && BALANCE_TRACKED_LEAVE_CODES.includes(code);
//   }

//   // ADDED — SHORT leave's pending/used hold lives in a different table
//   // (EmployeeLeaveMinutesBalance, keyed by month) than the day-based types,
//   // so it needs its own detection + row lookup + move/release logic. Without
//   // this, approve()/reject()/cancel() only ever touched EmployeeLeaveBalance
//   // and a Short Leave request's pending_minutes/used_minutes never moved —
//   // the hold from apply() would just sit there forever, permanently locking
//   // up quota even after the request was approved or rejected.
//   private isMinutesTracked(leave: LeaveRequest): boolean {
//     const code = (leave as any).leaveType?.code;
//     return code === 'SHORT';
//   }

//   private async getMinutesBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
//     const from = new Date(leave.from_date);
//     return EmployeeLeaveMinutesBalance.findOne({
//       where: {
//         employee_id: leave.employee_id,
//         leave_type_id: leave.leave_type_id,
//         year: from.getFullYear(),
//         month: from.getMonth() + 1,
//       },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });
//   }

//   private async getBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
//     const year = new Date(leave.from_date).getFullYear();
//     return EmployeeLeaveBalance.findOne({
//       where: { employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });
//   }

//   private async moveBalancePendingToUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (this.isMinutesTracked(leave)) {
//       const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
//       if (!balance) return;
//       balance.pending_minutes = Math.max(0, Number(balance.pending_minutes) - Number(leave.minutes));
//       balance.used_minutes = Number(balance.used_minutes) + Number(leave.minutes);
//       await balance.save({ transaction });
//       return;
//     }
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     balance.used = Number(balance.used) + Number(leave.days);
//     await balance.save({ transaction });
//   }

//   private async releaseBalancePending(leave: LeaveRequest, transaction: Transaction) {
//     if (this.isMinutesTracked(leave)) {
//       const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
//       if (!balance) return;
//       balance.pending_minutes = Math.max(0, Number(balance.pending_minutes) - Number(leave.minutes));
//       await balance.save({ transaction });
//       return;
//     }
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
//     await balance.save({ transaction });
//   }

//   private async releaseBalanceUsed(leave: LeaveRequest, transaction: Transaction) {
//     if (this.isMinutesTracked(leave)) {
//       const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
//       if (!balance) return;
//       balance.used_minutes = Math.max(0, Number(balance.used_minutes) - Number(leave.minutes));
//       await balance.save({ transaction });
//       return;
//     }
//     if (!this.isBalanceTracked(leave)) return;
//     const balance = await this.getBalanceRowForLeave(leave, transaction);
//     if (!balance) return;

//     balance.used = Math.max(0, Number(balance.used) - Number(leave.days));
//     await balance.save({ transaction });
//   }
// }

// // ─── Standalone exports (unrelated to LeaveService's leave-model CRUD,
// // kept exactly as in your original file so nothing else importing them
// // breaks) ─────────────────────────────────────────────────────────────────

// export async function getEmployeeLeaveInformation(
//   employeeId: number,
//   processingDate: Date = new Date(),
// ): Promise<EmployeeLeaveInformation> {
//   const employee = await Employee.findByPk(employeeId);
//   if (!employee) {
//     throw new Error(`Employee not found: ${employeeId}`);
//   }

//   const probation = await EmployeeCommitmentProbation.findOne({
//     where: { employee_id: employeeId },
//     order: [['id', 'DESC']],
//   });

//   const employeeData = employee.toJSON() as any;
//   const fullName = [employeeData.first_name, employeeData.middle_name, employeeData.last_name]
//     .filter(Boolean)
//     .join(' ')
//     .trim();

//   const joiningDate = employeeData.current_doj || employeeData.actual_doj || null;

//   const probationData = probation ? (probation.toJSON() as any) : null;
//   const onProbation = Boolean(probationData?.on_probation);
//   const probationEndDate = probationData?.probation_end_date || null;

//   let probationCompleted = false;
//   if (probationData) {
//     if (
//       probationData.confirmation_status === 'Confirmed' ||
//       probationData.confirmation_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//     if (probationEndDate) {
//       const endDate = new Date(probationEndDate);
//       if (!Number.isNaN(endDate.getTime()) && processingDate >= endDate) {
//         probationCompleted = true;
//       }
//     }
//     if (
//       probationData.probation_final_status === 'Completed' ||
//       probationData.probation_final_status === 'completed' ||
//       probationData.probation_final_status === 'Confirmed' ||
//       probationData.probation_final_status === 'confirmed'
//     ) {
//       probationCompleted = true;
//     }
//   }

//   let leaveStatus: EmployeeLeaveStatus;
//   if (employeeData.employment_type === 'Contractual') {
//     leaveStatus = 'CONTRACTUAL';
//   } else if (employeeData.employment_type === 'Permanent' && onProbation && !probationCompleted) {
//     leaveStatus = 'PROBATION';
//   } else if (employeeData.employment_type === 'Permanent' && probationCompleted) {
//     leaveStatus = 'REGULAR_AFTER_PROBATION';
//   } else {
//     leaveStatus = 'REGULAR_CONTINUING';
//   }

//   return {
//     employee: {
//       id: employeeData.id,
//       employee_code: employeeData.employee_code ?? null,
//       first_name: employeeData.first_name ?? null,
//       middle_name: employeeData.middle_name ?? null,
//       last_name: employeeData.last_name ?? null,
//       full_name: fullName,
//       company_id: employeeData.company_id ?? null,
//       status: employeeData.status ?? null,
//       employment_type: employeeData.employment_type ?? null,
//       email: employeeData.email ?? null,
//       phone: employeeData.phone ?? null,
//       department_id: employeeData.department_id ?? null,
//       sub_department_id: employeeData.sub_department_id ?? null,
//       designation_id: employeeData.designation_id ?? null,
//       l1_manager_id: employeeData.l1_manager_id ?? null,
//       l2_manager_id: employeeData.l2_manager_id ?? null,
//       reporting_manager_id: employeeData.reporting_manager_id ?? null,
//       actual_doj: employeeData.actual_doj ?? null,
//       current_doj: employeeData.current_doj ?? null,
//       working_site: employeeData.working_site ?? null,
//       working_city: employeeData.working_city ?? null,
//       working_state_country: employeeData.working_state_country ?? null,
//       pay_register_location: employeeData.pay_register_location ?? null,
//       shift_id: employeeData.shift_id ?? null,
//       saturday_off: employeeData.saturday_off ?? null,
//       grace_minutes: employeeData.grace_minutes ?? null,
//     },
//     probation: {
//       exists: Boolean(probationData),
//       on_probation: onProbation,
//       probation_period: probationData?.probation_period ?? null,
//       probation_end_date: probationData?.probation_end_date ?? null,
//       probation_status: probationData?.probation_status ?? null,
//       probation_extended_period: probationData?.probation_extended_period ?? null,
//       probation_final_status: probationData?.probation_final_status ?? null,
//       confirmation_status: probationData?.confirmation_status ?? null,
//       confirmed_on: probationData?.confirmed_on ?? null,
//       probation_el_credit: Number(probationData?.probation_el_credit ?? 0),
//       probation_el_transferred: Number(probationData?.probation_el_transferred ?? 0),
//     },
//     leave_status: leaveStatus,
//     joining_date: joiningDate,
//     probation_completed: probationCompleted,
//   };
// }

// export async function getMonthlyAttendanceSummary(
//   employeeId: number,
//   year: number,
//   month: number,
// ): Promise<MonthlyAttendanceSummary> {
//   const record = await EmployeeMonthlyAttendance.findOne({
//     where: { employee_id: employeeId, year, month },
//   });

//   if (!record) {
//     throw new AppError(
//       `No monthly attendance found for employee ${employeeId} for ${year}-${String(month).padStart(2, '0')}. ` +
//       `Has the monthly attendance job run for this period yet?`,
//       404,
//     );
//   }

//   const data = record.toJSON() as any;

//   // NOTE: wfhDays, holidayWorkedDays, weeklyOffWorkedDays are not currently
//   // tracked as their own columns in employee_monthly_attendance — defaulting
//   // to 0 rather than fabricating a number (see original comment in your file
//   // for why: attendance-combined.service.ts short-circuits to HOLIDAY/WEEK_OFF
//   // before evaluateAttendanceStatus() ever runs).
//   return {
//     employeeId: data.employee_id,
//     year: data.year,
//     month: data.month,
//     totalCalendarDays: data.total_days,
//     workingDays: data.working_days,
//     presentDays: data.present_days,
//     absentDays: data.absent_days,
//     halfDays: Number(data.half_days),
//     wfhDays: 0,
//     leaveDays: data.leave_days,
//     holidayWorkedDays: 0,
//     weeklyOffWorkedDays: 0,
//     totalWorkingHours: Number(data.total_working_hours),
//   };
// }









import { Op, Transaction, WhereOptions } from 'sequelize';
import {
  LeaveRequest,
  LeaveRequestDay,
  LeaveType,
  LeaveApplicationType,
  LeavePolicySetting,
  EmployeeWeeklyOffAssignment,
  EmployeeLeaveBalance,
  EmployeeLeaveMinutesBalance,
  EmployeeLeaveAccrual,
  LeaveCredit,
} from '../../database/models/LeaveModels';
import { WeeklyOffPreset } from '../../database/models/weeklyOffPreset';
import { Employee, EmployeeCommitmentProbation, EmployeeManagersWorkContact } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { logActivity } from '../../utils/activityLogger';
import { sequelize } from '../../config/database';
import { EmployeeMonthlyAttendance } from '../../database/models/EmployeeMonthlyAttendance';
import { processMonthlyLeave as runMonthlyLeaveJob } from './monthlyLeave.service';

const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

// Leave types whose balance is tracked via EmployeeLeaveBalance
// (allocated / used / pending / carried_forward).
//
// CORRECTED: added 'SPECIAL'. It was missing before — since SPECIAL's
// days_per_year is 0 (it's earned via LeaveCredit, not an annual grant),
// the old fallback branch in apply() ("if days_per_year > 0") silently
// skipped ALL balance checking for Special Leave, meaning an employee
// could apply for unlimited Special Leave regardless of actual credited
// balance. EmployeeLeaveBalance is generic per (employee, leave_type,
// year) — it already supports SPECIAL with no schema change needed.
const BALANCE_TRACKED_LEAVE_CODES = ['CL', 'EL', 'SPECIAL'];

export type EmployeeLeaveStatus =
  | 'PROBATION'
  | 'REGULAR_AFTER_PROBATION'
  | 'REGULAR_CONTINUING'
  | 'CONTRACTUAL';

export interface MonthlyAttendanceSummary {
  employeeId: number;
  year: number;
  month: number;
  totalCalendarDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  wfhDays: number;
  leaveDays: number;
  holidayWorkedDays: number;
  weeklyOffWorkedDays: number;
  totalWorkingHours: number;
}

export interface EmployeeLeaveInformation {
  employee: {
    id: number;
    employee_code: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    full_name: string;
    company_id: number | null;
    status: string | null;
    employment_type: string | null;
    email: string | null;
    phone: string | null;
    department_id: number | null;
    sub_department_id: number | null;
    designation_id: number | null;
    l1_manager_id: number | null;
    l2_manager_id: number | null;
    reporting_manager_id: number | null;
    actual_doj: string | null;
    current_doj: string | null;
    working_site: string | null;
    working_city: string | null;
    working_state_country: string | null;
    pay_register_location: string | null;
    shift_id: number | null;
    saturday_off: unknown;
    grace_minutes: number | null;
  };
  probation: {
    exists: boolean;
    on_probation: boolean;
    probation_period: number | null;
    probation_end_date: string | null;
    probation_status: string | null;
    probation_extended_period: number | null;
    probation_final_status: string | null;
    confirmation_status: string | null;
    confirmed_on: string | null;
    probation_el_credit: number;
    probation_el_transferred: number;
  };
  leave_status: EmployeeLeaveStatus;
  joining_date: string | null;
  probation_completed: boolean;
}

export interface ApplyLeaveDto {
  employee_id: number;
  leave_type_id: number;
  leave_application_type: LeaveApplicationType;
  from_date: string;
  to_date: string;
  from_time?: string;
  to_time?: string;
  days: number;
  minutes?: number; // required for SHORT leave (arrival_late / leaving_early)
  half_day?: boolean;
  reason?: string;
  submission_type?: 'self' | 'admin';
  applied_by: number;
  l1_manager_id?: number | null;
  l2_manager_id?: number | null;
  undertaking_accepted: boolean;
}

export interface LeaveQueryParams {
  page?: number | string;
  limit?: number | string;
  employee_id?: number | string;
  status?: string;
  leave_type_id?: number | string;
}

export interface LeaveTypeDto {
  name: string;
  code: string;
  unit?: 'day' | 'minutes';
  days_per_year?: number;
  monthly_quota_minutes?: number;
  split_chunk_minutes?: number;
  allow_split?: boolean;
  is_paid?: boolean;
  carry_forward?: boolean;
  max_carry_days?: number;
  min_advance_days?: number;
  max_backdate_days?: number;
  sandwich_applies?: boolean;
  allow_half_day?: boolean;
  requires_approval?: boolean;
  is_earned?: boolean;
  deduct_from_leave_type_id?: number | null;
}

export interface LeavePolicyDto {
  sandwich_enabled?: boolean;
  sandwich_include_weekly_off?: boolean;
  sandwich_include_holidays?: boolean;
}

export interface CreditSpecialLeaveDto {
  employee_id: number;
  leave_type_id: number; // the SPECIAL LeaveType's id
  credit_date: string;
  days: number;
  holiday_name?: string;
  note?: string;
}

interface ManagerEmployee {
  id: number;
  employee_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  employment_type: string;
  company_id: number;
  department_id: number | null;
  sub_department_id: number | null;
  designation_id: number | null;
  avatar_url: string | null;
}

interface MyManagersResponse {
  l1_manager: ManagerEmployee | null;
  l2_manager: ManagerEmployee | null;
}

// Whitelisted fields only — never let a caller overwrite id/company_id/etc.
const LEAVE_TYPE_UPDATABLE_FIELDS: (keyof LeaveTypeDto)[] = [
  'name', 'code', 'unit', 'days_per_year', 'monthly_quota_minutes', 'split_chunk_minutes',
  'allow_split', 'is_paid', 'carry_forward', 'max_carry_days', 'min_advance_days',
  'max_backdate_days', 'sandwich_applies', 'allow_half_day', 'requires_approval',
  'is_earned', 'deduct_from_leave_type_id',
];

export class LeaveService {
  // ─── LeaveRequest ═══════════════════════════════════════════════════════

  // ─── List all leave requests (company-scoped) ──────────────────────────────
  async getAll(query: LeaveQueryParams, companyId: number) {
    const { page, limit, offset } = parsePaginationParams(query as Record<string, unknown>);

    const where: WhereOptions = {};
    if (query.status) where['status'] = query.status;
    if (query.employee_id) where['employee_id'] = Number(query.employee_id);
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

  // ─── Pending approvals ───────────────────────────────────────────────────
  async getPendingForManager(_managerId: number, companyId: number) {
    return LeaveRequest.findAll({
      where: { status: 'Pending' },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] },
        {
          model: Employee,
          as: 'employee',
          where: { company_id: companyId },
          attributes: ['id', 'first_name', 'last_name', 'employee_code'],
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  // ─── Single leave request, full detail (NEW — controller's getLeaveById) ──
  async getById(id: number, companyId: number) {
    const leave = await LeaveRequest.findOne({
      where: { id },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'unit', 'is_paid'] },
        {
          model: Employee,
          as: 'employee',
          where: { company_id: companyId },
          attributes: ['id', 'first_name', 'last_name', 'employee_code'],
        },
      ],
    });
    if (!leave) throw new AppError('Leave request not found', 404);
    return leave;
  }

  // ─── Per-day sandwich/charged breakdown (NEW — LeaveRequestDay) ───────────
  async getBreakdown(leaveRequestId: number) {
    const exists = await LeaveRequest.findByPk(leaveRequestId, { attributes: ['id'] });
    if (!exists) throw new AppError('Leave request not found', 404);

    return LeaveRequestDay.findAll({
      where: { leave_request_id: leaveRequestId },
      order: [['date', 'ASC']],
    });
  }

  // ─── Apply for leave ───────────────────────────────────────────────────────
  async apply(dto: ApplyLeaveDto, companyId: number) {
    const leaveType = await LeaveType.findOne({
      where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
    });
    if (!leaveType) throw new AppError('Leave type not found or inactive', 404);

    if (SHORT_LEAVE_APPLICATION_TYPES.includes(dto.leave_application_type) && (!dto.from_time || !dto.to_time)) {
      throw new AppError('From/To time are required for Arrival Late / Leaving Early', 400);
    }

    const targetEmployee = await Employee.findOne({
      where: { id: dto.employee_id, company_id: companyId },
    });
    if (!targetEmployee) throw new AppError('Employee not found', 404);

    // Check for overlapping approved/pending leaves. A 1st Half + 2nd Half pair
    // on the exact same single date is NOT a conflict.
    const candidates = await LeaveRequest.findAll({
      where: {
        employee_id: dto.employee_id,
        status: { [Op.in]: ['Pending', 'Approved'] },
        [Op.or]: [
          { from_date: { [Op.between]: [dto.from_date, dto.to_date] } },
          { to_date: { [Op.between]: [dto.from_date, dto.to_date] } },
          {
            from_date: { [Op.lte]: dto.from_date },
            to_date: { [Op.gte]: dto.to_date },
          },
        ],
      },
    });

    const newIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(dto.leave_application_type) && dto.from_date === dto.to_date;

    const overlap = candidates.find((existing) => {
      const existingIsHalfDay = HALF_DAY_APPLICATION_TYPES.includes(existing.leave_application_type)
        && existing.from_date === existing.to_date;
      const sameSingleDay = newIsHalfDay && existingIsHalfDay && existing.from_date === dto.from_date;
      const differentHalves = existing.leave_application_type !== dto.leave_application_type;
      if (sameSingleDay && differentHalves) return false;
      return true;
    });

    if (overlap) {
      throw new AppError(
        `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
        409,
      );
    }

    // L1/L2 managers are supplied by the request, but they must match the
    // target employee's actual manager mapping. This also works correctly
    // when an admin applies leave on behalf of another employee.
    const l1ManagerId =
      dto.l1_manager_id === null || dto.l1_manager_id === undefined
        ? null
        : Number(dto.l1_manager_id);

    const l2ManagerId =
      dto.l2_manager_id === null || dto.l2_manager_id === undefined
        ? null
        : Number(dto.l2_manager_id);

    if (l1ManagerId !== null && (!Number.isInteger(l1ManagerId) || l1ManagerId <= 0)) {
      throw new AppError('Invalid l1_manager_id', 400);
    }

    if (l2ManagerId !== null && (!Number.isInteger(l2ManagerId) || l2ManagerId <= 0)) {
      throw new AppError('Invalid l2_manager_id', 400);
    }

    const managerMapping = await EmployeeManagersWorkContact.findOne({
      where: { employee_id: dto.employee_id },
      attributes: ['employee_id', 'l1_manager_id', 'l2_manager_id'],
      raw: true,
    });

    const actualL1ManagerId = managerMapping?.l1_manager_id
      ? Number(managerMapping.l1_manager_id)
      : null;
    const actualL2ManagerId = managerMapping?.l2_manager_id
      ? Number(managerMapping.l2_manager_id)
      : null;

    if (l1ManagerId !== actualL1ManagerId) {
      throw new AppError('Invalid L1 manager for this employee', 400);
    }

    if (l2ManagerId !== actualL2ManagerId) {
      throw new AppError('Invalid L2 manager for this employee', 400);
    }

    const managerIds = [l1ManagerId, l2ManagerId].filter(
      (id): id is number => id !== null,
    );

    if (managerIds.length) {
      const managerCount = await Employee.count({
        where: {
          id: { [Op.in]: managerIds },
          company_id: companyId,
        },
      });

      if (managerCount !== new Set(managerIds).size) {
        throw new AppError('One or more managers do not belong to this company', 400);
      }
    }

    const leaveRequestPayload = {
      employee_id: dto.employee_id,
      leave_type_id: dto.leave_type_id,
      leave_application_type: dto.leave_application_type,
      from_date: dto.from_date,
      to_date: dto.to_date,
      from_time: dto.from_time ?? null,
      to_time: dto.to_time ?? null,
      days: dto.days,
      minutes: dto.minutes ?? 0,
      half_day: dto.days % 1 !== 0,
      reason: dto.reason ?? null,
      status: 'Pending' as const,
      submission_type: dto.submission_type ?? 'self',
      applied_by: dto.applied_by,
      l1_manager_id: l1ManagerId,
      l2_manager_id: l2ManagerId,
      undertaking_accepted: dto.undertaking_accepted,
    };

    // CORRECTED — this branch didn't exist before. SHORT leave fell through
    // to the "days_per_year > 0" check below, which SHORT never satisfies
    // (its quota lives in monthly_quota_minutes, days_per_year is always 0
    // in the seed data) — so that check silently no-opped and Short Leave
    // could be applied for with NO balance check and NO deduction at all.
    if (leaveType.code === 'SHORT') {
      const minutes = Number(dto.minutes) || 0;
      if (minutes <= 0) {
        throw new AppError('minutes is required for Short Leave', 400);
      }
      const chunk = Number(leaveType.split_chunk_minutes) || 30;
      const quota = Number(leaveType.monthly_quota_minutes) || 60;
      const validAmount = minutes === quota || (leaveType.allow_split && minutes === chunk);
      if (!validAmount) {
        throw new AppError(`Short Leave must be ${chunk} or ${quota} minutes`, 400);
      }

      const from = new Date(dto.from_date);
      const year = from.getFullYear();
      const month = from.getMonth() + 1;

      return sequelize.transaction(async (transaction) => {
        const [balance] = await EmployeeLeaveMinutesBalance.findOrCreate({
          where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year, month },
          defaults: {
            employee_id: dto.employee_id,
            leave_type_id: leaveType.id,
            year,
            month,
            allocated_minutes: quota,
            used_minutes: 0,
            pending_minutes: 0,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const available =
          Number(balance.allocated_minutes) - Number(balance.used_minutes) - Number(balance.pending_minutes);

        if (minutes > available) {
          throw new AppError(
            `Insufficient Short Leave balance: ${available} minute(s) remaining this month, requested ${minutes}`,
            400,
          );
        }

        balance.pending_minutes = Number(balance.pending_minutes) + minutes;
        await balance.save({ transaction });

        return this.createLeaveRequestWithRefNo(leaveRequestPayload, transaction);
      });
    }

    if (BALANCE_TRACKED_LEAVE_CODES.includes(leaveType.code)) {
      const year = new Date(dto.from_date).getFullYear();

      return sequelize.transaction(async (transaction) => {
        const [balance] = await EmployeeLeaveBalance.findOrCreate({
          where: { employee_id: dto.employee_id, leave_type_id: leaveType.id, year },
          defaults: {
            employee_id: dto.employee_id,
            leave_type_id: leaveType.id,
            year,
            allocated: 0,
            used: 0,
            pending: 0,
            carried_forward: 0,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const available =
          Number(balance.allocated) + Number(balance.carried_forward) - Number(balance.used) - Number(balance.pending);

        if (dto.days > available) {
          throw new AppError(
            `Insufficient ${leaveType.name} balance: ${available} day(s) remaining, requested ${dto.days}`,
            400,
          );
        }

        balance.pending = Number(balance.pending) + dto.days;
        await balance.save({ transaction });

        return this.createLeaveRequestWithRefNo(leaveRequestPayload, transaction);
      });
    }

    // Everything else (leave types not in BALANCE_TRACKED_LEAVE_CODES and
    // not SHORT) falls through with no balance check — there shouldn't be
    // any such type in normal seed data, but this isn't a silent gap: it's
    // the explicit "untracked" path for a leave type an admin marked as
    // unlimited/unmetered.
    return this.createLeaveRequestWithRefNo(leaveRequestPayload);
  }

  // ref_no is required + unique on LeaveRequest but was never supplied by
  // apply() — that's what threw the TS error. Generated as LV-<year>-<seq>,
  // same convention your original demo seed data used (LV-2026-0001, ...).
  // Wrapped with a small retry-on-collision loop since the sequence number
  // comes from a plain COUNT rather than a DB sequence, so two concurrent
  // applies in the same millisecond could in theory race for the same
  // number — the unique index catches it and this retries with a fresh one.
  private async generateRefNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LV-${year}-`;
    const count = await LeaveRequest.count({ where: { ref_no: { [Op.like]: `${prefix}%` } } });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async createLeaveRequestWithRefNo(
    payload: Record<string, unknown>,
    transaction?: Transaction,
    attempt = 0,
  ): Promise<LeaveRequest> {
    const ref_no = await this.generateRefNo();
    try {
      return await LeaveRequest.create({ ...payload, ref_no } as any, transaction ? { transaction } : undefined);
    } catch (err: any) {
      if (err?.name === 'SequelizeUniqueConstraintError' && attempt < 3) {
        return this.createLeaveRequestWithRefNo(payload, transaction, attempt + 1);
      }
      throw err;
    }
  }

  // ─── Approve ───────────────────────────────────────────────────────────────
  async approve(id: number, approvedBy: number, companyId: number) {
    const leave = await this.findByIdScoped(id, companyId);
    if (leave.status !== 'Pending')
      throw new AppError('Only Pending requests can be approved', 400);

    await sequelize.transaction(async (transaction) => {
      await leave.update(
        { status: 'Approved', approved_by: approvedBy, approved_at: new Date() },
        { transaction },
      );
      await this.moveBalancePendingToUsed(leave, transaction);
    });

    await logActivity({
      companyId,
      employeeId: approvedBy,
      action: 'LEAVE_APPROVED',
      module: 'leaves',
      entityId: id,
      newValues: { status: 'Approved', approved_by: approvedBy },
    });

    return leave;
  }

  // ─── Reject ────────────────────────────────────────────────────────────────
  async reject(id: number, rejectedBy: number, companyId: number, reason?: string) {
    const leave = await this.findByIdScoped(id, companyId);
    if (leave.status !== 'Pending')
      throw new AppError('Only Pending requests can be rejected', 400);

    await sequelize.transaction(async (transaction) => {
      await leave.update(
        { status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null },
        { transaction },
      );
      await this.releaseBalancePending(leave, transaction);
    });

    await logActivity({
      companyId,
      employeeId: rejectedBy,
      action: 'LEAVE_REJECTED',
      module: 'leaves',
      entityId: id,
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

    const wasApproved = leave.status === 'Approved';

    await sequelize.transaction(async (transaction) => {
      await leave.update({ status: 'Cancelled' }, { transaction });
      if (wasApproved) {
        await this.releaseBalanceUsed(leave, transaction);
      } else {
        await this.releaseBalancePending(leave, transaction);
      }
    });

    return leave;
  }

  // ─── LeaveType ══════════════════════════════════════════════════════════

  async getLeaveTypes(companyId: number) {
    return LeaveType.findAll({
      where: { company_id: companyId, is_active: true },
      order: [['name', 'ASC']],
    });
  }

  async getLeaveTypeById(id: number, companyId: number) {
    const type = await LeaveType.findOne({ where: { id, company_id: companyId } });
    if (!type) throw new AppError('Leave type not found', 404);
    return type;
  }

  async createLeaveType(dto: LeaveTypeDto, companyId: number) {
    if (!dto.name || !dto.code) throw new AppError('name and code are required', 400);

    const existing = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code } });
    if (existing) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);

    return LeaveType.create({
      company_id: companyId,
      name: dto.name,
      code: dto.code,
      unit: dto.unit ?? 'day',
      days_per_year: dto.days_per_year ?? 0,
      monthly_quota_minutes: dto.monthly_quota_minutes ?? 0,
      split_chunk_minutes: dto.split_chunk_minutes ?? 0,
      allow_split: dto.allow_split ?? false,
      is_paid: dto.is_paid ?? true,
      carry_forward: dto.carry_forward ?? false,
      max_carry_days: dto.max_carry_days ?? 0,
      min_advance_days: dto.min_advance_days ?? 0,
      max_backdate_days: dto.max_backdate_days ?? 0,
      sandwich_applies: dto.sandwich_applies ?? false,
      allow_half_day: dto.allow_half_day ?? false,
      requires_approval: dto.requires_approval ?? true,
      is_earned: dto.is_earned ?? false,
      deduct_from_leave_type_id: dto.deduct_from_leave_type_id ?? null,
    });
  }

  async updateLeaveType(id: number, dto: Partial<LeaveTypeDto>, companyId: number) {
    const type = await this.getLeaveTypeById(id, companyId);

    if (dto.code && dto.code !== type.code) {
      const clash = await LeaveType.findOne({ where: { company_id: companyId, code: dto.code, id: { [Op.ne]: id } } });
      if (clash) throw new AppError(`Leave type code "${dto.code}" already exists`, 409);
    }

    const patch: Record<string, unknown> = {};
    for (const field of LEAVE_TYPE_UPDATABLE_FIELDS) {
      if (dto[field] !== undefined) patch[field] = dto[field];
    }
    await type.update(patch);
    return type;
  }

  async setLeaveTypeActive(id: number, isActive: boolean, companyId: number) {
    const type = await this.getLeaveTypeById(id, companyId);
    await type.update({ is_active: isActive });
    return type;
  }

  // ─── LeavePolicySetting ═════════════════════════════════════════════════

  async getLeavePolicy(companyId: number) {
    const [policy] = await LeavePolicySetting.findOrCreate({
      where: { company_id: companyId },
      defaults: {
        company_id: companyId,
        sandwich_enabled: true,
        sandwich_include_weekly_off: true,
        sandwich_include_holidays: true,
      },
    });
    return policy;
  }

  async updateLeavePolicy(companyId: number, dto: LeavePolicyDto) {
    const policy = await this.getLeavePolicy(companyId);
    const patch: Record<string, unknown> = {};
    if (dto.sandwich_enabled !== undefined) patch.sandwich_enabled = dto.sandwich_enabled;
    if (dto.sandwich_include_weekly_off !== undefined) patch.sandwich_include_weekly_off = dto.sandwich_include_weekly_off;
    if (dto.sandwich_include_holidays !== undefined) patch.sandwich_include_holidays = dto.sandwich_include_holidays;
    await policy.update(patch);
    return policy;
  }

  // ─── EmployeeWeeklyOffAssignment ════════════════════════════════════════

  async getEmployeeWeeklyOff(employeeId: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    return EmployeeWeeklyOffAssignment.findOne({
      where: { employee_id: employeeId },
      include: [{ model: WeeklyOffPreset, as: 'weeklyOffPreset' }],
    });
  }

  async assignEmployeeWeeklyOff(employeeId: number, weeklyOffPresetId: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const preset = await WeeklyOffPreset.findByPk(weeklyOffPresetId);
    if (!preset) throw new AppError('Weekly-off preset not found', 404);

    const [assignment] = await EmployeeWeeklyOffAssignment.findOrCreate({
      where: { employee_id: employeeId },
      defaults: { employee_id: employeeId, weekly_off_preset_id: weeklyOffPresetId },
    });
    if (assignment.weekly_off_preset_id !== weeklyOffPresetId) {
      await assignment.update({ weekly_off_preset_id: weeklyOffPresetId });
    }
    return assignment;
  }

  // ─── EmployeeLeaveBalance (annual, day-based) ══════════════════════════

  async getBalances(employeeId: number, year = new Date().getFullYear()) {
    const balances = await EmployeeLeaveBalance.findAll({
      where: { employee_id: employeeId, year },
    });

    if (!balances.length) return [];

    const leaveTypeIds = balances.map((balance) => balance.leave_type_id);
    const leaveTypes = await LeaveType.findAll({
      where: { id: leaveTypeIds, is_active: true },
      order: [['name', 'ASC']],
    });
    const leaveTypeMap = new Map(leaveTypes.map((type) => [type.id, type]));

    return balances
      .filter((balance) => leaveTypeMap.has(balance.leave_type_id))
      .map((balance) => {
        const leaveType = leaveTypeMap.get(balance.leave_type_id)!;
        const allocated = Number(balance.allocated);
        const used = Number(balance.used);
        const pending = Number(balance.pending);
        const carriedForward = Number(balance.carried_forward);
        const available = allocated + carriedForward - used - pending;

        return {
          leave_type_id: balance.leave_type_id,
          name: leaveType.name,
          code: leaveType.code,
          year: balance.year,
          allocated,
          used,
          pending,
          carried_forward: carriedForward,
          available: Math.max(0, available),
        };
      });
  }

  // ─── Company-wide balances overview (NEW) ════════════════════════════════
  // Needed for an admin "all employees" balances table (EL/CL/SPECIAL columns
  // + this month's Short Leave usage) — getBalances() above is per-employee
  // only, there was no bulk read. Kept lean: two queries plus one for the
  // minutes table, no N+1 per employee.
  async getCompanyBalancesOverview(companyId: number, year = new Date().getFullYear()) {
    const now = new Date();
    const month = now.getMonth() + 1;

    const employees = await Employee.findAll({
      where: { company_id: companyId },
      attributes: ['id', 'first_name', 'last_name', 'employee_code'],
      order: [['first_name', 'ASC']],
    });
    if (!employees.length) return [];
    const employeeIds = employees.map((e) => e.id);

    const leaveTypes = await LeaveType.findAll({ where: { company_id: companyId } });
    const typeByCode = new Map(leaveTypes.map((t) => [t.code, t]));

    const balances = await EmployeeLeaveBalance.findAll({
      where: { employee_id: employeeIds, year },
    });
    // employee_id -> leave_type_id -> available days
    const balanceMap = new Map<number, Map<number, number>>();
    for (const b of balances) {
      const available = Number(b.allocated) + Number(b.carried_forward) - Number(b.used) - Number(b.pending);
      if (!balanceMap.has(b.employee_id)) balanceMap.set(b.employee_id, new Map());
      balanceMap.get(b.employee_id)!.set(b.leave_type_id, Math.max(0, available));
    }

    const shortType = typeByCode.get('SHORT');
    const shortByEmployee = new Map<number, { allocated: number; used: number }>();
    if (shortType) {
      const shortBalances = await EmployeeLeaveMinutesBalance.findAll({
        where: { employee_id: employeeIds, leave_type_id: shortType.id, year, month },
      });
      for (const s of shortBalances) {
        shortByEmployee.set(s.employee_id, {
          allocated: Number(s.allocated_minutes),
          used: Number(s.used_minutes),
        });
      }
    }

    const elId = typeByCode.get('EL')?.id;
    const clId = typeByCode.get('CL')?.id;
    const specialId = typeByCode.get('SPECIAL')?.id;

    return employees.map((e) => {
      const empBalances = balanceMap.get(e.id);
      const short = shortByEmployee.get(e.id);
      const shortAllocated = short?.allocated ?? Number(shortType?.monthly_quota_minutes ?? 60);
      const shortUsed = short?.used ?? 0;

      return {
        employee_id: e.id,
        name: [e.first_name, e.last_name].filter(Boolean).join(' '),
        employee_code: e.employee_code,
        EL: elId ? (empBalances?.get(elId) ?? 0) : 0,
        CL: clId ? (empBalances?.get(clId) ?? 0) : 0,
        SPECIAL: specialId ? (empBalances?.get(specialId) ?? 0) : 0,
        short_used_minutes: shortUsed,
        short_allocated_minutes: shortAllocated,
      };
    });
  }

  // ─── EmployeeLeaveMinutesBalance (Short Leave, monthly) ════════════════

  async getShortLeaveBalance(employeeId: number, year: number, month: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const shortType = await LeaveType.findOne({ where: { company_id: companyId, code: 'SHORT' } });
    if (!shortType) throw new AppError('Short Leave type not configured for this company', 404);

    const [balance] = await EmployeeLeaveMinutesBalance.findOrCreate({
      where: { employee_id: employeeId, leave_type_id: shortType.id, year, month },
      defaults: {
        employee_id: employeeId,
        leave_type_id: shortType.id,
        year,
        month,
        allocated_minutes: Number(shortType.monthly_quota_minutes) || 60,
        used_minutes: 0,
        pending_minutes: 0,
      },
    });

    const allocated = Number(balance.allocated_minutes);
    const used = Number(balance.used_minutes);
    const pending = Number(balance.pending_minutes);
    return {
      leave_type_id: shortType.id,
      year,
      month,
      allocated_minutes: allocated,
      used_minutes: used,
      pending_minutes: pending,
      // CORRECTED — previously ignored pending_minutes entirely (the column
      // didn't exist yet), so a Pending Short Leave request didn't actually
      // reserve anything and a second request could overdraw the quota.
      available_minutes: Math.max(0, allocated - used - pending),
    };
  }

  // ─── EmployeeLeaveAccrual ═══════════════════════════════════════════════

  async getLeaveAccruals(employeeId: number, year: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    return EmployeeLeaveAccrual.findAll({
      where: { employee_id: employeeId, year },
      include: [{ model: LeaveType, attributes: ['name', 'code'] }],
      order: [['month', 'ASC']],
    });
  }

  // ─── LeaveCredit (Special Leave earn ledger) ═══════════════════════════

  async creditSpecialLeave(dto: CreditSpecialLeaveDto, creditedBy: number, companyId: number) {
    if (!dto.employee_id || !dto.leave_type_id || !dto.credit_date || !dto.days || dto.days <= 0) {
      throw new AppError('employee_id, leave_type_id, credit_date and a positive days value are required', 400);
    }

    const employee = await Employee.findOne({ where: { id: dto.employee_id, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const leaveType = await LeaveType.findOne({
      where: { id: dto.leave_type_id, company_id: companyId, is_active: true },
    });
    if (!leaveType) throw new AppError('Leave type not found or inactive', 404);
    if (!leaveType.is_earned) {
      throw new AppError(`"${leaveType.name}" is not configured as an earned/credited leave type`, 400);
    }

    const year = new Date(dto.credit_date).getFullYear();

    return sequelize.transaction(async (transaction) => {
      const credit = await LeaveCredit.create(
        {
          employee_id: dto.employee_id,
          leave_type_id: dto.leave_type_id,
          credit_date: dto.credit_date,
          days: dto.days,
          holiday_name: dto.holiday_name ?? null,
          note: dto.note ?? null,
          credited_by: creditedBy,
        },
        { transaction },
      );

      // Credited days increase the pool this leave type can be used against —
      // same EmployeeLeaveBalance table CL/EL use, just adding to `allocated`.
      const [balance] = await EmployeeLeaveBalance.findOrCreate({
        where: { employee_id: dto.employee_id, leave_type_id: dto.leave_type_id, year },
        defaults: {
          employee_id: dto.employee_id,
          leave_type_id: dto.leave_type_id,
          year,
          allocated: 0,
          used: 0,
          pending: 0,
          carried_forward: 0,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      balance.allocated = Number(balance.allocated) + Number(dto.days);
      await balance.save({ transaction });

      return credit;
    });
  }

  async getLeaveCredits(employeeId: number, companyId: number) {
    const employee = await Employee.findOne({ where: { id: employeeId, company_id: companyId } });
    if (!employee) throw new AppError('Employee not found', 404);

    return LeaveCredit.findAll({
      where: { employee_id: employeeId },
      order: [['credit_date', 'DESC']],
    });
  }


  async getMyManagedEmployees(managerEmployeeId: number, companyId: number) {
    // First find employees whose L1 or L2 manager is the logged-in employee
    const managerMappings = await EmployeeManagersWorkContact.findAll({
      where: {
        [Op.or]: [
          { l1_manager_id: managerEmployeeId },
          { l2_manager_id: managerEmployeeId },
        ],
      },
      attributes: [
        'employee_id',
        'l1_manager_id',
        'l2_manager_id',
      ],
      raw: true,
    });

    if (!managerMappings.length) {
      return [];
    }

    const employeeIds = managerMappings.map(
      (row: any) => Number(row.employee_id),
    );

    // Fetch the actual employee records, scoped to the logged-in user's company
    const employees = await Employee.findAll({
      where: {
        id: {
          [Op.in]: employeeIds,
        },
        company_id: companyId,
      },
      attributes: [
        'id',
        'employee_code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'status',
        'employment_type',
        'company_id',
        'department_id',
        'sub_department_id',
        'designation_id',
        'avatar_url',
      ],
      order: [
        ['first_name', 'ASC'],
        ['last_name', 'ASC'],
      ],
    });

    const mappingMap = new Map(
      managerMappings.map((row: any) => [
        Number(row.employee_id),
        row,
      ]),
    );

    return employees.map((employee) => {
      const data = employee.toJSON() as any;
      const mapping = mappingMap.get(Number(data.id));

      const isL1 =
        Number(mapping?.l1_manager_id) === Number(managerEmployeeId);

      const isL2 =
        Number(mapping?.l2_manager_id) === Number(managerEmployeeId);

      return {
        ...data,

        // Tells frontend why this employee belongs to this manager
        manager_type:
          isL1 && isL2
            ? ['L1', 'L2']
            : isL1
              ? ['L1']
              : ['L2'],
      };
    });
  }


  async getMyManagers(
    employeeId: number,
    companyId: number,
  ): Promise<MyManagersResponse> {
    const employee = await Employee.findOne({
      where: {
        id: employeeId,
        company_id: companyId,
      },
      attributes: ['id'],
      raw: true,
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const managerMapping = await EmployeeManagersWorkContact.findOne({
      where: {
        employee_id: employeeId,
      },
      attributes: [
        'employee_id',
        'l1_manager_id',
        'l2_manager_id',
      ],
      raw: true,
    });

    if (!managerMapping) {
      return {
        l1_manager: null,
        l2_manager: null,
      };
    }

    const managerIds = [
      managerMapping.l1_manager_id,
      managerMapping.l2_manager_id,
    ]
      .filter(
        (id): id is number =>
          id !== null && id !== undefined,
      )
      .map(Number);

    if (!managerIds.length) {
      return {
        l1_manager: null,
        l2_manager: null,
      };
    }

    const managers = await Employee.findAll({
      where: {
        id: {
          [Op.in]: managerIds,
        },
        company_id: companyId,
      },
      attributes: [
        'id',
        'employee_code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'status',
        'employment_type',
        'company_id',
        'department_id',
        'sub_department_id',
        'designation_id',
        'avatar_url',
      ],
    });

    const managerMap = new Map<number, ManagerEmployee>(
      managers.map((manager) => {
        const data = manager.toJSON() as ManagerEmployee;

        return [Number(data.id), data];
      }),
    );

    return {
      l1_manager: managerMapping.l1_manager_id
        ? managerMap.get(
          Number(managerMapping.l1_manager_id),
        ) ?? null
        : null,

      l2_manager: managerMapping.l2_manager_id
        ? managerMap.get(
          Number(managerMapping.l2_manager_id),
        ) ?? null
        : null,
    };
  }

  // ─── Monthly leave processing (delegates to existing job) ═══════════════

  async processMonthlyLeave(employeeId: number, year: number, month: number) {
    return runMonthlyLeaveJob(employeeId, year, month);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async getUsedDays(employeeId: number, leaveTypeId: number, year: number) {
    const rows = await LeaveRequest.findAll({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        status: { [Op.in]: ['Pending', 'Approved'] },
        from_date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] },
      },
      attributes: ['days'],
    });
    return rows.reduce((sum, r) => sum + Number(r.days), 0);
  }

  private async findByIdScoped(id: number, companyId: number) {
    const leave = await LeaveRequest.findOne({
      where: { id },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'code'] },
        {
          model: Employee,
          as: 'employee',
          where: { company_id: companyId },
          attributes: ['id'],
        },
      ],
    });
    if (!leave) throw new AppError('Leave request not found', 404);
    return leave;
  }

  private isBalanceTracked(leave: LeaveRequest): boolean {
    const code = (leave as any).leaveType?.code;
    return Boolean(code) && BALANCE_TRACKED_LEAVE_CODES.includes(code);
  }

  // ADDED — SHORT leave's pending/used hold lives in a different table
  // (EmployeeLeaveMinutesBalance, keyed by month) than the day-based types,
  // so it needs its own detection + row lookup + move/release logic. Without
  // this, approve()/reject()/cancel() only ever touched EmployeeLeaveBalance
  // and a Short Leave request's pending_minutes/used_minutes never moved —
  // the hold from apply() would just sit there forever, permanently locking
  // up quota even after the request was approved or rejected.
  private isMinutesTracked(leave: LeaveRequest): boolean {
    const code = (leave as any).leaveType?.code;
    return code === 'SHORT';
  }

  private async getMinutesBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
    const from = new Date(leave.from_date);
    return EmployeeLeaveMinutesBalance.findOne({
      where: {
        employee_id: leave.employee_id,
        leave_type_id: leave.leave_type_id,
        year: from.getFullYear(),
        month: from.getMonth() + 1,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private async getBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
    const year = new Date(leave.from_date).getFullYear();
    return EmployeeLeaveBalance.findOne({
      where: { employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private async moveBalancePendingToUsed(leave: LeaveRequest, transaction: Transaction) {
    if (this.isMinutesTracked(leave)) {
      const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
      if (!balance) return;
      balance.pending_minutes = Math.max(0, Number(balance.pending_minutes) - Number(leave.minutes));
      balance.used_minutes = Number(balance.used_minutes) + Number(leave.minutes);
      await balance.save({ transaction });
      return;
    }
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return;

    balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
    balance.used = Number(balance.used) + Number(leave.days);
    await balance.save({ transaction });
  }

  private async releaseBalancePending(leave: LeaveRequest, transaction: Transaction) {
    if (this.isMinutesTracked(leave)) {
      const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
      if (!balance) return;
      balance.pending_minutes = Math.max(0, Number(balance.pending_minutes) - Number(leave.minutes));
      await balance.save({ transaction });
      return;
    }
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return;

    balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
    await balance.save({ transaction });
  }

  private async releaseBalanceUsed(leave: LeaveRequest, transaction: Transaction) {
    if (this.isMinutesTracked(leave)) {
      const balance = await this.getMinutesBalanceRowForLeave(leave, transaction);
      if (!balance) return;
      balance.used_minutes = Math.max(0, Number(balance.used_minutes) - Number(leave.minutes));
      await balance.save({ transaction });
      return;
    }
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return;

    balance.used = Math.max(0, Number(balance.used) - Number(leave.days));
    await balance.save({ transaction });
  }
}

// ─── Standalone exports (unrelated to LeaveService's leave-model CRUD,
// kept exactly as in your original file so nothing else importing them
// breaks) ─────────────────────────────────────────────────────────────────

export async function getEmployeeLeaveInformation(
  employeeId: number,
  processingDate: Date = new Date(),
): Promise<EmployeeLeaveInformation> {
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const probation = await EmployeeCommitmentProbation.findOne({
    where: { employee_id: employeeId },
    order: [['id', 'DESC']],
  });

  const employeeData = employee.toJSON() as any;
  const fullName = [employeeData.first_name, employeeData.middle_name, employeeData.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  const joiningDate = employeeData.current_doj || employeeData.actual_doj || null;

  const probationData = probation ? (probation.toJSON() as any) : null;
  const onProbation = Boolean(probationData?.on_probation);
  const probationEndDate = probationData?.probation_end_date || null;

  let probationCompleted = false;
  if (probationData) {
    if (
      probationData.confirmation_status === 'Confirmed' ||
      probationData.confirmation_status === 'confirmed'
    ) {
      probationCompleted = true;
    }
    if (probationEndDate) {
      const endDate = new Date(probationEndDate);
      if (!Number.isNaN(endDate.getTime()) && processingDate >= endDate) {
        probationCompleted = true;
      }
    }
    if (
      probationData.probation_final_status === 'Completed' ||
      probationData.probation_final_status === 'completed' ||
      probationData.probation_final_status === 'Confirmed' ||
      probationData.probation_final_status === 'confirmed'
    ) {
      probationCompleted = true;
    }
  }

  let leaveStatus: EmployeeLeaveStatus;
  if (employeeData.employment_type === 'Contractual') {
    leaveStatus = 'CONTRACTUAL';
  } else if (employeeData.employment_type === 'Permanent' && onProbation && !probationCompleted) {
    leaveStatus = 'PROBATION';
  } else if (employeeData.employment_type === 'Permanent' && probationCompleted) {
    leaveStatus = 'REGULAR_AFTER_PROBATION';
  } else {
    leaveStatus = 'REGULAR_CONTINUING';
  }

  return {
    employee: {
      id: employeeData.id,
      employee_code: employeeData.employee_code ?? null,
      first_name: employeeData.first_name ?? null,
      middle_name: employeeData.middle_name ?? null,
      last_name: employeeData.last_name ?? null,
      full_name: fullName,
      company_id: employeeData.company_id ?? null,
      status: employeeData.status ?? null,
      employment_type: employeeData.employment_type ?? null,
      email: employeeData.email ?? null,
      phone: employeeData.phone ?? null,
      department_id: employeeData.department_id ?? null,
      sub_department_id: employeeData.sub_department_id ?? null,
      designation_id: employeeData.designation_id ?? null,
      l1_manager_id: employeeData.l1_manager_id ?? null,
      l2_manager_id: employeeData.l2_manager_id ?? null,
      reporting_manager_id: employeeData.reporting_manager_id ?? null,
      actual_doj: employeeData.actual_doj ?? null,
      current_doj: employeeData.current_doj ?? null,
      working_site: employeeData.working_site ?? null,
      working_city: employeeData.working_city ?? null,
      working_state_country: employeeData.working_state_country ?? null,
      pay_register_location: employeeData.pay_register_location ?? null,
      shift_id: employeeData.shift_id ?? null,
      saturday_off: employeeData.saturday_off ?? null,
      grace_minutes: employeeData.grace_minutes ?? null,
    },
    probation: {
      exists: Boolean(probationData),
      on_probation: onProbation,
      probation_period: probationData?.probation_period ?? null,
      probation_end_date: probationData?.probation_end_date ?? null,
      probation_status: probationData?.probation_status ?? null,
      probation_extended_period: probationData?.probation_extended_period ?? null,
      probation_final_status: probationData?.probation_final_status ?? null,
      confirmation_status: probationData?.confirmation_status ?? null,
      confirmed_on: probationData?.confirmed_on ?? null,
      probation_el_credit: Number(probationData?.probation_el_credit ?? 0),
      probation_el_transferred: Number(probationData?.probation_el_transferred ?? 0),
    },
    leave_status: leaveStatus,
    joining_date: joiningDate,
    probation_completed: probationCompleted,
  };
}

export async function getMonthlyAttendanceSummary(
  employeeId: number,
  year: number,
  month: number,
): Promise<MonthlyAttendanceSummary> {
  const record = await EmployeeMonthlyAttendance.findOne({
    where: { employee_id: employeeId, year, month },
  });

  if (!record) {
    throw new AppError(
      `No monthly attendance found for employee ${employeeId} for ${year}-${String(month).padStart(2, '0')}. ` +
      `Has the monthly attendance job run for this period yet?`,
      404,
    );
  }

  const data = record.toJSON() as any;

  // NOTE: wfhDays, holidayWorkedDays, weeklyOffWorkedDays are not currently
  // tracked as their own columns in employee_monthly_attendance — defaulting
  // to 0 rather than fabricating a number (see original comment in your file
  // for why: attendance-combined.service.ts short-circuits to HOLIDAY/WEEK_OFF
  // before evaluateAttendanceStatus() ever runs).
  return {
    employeeId: data.employee_id,
    year: data.year,
    month: data.month,
    totalCalendarDays: data.total_days,
    workingDays: data.working_days,
    presentDays: data.present_days,
    absentDays: data.absent_days,
    halfDays: Number(data.half_days),
    wfhDays: 0,
    leaveDays: data.leave_days,
    holidayWorkedDays: 0,
    weeklyOffWorkedDays: 0,
    totalWorkingHours: Number(data.total_working_hours),
  };
}
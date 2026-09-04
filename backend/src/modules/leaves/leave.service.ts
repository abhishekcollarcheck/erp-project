// import { Op, WhereOptions } from 'sequelize';
// import { LeaveRequest, LeaveType, LeaveApplicationType, EmployeeLeaveBalance } from '../../database/models/LeaveModels';
// import { Employee, EmployeeCommitmentProbation } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
// import { logActivity } from '../../utils/activityLogger';


// const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
// const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

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

//     // Balance check — only for leave types with an annual day pool (days_per_year > 0).
//     // Short Leave (days_per_year = 0 in the seed) is exempt; it isn't tracked against
//     // this simple annual-pool model, see the comment on getBalances() below.
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

//     return LeaveRequest.create({
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
//       status: 'Pending',
//       submission_type: dto.submission_type ?? 'self',
//       applied_by: dto.applied_by,
//       hod_name: dto.hod_name ?? null,
//       coordinator_name: dto.coordinator_name ?? null,
//       undertaking_accepted: dto.undertaking_accepted,
//     });
//   }

//   // ─── Approve ───────────────────────────────────────────────────────────────
//   async approve(id: number, approvedBy: number, companyId: number) {
//     const leave = await this.findByIdScoped(id, companyId);
//     if (leave.status !== 'Pending')
//       throw new AppError('Only Pending requests can be approved', 400);

//     await leave.update({ status: 'Approved', approved_by: approvedBy, approved_at: new Date() });

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

//     await leave.update({ status: 'Rejected', approved_by: rejectedBy, rejection_reason: reason ?? null });

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

//     await leave.update({ status: 'Cancelled' });
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
//       include: [{
//         model: Employee,
//         as: 'employee',
//         where: { company_id: companyId },
//         attributes: ['id'],
//       }],
//     });
//     if (!leave) throw new AppError('Leave request not found', 404);
//     return leave;
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

// export async function getMonthlyAttendanceSummary(
//   employeeId: number,
//   year: number,
//   month: number
// ): Promise<MonthlyAttendanceSummary> {
//   console.log('========== STATIC ATTENDANCE SUMMARY ==========');
//   console.log('Employee ID:', employeeId);
//   console.log('Year:', year);
//   console.log('Month:', month);
//   /*
//    * For now every employee gets this static attendance.
//    *
//    * Example:
//    *
//    * Working Days      = 22
//    * Present Days      = 21
//    * WFH               = 1
//    * Half Days         = 0
//    * Absent Days       = 0
//    * Leave Days        = 0
//    * Holiday Worked    = 1
//    * Weekly Off Worked = 1
//    * Working Hours     = 176
//    */
//   const summary: MonthlyAttendanceSummary = {
//     employeeId,
//     year,
//     month,
//     totalCalendarDays: 31,
//     workingDays: 22,
//     presentDays: 21,
//     absentDays: 0,
//     halfDays: 0,
//     wfhDays: 1,
//     leaveDays: 0,
//     holidayWorkedDays: 1,
//     weeklyOffWorkedDays: 1,
//     totalWorkingHours: 176,
//   };
//   console.log('Attendance Summary:', summary);
//   return summary;
// }



import { Op, Transaction, WhereOptions } from 'sequelize';
import { LeaveRequest, LeaveType, LeaveApplicationType, EmployeeLeaveBalance } from '../../database/models/LeaveModels';
import { Employee, EmployeeCommitmentProbation } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/response';
import { logActivity } from '../../utils/activityLogger';
import { sequelize } from '../../config/database';
import { EmployeeMonthlyAttendance } from '../../database/models/EmployeeMonthlyAttendance';


const SHORT_LEAVE_APPLICATION_TYPES: LeaveApplicationType[] = ['arrival_late', 'leaving_early'];
const HALF_DAY_APPLICATION_TYPES: LeaveApplicationType[] = ['first_half', 'second_half'];

// Leave types whose balance is tracked via EmployeeLeaveBalance
// (allocated / used / pending / carried_forward). Short Leave is
// intentionally excluded — it stays on its existing days_per_year check,
// per instruction to leave that part alone for now.
const BALANCE_TRACKED_LEAVE_CODES = ['CL', 'EL'];

// import { Employee } from '../../models/Employee';

export type EmployeeLeaveStatus =
  | 'PROBATION'
  | 'REGULAR_AFTER_PROBATION'
  | 'REGULAR_CONTINUING'
  | 'CONTRACTUAL';

// EmployeeCommitmentProbation

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
  half_day?: boolean;
  reason?: string;
  submission_type?: 'self' | 'admin';
  applied_by: number;
  hod_name?: string;
  coordinator_name?: string;
  undertaking_accepted: boolean;
}

export interface LeaveQueryParams {
  page?: number | string;
  limit?: number | string;
  employee_id?: number | string;
  status?: string;
  leave_type_id?: number | string;
}

export class LeaveService {
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
  // Company-wide, not scoped to the caller's direct reports: this route is
  // already gated behind the `leaves:approve` permission (a broad module-level
  // grant in this app, not a per-manager relationship), so anyone who can call
  // it is meant to see and act on every pending request in their company.
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

  // ─── Apply for leave ───────────────────────────────────────────────────────
  async apply(dto: ApplyLeaveDto, companyId: number) {
    // Validate leave type belongs to company
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
    // on the exact same single date is NOT a conflict — they occupy different
    // halves of the day (e.g. CL morning + EL afternoon). Every other combination
    // (full day, multi-day range, same half twice, etc.) is treated as a clash.
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
      if (sameSingleDay && differentHalves) return false; // compatible — different halves of the same day
      return true;
    });

    if (overlap) {
      throw new AppError(
        `Leave already exists for overlapping dates (${overlap.from_date} – ${overlap.to_date})`,
        409,
      );
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
      half_day: dto.days % 1 !== 0,
      reason: dto.reason ?? null,
      status: 'Pending' as const,
      submission_type: dto.submission_type ?? 'self',
      applied_by: dto.applied_by,
      hod_name: dto.hod_name ?? null,
      coordinator_name: dto.coordinator_name ?? null,
      undertaking_accepted: dto.undertaking_accepted,
    };

    // CL / EL: balance-tracked via EmployeeLeaveBalance. Check available
    // (allocated + carried_forward - used - pending) and, if there's enough,
    // add the requested days to `pending` and create the request atomically —
    // so a pending request always has a matching hold on the balance.
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

        return LeaveRequest.create(leaveRequestPayload, { transaction });
      });
    }

    // Everything else (Short Leave for now) — unchanged simple days_per_year check.
    if (Number(leaveType.days_per_year) > 0) {
      const year = new Date(dto.from_date).getFullYear();
      const used = await this.getUsedDays(dto.employee_id, leaveType.id, year);
      const remaining = Number(leaveType.days_per_year) - used;
      if (dto.days > remaining) {
        throw new AppError(
          `Insufficient ${leaveType.name} balance: ${remaining} day(s) remaining, requested ${dto.days}`,
          400,
        );
      }
    }

    return LeaveRequest.create(leaveRequestPayload);
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
      // Move the hold from pending -> used now that it's actually approved.
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
      // Not approved — release the pending hold, nothing was ever used.
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
      // Give the days back to the employee: a cancelled Pending request
      // releases its hold on `pending`; a cancelled Approved request gives
      // the days back from `used` (it was already deducted at approval).
      if (wasApproved) {
        await this.releaseBalanceUsed(leave, transaction);
      } else {
        await this.releaseBalancePending(leave, transaction);
      }
    });

    return leave;
  }

  // ─── Leave types ───────────────────────────────────────────────────────────
  async getLeaveTypes(companyId: number) {
    return LeaveType.findAll({
      where: { company_id: companyId, is_active: true },
      order: [['name', 'ASC']],
    });
  }

  // ─── Leave balances for an employee, current calendar year ────────────────
  // Simple annual-pool model: allocated = LeaveType.days_per_year, used = sum of
  // Pending + Approved request days this year, remaining = allocated - used.
  // Only covers types with days_per_year > 0 — Short Leave (seeded at 0) isn't
  // a days-per-year pool in this app (see leave-accrual.service.ts), so it's
  // omitted rather than shown with a misleading 0/0 balance.
  // async getBalances(employeeId: number, companyId: number, year = new Date().getFullYear()) {
  //   const types = await LeaveType.findAll({
  //     where: { company_id: companyId, is_active: true },
  //     order: [['name', 'ASC']],
  //   });

  //   const balances = [];
  //   for (const type of types) {
  //     if (Number(type.days_per_year) <= 0) continue;
  //     const used = await this.getUsedDays(employeeId, type.id, year);
  //     const allocated = Number(type.days_per_year);
  //     balances.push({
  //       leave_type_id: type.id,
  //       name: type.name,
  //       code: type.code,
  //       allocated,
  //       used,
  //       remaining: Math.max(0, allocated - used),
  //     });
  //   }
  //   return balances;
  // }

  // async getBalances(
  //   employeeId: number,
  //   year = new Date().getFullYear()
  // ) {

  //   console.log("hitted");
  //   console.log(employeeId);
  //   const balances = await EmployeeLeaveBalance.findAll({
  //     where: {
  //       employee_id: employeeId,
  //       year,
  //     },
  //     order: [['leave_type_id', 'ASC']],
  //   });

  //   console.log(balances);

  //   if (!balances.length) {
  //     return [];
  //   }

  //   const leaveTypeIds = balances.map(
  //     (balance) => balance.leave_type_id
  //   );

  //   const leaveTypes = await LeaveType.findAll({
  //     where: {
  //       id: leaveTypeIds,
  //       is_active: true,
  //     },
  //     order: [['name', 'ASC']],
  //   });

  //   const leaveTypeMap = new Map(
  //     leaveTypes.map((type) => [type.id, type])
  //   );

  //   return balances
  //     .filter((balance) => leaveTypeMap.has(balance.leave_type_id))
  //     .map((balance) => {
  //       const leaveType = leaveTypeMap.get(balance.leave_type_id)!;

  //       const allocated = Number(balance.allocated);
  //       const used = Number(balance.used);
  //       const pending = Number(balance.pending);
  //       const carriedForward = Number(balance.carried_forward);

  //       const available =
  //         allocated +
  //         carriedForward -
  //         used -
  //         pending;

  //       return {
  //         leave_type_id: balance.leave_type_id,

  //         name: leaveType.name,
  //         code: leaveType.code,

  //         year: balance.year,

  //         allocated,
  //         used,
  //         pending,
  //         carried_forward: carriedForward,

  //         available: Math.max(0, available),
  //       };
  //     });
  // }
  async getBalances(
    employeeId: number,
    year = new Date().getFullYear()
  ) {
    console.log('========== GET BALANCES ==========');
    console.log('employeeId:', employeeId);
    console.log('year:', year);

    const balances = await EmployeeLeaveBalance.findAll({
      where: {
        employee_id: employeeId,
        year: year,
      },
      logging: console.log,
    });

    console.log('BALANCES COUNT:', balances.length);
    console.log(
      'BALANCES:',
      balances.map((b) => b.toJSON())
    );

    if (!balances.length) {
      return [];
    }

    const leaveTypeIds = balances.map(
      (balance) => balance.leave_type_id
    );

    console.log('LEAVE TYPE IDS:', leaveTypeIds);

    const leaveTypes = await LeaveType.findAll({
      where: {
        id: leaveTypeIds,
        is_active: true,
      },
      order: [['name', 'ASC']],
      logging: console.log,
    });

    console.log(
      'LEAVE TYPES:',
      leaveTypes.map((type) => type.toJSON())
    );

    const leaveTypeMap = new Map(
      leaveTypes.map((type) => [type.id, type])
    );

    const result = balances
      .filter((balance) =>
        leaveTypeMap.has(balance.leave_type_id)
      )
      .map((balance) => {
        const leaveType =
          leaveTypeMap.get(balance.leave_type_id)!;

        const allocated = Number(balance.allocated);
        const used = Number(balance.used);
        const pending = Number(balance.pending);
        const carriedForward = Number(
          balance.carried_forward
        );

        const available =
          allocated +
          carriedForward -
          used -
          pending;

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

    console.log('FINAL RESULT:', result);

    return result;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────
  // Days already committed (Pending or Approved) against a leave type this year.
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

  // Only CL/EL carry a balance row worth touching — see BALANCE_TRACKED_LEAVE_CODES.
  private isBalanceTracked(leave: LeaveRequest): boolean {
    const code = (leave as any).leaveType?.code;
    return Boolean(code) && BALANCE_TRACKED_LEAVE_CODES.includes(code);
  }

  private async getBalanceRowForLeave(leave: LeaveRequest, transaction: Transaction) {
    const year = new Date(leave.from_date).getFullYear();
    return EmployeeLeaveBalance.findOne({
      where: { employee_id: leave.employee_id, leave_type_id: leave.leave_type_id, year },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  // Approval: the hold becomes a real deduction — pending down, used up.
  private async moveBalancePendingToUsed(leave: LeaveRequest, transaction: Transaction) {
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return; // no balance row — nothing to move (shouldn't happen, apply() creates one)

    balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
    balance.used = Number(balance.used) + Number(leave.days);
    await balance.save({ transaction });
  }

  // Reject / cancel-while-pending: release the hold, nothing was ever used.
  private async releaseBalancePending(leave: LeaveRequest, transaction: Transaction) {
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return;

    balance.pending = Math.max(0, Number(balance.pending) - Number(leave.days));
    await balance.save({ transaction });
  }

  // Cancel-while-approved: give the previously-deducted days back.
  private async releaseBalanceUsed(leave: LeaveRequest, transaction: Transaction) {
    if (!this.isBalanceTracked(leave)) return;
    const balance = await this.getBalanceRowForLeave(leave, transaction);
    if (!balance) return;

    balance.used = Math.max(0, Number(balance.used) - Number(leave.days));
    await balance.save({ transaction });
  }
}



export async function getEmployeeLeaveInformation(
  employeeId: number,
  processingDate: Date = new Date()
): Promise<EmployeeLeaveInformation> {
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }
  // const probation = await EmployeeCommitmentProbation.findOne({
  //   where: {
  //     employee_id: employeeId,
  //   },
  //   order: [['id', 'DESC']],
  // });

  let probation: EmployeeCommitmentProbation | null = null;
  try {
    probation = await EmployeeCommitmentProbation.findOne({
      where: {
        employee_id: employeeId,
      },
      logging: console.log,
    });

    console.log(
      'PROBATION RESULT:',
      probation?.toJSON()
    );
  } catch (error: any) {
    console.error('========== PROBATION ERROR ==========');
    console.error('message:', error.message);
    console.error('name:', error.name);
    console.error('original:', error.original);
    console.error('sql:', error.sql);

    throw error;
  }
  /*
   * ---------------------------------------------------------
   * EMPLOYEE INFORMATION
   * ---------------------------------------------------------
   */
  const employeeData = employee.toJSON() as any;
  const fullName = [
    employeeData.first_name,
    employeeData.middle_name,
    employeeData.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  /*
   * ---------------------------------------------------------
   * JOINING DATE
   * ---------------------------------------------------------
   *
   * Prefer current_doj when available.
   * Otherwise fallback to actual_doj.
   */
  const joiningDate =
    employeeData.current_doj ||
    employeeData.actual_doj ||
    null;
  /*
   * ---------------------------------------------------------
   * PROBATION INFORMATION
   * ---------------------------------------------------------
   */
  const probationData = probation
    ? (probation.toJSON() as any)
    : null;
  const onProbation = Boolean(
    probationData?.on_probation
  );
  const probationEndDate =
    probationData?.probation_end_date || null;
  /*
   * ---------------------------------------------------------
   * DETERMINE WHETHER PROBATION HAS COMPLETED
   * ---------------------------------------------------------
   */
  let probationCompleted = false;
  if (probationData) {
    /*
     * Explicit confirmation is the strongest indication.
     */
    if (
      probationData.confirmation_status === 'Confirmed' ||
      probationData.confirmation_status === 'confirmed'
    ) {
      probationCompleted = true;
    }
    /*
     * If there is a probation end date and the processing
     * date is after that date, probation is considered complete.
     */
    if (probationEndDate) {
      const endDate = new Date(probationEndDate);
      if (
        !Number.isNaN(endDate.getTime()) &&
        processingDate >= endDate
      ) {
        probationCompleted = true;
      }
    }
    /*
     * Explicit final status can also indicate completion.
     */
    if (
      probationData.probation_final_status === 'Completed' ||
      probationData.probation_final_status === 'completed' ||
      probationData.probation_final_status === 'Confirmed' ||
      probationData.probation_final_status === 'confirmed'
    ) {
      probationCompleted = true;
    }
  }
  /*
   * ---------------------------------------------------------
   * EMPLOYEE LEAVE STATUS
   * ---------------------------------------------------------
   */
  let leaveStatus: EmployeeLeaveStatus;
  if (employeeData.employment_type === 'Contractual') {
    leaveStatus = 'CONTRACTUAL';
  } else if (
    employeeData.employment_type === 'Permanent' &&
    onProbation &&
    !probationCompleted
  ) {
    leaveStatus = 'PROBATION';
  } else if (
    employeeData.employment_type === 'Permanent' &&
    probationCompleted
  ) {
    /*
     * Later we will distinguish:
     *
     * REGULAR_AFTER_PROBATION
     * REGULAR_CONTINUING
     *
     * based on the month being processed.
     */
    leaveStatus = 'REGULAR_AFTER_PROBATION';
  } else {
    leaveStatus = 'REGULAR_CONTINUING';
  }
  /*
   * ---------------------------------------------------------
   * RETURN NORMALIZED EMPLOYEE DATA
   * ---------------------------------------------------------
   */
  return {
    employee: {
      id: employeeData.id,
      employee_code:
        employeeData.employee_code ?? null,
      first_name:
        employeeData.first_name ?? null,
      middle_name:
        employeeData.middle_name ?? null,
      last_name:
        employeeData.last_name ?? null,
      full_name: fullName,
      company_id:
        employeeData.company_id ?? null,
      status:
        employeeData.status ?? null,
      employment_type:
        employeeData.employment_type ?? null,
      email:
        employeeData.email ?? null,
      phone:
        employeeData.phone ?? null,
      department_id:
        employeeData.department_id ?? null,
      sub_department_id:
        employeeData.sub_department_id ?? null,
      designation_id:
        employeeData.designation_id ?? null,
      l1_manager_id:
        employeeData.l1_manager_id ?? null,
      l2_manager_id:
        employeeData.l2_manager_id ?? null,
      reporting_manager_id:
        employeeData.reporting_manager_id ?? null,
      actual_doj:
        employeeData.actual_doj ?? null,
      current_doj:
        employeeData.current_doj ?? null,
      working_site:
        employeeData.working_site ?? null,
      working_city:
        employeeData.working_city ?? null,
      working_state_country:
        employeeData.working_state_country ?? null,
      pay_register_location:
        employeeData.pay_register_location ?? null,
      shift_id:
        employeeData.shift_id ?? null,
      saturday_off:
        employeeData.saturday_off ?? null,
      grace_minutes:
        employeeData.grace_minutes ?? null,
    },
    probation: {
      exists: Boolean(probationData),
      on_probation: onProbation,
      probation_period:
        probationData?.probation_period ?? null,
      probation_end_date:
        probationData?.probation_end_date ?? null,
      probation_status:
        probationData?.probation_status ?? null,
      probation_extended_period:
        probationData?.probation_extended_period ?? null,
      probation_final_status:
        probationData?.probation_final_status ?? null,
      confirmation_status:
        probationData?.confirmation_status ?? null,
      confirmed_on:
        probationData?.confirmed_on ?? null,

      // ==================================================
      // PROBATION EARNED LEAVE
      // ==================================================

      probation_el_credit:
        Number(
          probationData?.probation_el_credit ?? 0
        ),

      probation_el_transferred:
        Number(
          probationData?.probation_el_transferred ?? 0
        ),
    },
    leave_status: leaveStatus,
    joining_date: joiningDate,
    probation_completed: probationCompleted,
  };
}

// export async function getMonthlyAttendanceSummary(
//   employeeId: number,
//   year: number,
//   month: number
// ): Promise<MonthlyAttendanceSummary> {
//   console.log('========== STATIC ATTENDANCE SUMMARY ==========');
//   console.log('Employee ID:', employeeId);
//   console.log('Year:', year);
//   console.log('Month:', month);
//   /*
//    * For now every employee gets this static attendance.
//    *
//    * Example:
//    *
//    * Working Days      = 22
//    * Present Days      = 21
//    * WFH               = 1
//    * Half Days         = 0
//    * Absent Days       = 0
//    * Leave Days        = 0
//    * Holiday Worked    = 1
//    * Weekly Off Worked = 1
//    * Working Hours     = 176
//    */
//   const summary: MonthlyAttendanceSummary = {
//     employeeId,
//     year,
//     month,
//     totalCalendarDays: 31,
//     workingDays: 22,
//     presentDays: 20,
//     absentDays: 0,
//     halfDays: 0,
//     wfhDays: 1,
//     leaveDays: 0,
//     holidayWorkedDays: 1,
//     weeklyOffWorkedDays: 1,
//     totalWorkingHours: 176,
//   };
//   console.log('Attendance Summary:', summary);
//   return summary;
// }



export async function getMonthlyAttendanceSummary(
  employeeId: number,
  year: number,
  month: number
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
 
  // NOTE: wfhDays, holidayWorkedDays, weeklyOffWorkedDays are NOT currently
  // tracked as their own columns in employee_monthly_attendance — that table
  // only records whether a calendar day WAS a holiday/week-off
  // (holiday_days / weekly_off_days), not whether the employee actually
  // punched in during it. Defaulting to 0 rather than fabricating a number.
  // If real figures are needed here, the rule engine already has the right
  // statuses for it (PRESENT_ON_HOLIDAY / PRESENT_ON_WEEK_OFF in
  // shift-rule-evaluator.service.ts) — they're just never produced today,
  // because attendance-combined.service.ts short-circuits to HOLIDAY/WEEK_OFF
  // before evaluateAttendanceStatus() ever runs, regardless of punches.
  const summary: MonthlyAttendanceSummary = {
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
 
  return summary;
}
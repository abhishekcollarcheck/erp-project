// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface LeaveType {
//   id: number;
//   company_id: number;
//   name: string;
//   code: string;
//   days_per_year: number;
//   is_paid: boolean;
//   carry_forward: boolean;
//   max_carry_days: number;
//   is_active: boolean;
// }

// export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
// export type LeaveSubmissionType = 'self' | 'admin';
// export type LeaveApplicationType = 'arrival_late' | 'leaving_early' | 'first_half' | 'second_half' | 'full_day';

// export interface LeaveRequest {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string | null;
//   to_time?: string | null;
//   days: number;
//   half_day: boolean;
//   reason?: string | null;
//   status: LeaveRequestStatus;
//   approved_by?: number | null;
//   approved_at?: string | null;
//   rejection_reason?: string | null;
//   submission_type: LeaveSubmissionType;
//   applied_by?: number | null;
//   hod_name?: string | null;
//   coordinator_name?: string | null;
//   undertaking_accepted: boolean;
//   created_at?: string;
//   updated_at?: string;
//   // Present when fetched via /leaves or /leaves/pending (Sequelize include aliases)
//   employee?: {
//     id: number;
//     first_name: string;
//     last_name: string;
//     employee_code: string;
//     avatar_url?: string | null;
//   };
//   leaveType?: {
//     name: string;
//     code: string;
//     is_paid?: boolean;
//   };
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
//   reason: string;
//   hod_name: string;
//   coordinator_name: string;
//   undertaking_accepted: boolean;
// }

// export interface LeaveQueryParams {
//   page?: number;
//   limit?: number;
//   employee_id?: number;
//   status?: LeaveRequestStatus;
//   leave_type_id?: number;
// }

// export interface LeaveBalance {
//   leave_type_id: number;
//   name: string;
//   code: string;
//   allocated: number;
//   used: number;
//   remaining: number;
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const leaveService = {
//   getTypes: () =>
//     apiClient.get<unknown, ApiResponse<LeaveType[]>>('/leaves/types'),

//   getBalance: (employeeId?: number) =>
//     apiClient.get<unknown, ApiResponse<LeaveBalance[]>>('/leaves/balance', {
//       params: employeeId ? { employee_id: employeeId } : undefined,
//     }),

//   getAll: (params?: LeaveQueryParams) =>
//     apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves', { params }),

//   getPending: () =>
//     apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves/pending'),

//   apply: (data: ApplyLeaveDto) =>
//     apiClient.post<unknown, ApiResponse<LeaveRequest>>('/leaves', data),

//   approve: (id: number) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`),

//   reject: (id: number, reason?: string) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, { reason }),

//   cancel: (id: number) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`),
// };




// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface LeaveType {
//   id: number;
//   company_id: number;
//   name: string;
//   code: string;
//   days_per_year: number;
//   is_paid: boolean;
//   carry_forward: boolean;
//   max_carry_days: number;
//   is_active: boolean;
// }

// export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
// export type LeaveSubmissionType = 'self' | 'admin';
// export type LeaveApplicationType = 'arrival_late' | 'leaving_early' | 'first_half' | 'second_half' | 'full_day';

// export interface LeaveRequest {
//   id: number;
//   employee_id: number;
//   leave_type_id: number;
//   leave_application_type: LeaveApplicationType;
//   from_date: string;
//   to_date: string;
//   from_time?: string | null;
//   to_time?: string | null;
//   days: number;
//   half_day: boolean;
//   reason?: string | null;
//   status: LeaveRequestStatus;
//   approved_by?: number | null;
//   approved_at?: string | null;
//   rejection_reason?: string | null;
//   submission_type: LeaveSubmissionType;
//   applied_by?: number | null;
//   hod_name?: string | null;
//   coordinator_name?: string | null;
//   undertaking_accepted: boolean;
//   created_at?: string;
//   updated_at?: string;
//   // Present when fetched via /leaves or /leaves/pending (Sequelize include aliases)
//   employee?: {
//     id: number;
//     first_name: string;
//     last_name: string;
//     employee_code: string;
//     avatar_url?: string | null;
//   };
//   leaveType?: {
//     name: string;
//     code: string;
//     is_paid?: boolean;
//   };
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
//   reason: string;
//   hod_name: string;
//   coordinator_name: string;
//   undertaking_accepted: boolean;
// }

// export interface LeaveQueryParams {
//   page?: number;
//   limit?: number;
//   employee_id?: number;
//   status?: LeaveRequestStatus;
//   leave_type_id?: number;
// }

// // export interface LeaveBalance {
// //   leave_type_id: number;
// //   name: string;
// //   code: string;
// //   allocated: number;
// //   used: number;
// //   remaining: number;
// // }

// interface LeaveBalance {
//   leave_type_id: number;
//   name: string;
//   code: string;
//   year: number;
//   allocated: number;
//   used: number;
//   pending: number;
//   available: number;
//   carried_forward: number;
// }

// // One entry per leave type (CL/EL/ShL) — mirrors PostingResult in
// // backend/monthlyLeavePosting.service.ts.
// export interface MonthlyLeavePostingResult {
//   leave_type_code: string;
//   leave_type_name: string;
//   leave_type_id: number;
//   days_added: number;
//   balance_updated: boolean;
//   accrual_created: boolean;
//   remarks: string;
// }

// // Actual response body of POST /leaves/monthly/:employeeId — mirrors what
// // processMonthlyLeave() returns in backend/monthlyLeave.service.ts. The
// // posting results (what actually changed) are nested under postingResults,
// // not the top-level data itself.
// export interface MonthlyLeaveProcessResult {
//   calculation: unknown; // MonthlyLeaveCalculation from leaveRuleEngine.service.ts — not typed on the frontend yet
//   postingResults: MonthlyLeavePostingResult[];
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const leaveService = {
//   getTypes: () =>
//     apiClient.get<unknown, ApiResponse<LeaveType[]>>('/leaves/types'),

//   getBalance: (employeeId?: number) =>
//     apiClient.get<unknown, ApiResponse<LeaveBalance[]>>('/leaves/balance', {
//       params: employeeId ? { employee_id: employeeId } : undefined,
//     }),

//   getAll: (params?: LeaveQueryParams) =>
//     apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves', { params }),

//   getPending: () =>
//     apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves/pending'),

//   apply: (data: ApplyLeaveDto) =>
//     apiClient.post<unknown, ApiResponse<LeaveRequest>>('/leaves', data),

//   approve: (id: number) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`),

//   reject: (id: number, reason?: string) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, { reason }),

//   cancel: (id: number) =>
//     apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`),

//   // Manually trigger the monthly CL/EL/ShL credit posting for one employee/month
//   // — the same job the cron runs, exposed here for testing.
//   // POST /leaves/monthly/:employeeId?year=YYYY&month=M — apiClient's existing
//   // interceptor attaches the Bearer token the same way it does for every call above.
//   testMonthlyCredit: (employeeId: number, year: number, month: number) =>
//     apiClient.post<unknown, ApiResponse<MonthlyLeaveProcessResult>>(
//       `/leaves/monthly/${employeeId}`,
//       undefined,
//       { params: { year, month } },
//     ),
// };


import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: number;
  company_id: number;
  name: string;
  code: string;
  unit: 'day' | 'minutes';
  days_per_year: number;
  monthly_quota_minutes: number;
  split_chunk_minutes: number;
  allow_split: boolean;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_days: number;
  min_advance_days: number;
  max_backdate_days: number;
  sandwich_applies: boolean;
  allow_half_day: boolean;
  requires_approval: boolean;
  is_earned: boolean;
  deduct_from_leave_type_id: number | null;
  is_active: boolean;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveSubmissionType = 'self' | 'admin';
export type LeaveApplicationType = 'arrival_late' | 'leaving_early' | 'first_half' | 'second_half' | 'full_day';

export interface LeaveRequest {
  id: number;
  ref_no: string;
  employee_id: number;
  leave_type_id: number;
  leave_application_type: LeaveApplicationType;
  from_date: string;
  to_date: string;
  from_time?: string | null;
  to_time?: string | null;
  days: number;
  minutes: number;
  working_days: number;
  sandwich_days: number;
  half_day: boolean;
  reason?: string | null;
  status: LeaveRequestStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  submission_type: LeaveSubmissionType;
  applied_by?: number | null;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    avatar_url?: string | null;
  };
  leaveType?: {
    id?: number;
    name: string;
    code: string;
    unit?: 'day' | 'minutes';
    is_paid?: boolean;
  };
}


export interface ManagedEmployee {
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

  // Logged-in employee can be L1, L2, or both
  manager_type: ('L1' | 'L2')[];
}

export interface MyManager {
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

export interface MyManagersResponse {
  l1_manager: MyManager | null;
  l2_manager: MyManager | null;
}

export interface LeaveRequestDay {
  id: number;
  leave_request_id: number;
  date: string;
  kind: 'working' | 'weekly_off' | 'holiday';
  label?: string | null;
  charged: number;
  is_sandwich: boolean;
  is_adjacent: boolean;
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
  minutes?: number; // required when leave_application_type is arrival_late / leaving_early (Short Leave)
  reason: string;
  hod_name?: string;
  coordinator_name?: string;
  undertaking_accepted: boolean;
}

export interface LeaveQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  status?: LeaveRequestStatus;
  leave_type_id?: number;
}

export interface LeaveBalance {
  leave_type_id: number;
  name: string;
  code: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

export interface CompanyLeaveBalanceRow {
  employee_id: number;
  name: string;
  employee_code: string;
  EL: number;
  CL: number;
  SPECIAL: number;
  short_used_minutes: number;
  short_allocated_minutes: number;
}

export interface ShortLeaveBalance {
  leave_type_id: number;
  year: number;
  month: number;
  allocated_minutes: number;
  used_minutes: number;
  pending_minutes: number;
  available_minutes: number;
}

export interface LeaveAccrual {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  month: number;
  rule_type: 'monthly' | 'yearly' | 'custom';
  days_earned: number;
  working_days: number;
  working_hours: number;
  remarks?: string | null;
}

export interface LeavePolicy {
  id: number;
  company_id: number;
  sandwich_enabled: boolean;
  sandwich_include_weekly_off: boolean;
  sandwich_include_holidays: boolean;
}

export interface LeavePolicyUpdateDto {
  sandwich_enabled?: boolean;
  sandwich_include_weekly_off?: boolean;
  sandwich_include_holidays?: boolean;
}

export interface LeaveTypeUpsertDto {
  name?: string;
  code?: string;
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

export interface EmployeeWeeklyOffAssignment {
  id: number;
  employee_id: number;
  weekly_off_preset_id: number;
  weeklyOffPreset?: {
    id: number;
    name: string;
    always_off: string[];
    nth_off_rules: { weeks: number[]; day: string }[];
  };
}

export interface LeaveCredit {
  id: number;
  employee_id: number;
  leave_type_id: number;
  credit_date: string;
  days: number;
  holiday_name?: string | null;
  note?: string | null;
  credited_by: number;
  created_at?: string;
}

export interface CreditSpecialLeaveDto {
  employee_id: number;
  leave_type_id: number;
  credit_date: string;
  days: number;
  holiday_name?: string;
  note?: string;
}

// One entry per leave type — mirrors PostingResult in monthlyLeave.service.ts.
export interface MonthlyLeavePostingResult {
  leave_type_code: string;
  leave_type_name: string;
  leave_type_id: number;
  days_added: number;
  balance_updated: boolean;
  accrual_created: boolean;
  remarks: string;
}

export interface MonthlyLeaveProcessResult {
  calculation: unknown;
  postingResults: MonthlyLeavePostingResult[];
}

// ─── Service ──────────────────────────────────────────────────────────────────
// Every path below mirrors routes/leave.routes.ts exactly — check that file
// if a call here 404s, since that's the source of truth for what's mounted.

export const leaveService = {
  // Leave requests
  getMyManagedEmployees: () =>
    apiClient.get<unknown, ApiResponse<ManagedEmployee[]>>(
      '/leaves/my-managed-employees',
    ),

  // L1 and L2 managers of the logged-in employee
  getMyManagers: () =>
    apiClient.get<unknown, ApiResponse<MyManagersResponse>>(
      '/leaves/my-managers',
    ),
  getAll: (params?: LeaveQueryParams) =>
    apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves', { params }),

  getPending: () =>
    apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves/pending'),

  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}`),

  getBreakdown: (id: number) =>
    apiClient.get<unknown, ApiResponse<LeaveRequestDay[]>>(`/leaves/${id}/breakdown`),

  apply: (data: ApplyLeaveDto) =>
    apiClient.post<unknown, ApiResponse<LeaveRequest>>('/leaves', data),

  approve: (id: number) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`),

  reject: (id: number, reason?: string) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, { reason }),

  cancel: (id: number) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`),

  // Leave types
  getTypes: () =>
    apiClient.get<unknown, ApiResponse<LeaveType[]>>('/leaves/types'),

  getTypeById: (id: number) =>
    apiClient.get<unknown, ApiResponse<LeaveType>>(`/leaves/types/${id}`),

  createType: (data: LeaveTypeUpsertDto) =>
    apiClient.post<unknown, ApiResponse<LeaveType>>('/leaves/types', data),

  updateType: (id: number, data: LeaveTypeUpsertDto) =>
    apiClient.put<unknown, ApiResponse<LeaveType>>(`/leaves/types/${id}`, data),

  setTypeActive: (id: number, isActive: boolean) =>
    apiClient.put<unknown, ApiResponse<LeaveType>>(`/leaves/types/${id}/active`, { is_active: isActive }),

  // Policy
  getPolicy: () =>
    apiClient.get<unknown, ApiResponse<LeavePolicy>>('/leaves/policy'),

  updatePolicy: (data: LeavePolicyUpdateDto) =>
    apiClient.put<unknown, ApiResponse<LeavePolicy>>('/leaves/policy', data),

  // Weekly-off assignment
  getWeeklyOff: (employeeId?: number) =>
    apiClient.get<unknown, ApiResponse<EmployeeWeeklyOffAssignment | null>>('/leaves/weekly-off', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  assignWeeklyOff: (employeeId: number, weeklyOffPresetId: number) =>
    apiClient.put<unknown, ApiResponse<EmployeeWeeklyOffAssignment>>('/leaves/weekly-off', {
      employee_id: employeeId,
      weekly_off_preset_id: weeklyOffPresetId,
    }),

  // Balances
  getBalance: (employeeId?: number, year?: number) =>
    apiClient.get<unknown, ApiResponse<LeaveBalance[]>>('/leaves/balance', {
      params: { employee_id: employeeId, year },
    }),

  // Admin/HR only — every employee's balance in one call (backs the Balances tab)
  getCompanyBalances: (year?: number) =>
    apiClient.get<unknown, ApiResponse<CompanyLeaveBalanceRow[]>>('/leaves/balances/overview', {
      params: year ? { year } : undefined,
    }),

  getShortBalance: (employeeId: number | undefined, year: number, month: number) =>
    apiClient.get<unknown, ApiResponse<ShortLeaveBalance>>('/leaves/short-balance', {
      params: { employee_id: employeeId, year, month },
    }),

  // Accruals
  getAccruals: (employeeId: number | undefined, year: number) =>
    apiClient.get<unknown, ApiResponse<LeaveAccrual[]>>('/leaves/accruals', {
      params: { employee_id: employeeId, year },
    }),

  // Special leave credits
  getCredits: (employeeId?: number) =>
    apiClient.get<unknown, ApiResponse<LeaveCredit[]>>('/leaves/credits', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  creditSpecialLeave: (data: CreditSpecialLeaveDto) =>
    apiClient.post<unknown, ApiResponse<LeaveCredit>>('/leaves/credits', data),

  // Monthly processing — manual trigger, same job the cron runs.
  // CORRECTED: was posting to '/leaves/monthly/:employeeId', but the actual
  // mounted route (routes/leave.routes.ts) is '/leaves/monthly-process/:employeeId'.
  // The old path would have 404'd on every call.
  testMonthlyCredit: (employeeId: number, year: number, month: number) =>
    apiClient.post<unknown, ApiResponse<MonthlyLeaveProcessResult>>(
      `/leaves/monthly-process/${employeeId}`,
      undefined,
      { params: { year, month } },
    ),
};

// ============================================================================
// Holidays — separate backend module (holiday.model.ts / holiday.routes.ts),
// but folded into this same file since Holidays live on the Leave
// Management page. Every path below mirrors routes/holiday.routes.ts exactly.
// ============================================================================

export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  name: string;
  company_id: number | null; // null = global holiday, visible to every company
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayQueryParams {
  activeOnly?: boolean;
  upcomingOnly?: boolean;
}

export interface CreateHolidayDto {
  date: string;
  name: string;
  company_id?: number | null; // null requires super admin — enforced server-side
}

export interface UpdateHolidayDto {
  date?: string;
  name?: string;
  is_active?: boolean;
}

export const holidayService = {
  getAll: (params?: HolidayQueryParams) =>
    apiClient.get<unknown, ApiResponse<Holiday[]>>('/holidays', { params }),

  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<Holiday>>(`/holidays/${id}`),

  create: (data: CreateHolidayDto) =>
    apiClient.post<unknown, ApiResponse<Holiday>>('/holidays', data),

  update: (id: number, data: UpdateHolidayDto) =>
    apiClient.put<unknown, ApiResponse<Holiday>>(`/holidays/${id}`, data),

  remove: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/holidays/${id}`),
};
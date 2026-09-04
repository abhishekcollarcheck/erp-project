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




import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: number;
  company_id: number;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  carry_forward: boolean;
  max_carry_days: number;
  is_active: boolean;
}

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveSubmissionType = 'self' | 'admin';
export type LeaveApplicationType = 'arrival_late' | 'leaving_early' | 'first_half' | 'second_half' | 'full_day';

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_application_type: LeaveApplicationType;
  from_date: string;
  to_date: string;
  from_time?: string | null;
  to_time?: string | null;
  days: number;
  half_day: boolean;
  reason?: string | null;
  status: LeaveRequestStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  submission_type: LeaveSubmissionType;
  applied_by?: number | null;
  hod_name?: string | null;
  coordinator_name?: string | null;
  undertaking_accepted: boolean;
  created_at?: string;
  updated_at?: string;
  // Present when fetched via /leaves or /leaves/pending (Sequelize include aliases)
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    avatar_url?: string | null;
  };
  leaveType?: {
    name: string;
    code: string;
    is_paid?: boolean;
  };
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
  reason: string;
  hod_name: string;
  coordinator_name: string;
  undertaking_accepted: boolean;
}

export interface LeaveQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  status?: LeaveRequestStatus;
  leave_type_id?: number;
}

// export interface LeaveBalance {
//   leave_type_id: number;
//   name: string;
//   code: string;
//   allocated: number;
//   used: number;
//   remaining: number;
// }

interface LeaveBalance {
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

// One entry per leave type (CL/EL/ShL) — mirrors PostingResult in
// backend/monthlyLeavePosting.service.ts.
export interface MonthlyLeavePostingResult {
  leave_type_code: string;
  leave_type_name: string;
  leave_type_id: number;
  days_added: number;
  balance_updated: boolean;
  accrual_created: boolean;
  remarks: string;
}

// Actual response body of POST /leaves/monthly/:employeeId — mirrors what
// processMonthlyLeave() returns in backend/monthlyLeave.service.ts. The
// posting results (what actually changed) are nested under postingResults,
// not the top-level data itself.
export interface MonthlyLeaveProcessResult {
  calculation: unknown; // MonthlyLeaveCalculation from leaveRuleEngine.service.ts — not typed on the frontend yet
  postingResults: MonthlyLeavePostingResult[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const leaveService = {
  getTypes: () =>
    apiClient.get<unknown, ApiResponse<LeaveType[]>>('/leaves/types'),

  getBalance: (employeeId?: number) =>
    apiClient.get<unknown, ApiResponse<LeaveBalance[]>>('/leaves/balance', {
      params: employeeId ? { employee_id: employeeId } : undefined,
    }),

  getAll: (params?: LeaveQueryParams) =>
    apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves', { params }),

  getPending: () =>
    apiClient.get<unknown, ApiResponse<LeaveRequest[]>>('/leaves/pending'),

  apply: (data: ApplyLeaveDto) =>
    apiClient.post<unknown, ApiResponse<LeaveRequest>>('/leaves', data),

  approve: (id: number) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/approve`),

  reject: (id: number, reason?: string) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/reject`, { reason }),

  cancel: (id: number) =>
    apiClient.put<unknown, ApiResponse<LeaveRequest>>(`/leaves/${id}/cancel`),

  // Manually trigger the monthly CL/EL/ShL credit posting for one employee/month
  // — the same job the cron runs, exposed here for testing.
  // POST /leaves/monthly/:employeeId?year=YYYY&month=M — apiClient's existing
  // interceptor attaches the Bearer token the same way it does for every call above.
  testMonthlyCredit: (employeeId: number, year: number, month: number) =>
    apiClient.post<unknown, ApiResponse<MonthlyLeaveProcessResult>>(
      `/leaves/monthly/${employeeId}`,
      undefined,
      { params: { year, month } },
    ),
};
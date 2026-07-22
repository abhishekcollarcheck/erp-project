import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'Present' | 'Absent' | 'WFH' | 'Half-Day' | 'Holiday' | 'Leave';
export type AttendanceSource = 'Biometric' | 'Manual' | 'Mobile' | 'System';

export interface EmployeeSummary {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  remarks: string | null;
  Employee?: EmployeeSummary;
}

export interface TodaySummary {
  total: number;
  present: number;
  absent: number;
  wfh: number;
  onLeave: number;
  halfDay: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Distinct from ApiResponse<T[]> because list endpoints also carry `meta`
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export type RegularizationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface RegularizationRequest {
  id: number;
  employee_id: number;
  date: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: RegularizationStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_remarks: string | null;
  created_at: string;
  Employee?: EmployeeSummary;
}

export type MSSQLDayStatus = 'Present' | 'Incomplete' | 'No Punches';

export interface MSSQLAttendanceRow {
  employee_code: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: MSSQLDayStatus;
  working_hours: number | null;
  punch_count: number;
  source: 'Biometric';
}

export type CombinedDayStatus = 'Present' | 'Incomplete' | 'No Punches';
export type AttendanceSourceTag = 'Biometric' | 'Trakola';

export interface CombinedAttendanceRow {
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  sources: AttendanceSourceTag[];
  status: CombinedDayStatus;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  search?: string;
  status?: AttendanceStatus;
  source?: AttendanceSource;
  date_from?: string;
  date_to?: string;
  month?: number;
  year?: number;
  sort?: 'date_asc' | 'date_desc';
}

export interface MarkAttendanceDto {
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  remarks?: string | null;
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatus;
  check_in?: string | null;
  check_out?: string | null;
  remarks?: string | null;
}

export interface BulkMarkResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface CreateRegularizationDto {
  date: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  reason: string;
}

export interface ReviewRegularizationDto {
  decision: 'Approved' | 'Rejected';
  remarks?: string;
}

export interface EmployeeAttendanceQueryParams {
  month?: number;
  year?: number;
  date_from?: string; // ISO date (YYYY-MM-DD) — used together with date_to
  date_to?: string;   // ISO date (YYYY-MM-DD) — used together with date_from
}

// ─── Service ────────────────────────────────────────────────────────────────
export const attendanceService = {
  // MySQL — finalized attendance records
  getTodaySummary: () =>
    apiClient.get<unknown, ApiResponse<TodaySummary>>('/attendance/today-summary'),

  getAll: (params?: AttendanceQueryParams) =>
    apiClient.get<unknown, PaginatedApiResponse<AttendanceRecord>>('/attendance', { params }),

  getByEmployee: (employeeId: number, params?: EmployeeAttendanceQueryParams) =>
    apiClient.get<unknown, ApiResponse<AttendanceRecord[]>>(`/attendance/employee/${employeeId}`, { params }),

  mark: (data: MarkAttendanceDto) =>
    apiClient.post<unknown, ApiResponse<AttendanceRecord>>('/attendance', data),

  bulkMark: (records: MarkAttendanceDto[]) =>
    apiClient.post<unknown, ApiResponse<BulkMarkResult>>('/attendance/bulk', { records }),

  update: (id: number, data: UpdateAttendanceDto) =>
    apiClient.put<unknown, ApiResponse<AttendanceRecord>>(`/attendance/${id}`, data),

  // Regularization
  createRegularization: (data: CreateRegularizationDto) =>
    apiClient.post<unknown, ApiResponse<RegularizationRequest>>('/attendance/regularization', data),

  getMyRegularizations: () =>
    apiClient.get<unknown, ApiResponse<RegularizationRequest[]>>('/attendance/regularization/my'),

  getPendingRegularizations: () =>
    apiClient.get<unknown, ApiResponse<RegularizationRequest[]>>('/attendance/regularization/pending'),

  reviewRegularization: (id: number, data: ReviewRegularizationDto) =>
    apiClient.put<unknown, ApiResponse<RegularizationRequest>>(`/attendance/regularization/${id}/review`, data),

  // MSSQL — biometric device data
  getMyBiometricAttendance: (params?: EmployeeAttendanceQueryParams) =>
    apiClient.get<unknown, ApiResponse<MSSQLAttendanceRow[]>>('/attendance/mssql/my', { params }),

  getBiometricByEmployeeCode: (code: string, params?: EmployeeAttendanceQueryParams) =>
    apiClient.get<unknown, ApiResponse<MSSQLAttendanceRow[]>>(`/attendance/mssql/employee/${code}`, { params }),

  getBiometricToday: () =>
    apiClient.get<unknown, ApiResponse<MSSQLAttendanceRow[]>>('/attendance/mssql/today'),

  getBiometricRange: (params: { date_from?: string; date_to?: string; employee_code?: string }) =>
    apiClient.get<unknown, ApiResponse<MSSQLAttendanceRow[]>>('/attendance/mssql', { params }),

  // Combined — Biometric + Trakola merged per day
  getMyCombinedAttendance: (params: { date_from: string; date_to: string }) =>
    apiClient.get<unknown, ApiResponse<CombinedAttendanceRow[]>>('/attendance/combined/my', { params }),
};
import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────

export interface SaturdayRule {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GraceMinute {
  id: number;
  name: string;
  minutes: number | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceType {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// DTOs
export interface CreateSaturdayRuleDto {
  name: string;
}

export interface UpdateSaturdayRuleDto {
  name: string;
}

export interface CreateGraceMinuteDto {
  name: string;
  minutes?: number;
}

export interface UpdateGraceMinuteDto {
  name?: string;
  minutes?: number;
}

export interface CreateAttendanceTypeDto {
  name: string;
  code?: string;
}

export interface UpdateAttendanceTypeDto {
  name?: string;
  code?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const attendanceRulesApi = {
  // ─── Saturday Rules ─────────────────────────────────────────────────────
  getAllSaturdayRules: () =>
    apiClient.get<unknown, ApiResponse<SaturdayRule[]>>('/attendance-rules/saturday-rules'),

  createSaturdayRule: (data: CreateSaturdayRuleDto) =>
    apiClient.post<unknown, ApiResponse<SaturdayRule>>('/attendance-rules/saturday-rules', data),

  updateSaturdayRule: (id: number, data: UpdateSaturdayRuleDto) =>
    apiClient.put<unknown, ApiResponse<SaturdayRule>>(`/attendance-rules/saturday-rules/${id}`, data),

  deleteSaturdayRule: (id: number) =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>(`/attendance-rules/saturday-rules/${id}`),

  deleteAllSaturdayRules: () =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>('/attendance-rules/saturday-rules/master'),

  // ─── Grace Minutes ──────────────────────────────────────────────────────
  getAllGraceMinutes: () =>
    apiClient.get<unknown, ApiResponse<GraceMinute[]>>('/attendance-rules/grace-minutes'),

  createGraceMinute: (data: CreateGraceMinuteDto) =>
    apiClient.post<unknown, ApiResponse<GraceMinute>>('/attendance-rules/grace-minutes', data),

  updateGraceMinute: (id: number, data: UpdateGraceMinuteDto) =>
    apiClient.put<unknown, ApiResponse<GraceMinute>>(`/attendance-rules/grace-minutes/${id}`, data),

  deleteGraceMinute: (id: number) =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>(`/attendance-rules/grace-minutes/${id}`),

  deleteAllGraceMinutes: () =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>('/attendance-rules/grace-minutes/master'),

  // ─── Attendance Types ───────────────────────────────────────────────────
  getAllAttendanceTypes: () =>
    apiClient.get<unknown, ApiResponse<AttendanceType[]>>('/attendance-rules/attendance-types'),

  createAttendanceType: (data: CreateAttendanceTypeDto) =>
    apiClient.post<unknown, ApiResponse<AttendanceType>>('/attendance-rules/attendance-types', data),

  updateAttendanceType: (id: number, data: UpdateAttendanceTypeDto) =>
    apiClient.put<unknown, ApiResponse<AttendanceType>>(`/attendance-rules/attendance-types/${id}`, data),

  deleteAttendanceType: (id: number) =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>(`/attendance-rules/attendance-types/${id}`),

  deleteAllAttendanceTypes: () =>
    apiClient.delete<unknown, ApiResponse<{ message: string }>>('/attendance-rules/attendance-types/master'),
};
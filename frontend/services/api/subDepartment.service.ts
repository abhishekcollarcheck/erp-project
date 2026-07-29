import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

export interface SubDepartmentEmployee {
  id:             number;
  first_name:     string;
  last_name:      string;
  employee_code:  string;
  status:         string;
  avatar_url?:    string | null;
  designation_id?: number | null;
}

export interface SubDepartment {
  id:              number;
  name:            string;
  is_active:       boolean;
  created_at?:     string;
  updated_at?:     string;
  employee_count?: number;
}

export interface CreateSubDepartmentDto {
  name:       string;
}

export interface UpdateSubDepartmentDto {
  name?:      string;
  is_active?: boolean;
}

export interface SubDepartmentQueryParams {
  search?:    string;
  is_active?: 'true' | 'false' | 'all';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const subDepartmentService = {
  getAll: (params?: SubDepartmentQueryParams) =>
    apiClient.get<unknown, ApiResponse<SubDepartment[]>>('/sub-department', { params }),

  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`),

  create: (data: CreateSubDepartmentDto) =>
    apiClient.post<unknown, ApiResponse<SubDepartment>>('/sub-department', data),

  update: (id: number, data: UpdateSubDepartmentDto) =>
    apiClient.put<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/sub-department/${id}`),
};

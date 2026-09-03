// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// export interface SubDepartmentEmployee {
//   id:             number;
//   first_name:     string;
//   last_name:      string;
//   employee_code:  string;
//   status:         string;
//   avatar_url?:    string | null;
//   designation_id?: number | null;
// }

// export interface SubDepartment {
//   id:              number;
//   name:            string;
//   is_active:       boolean;
//   created_at?:     string;
//   updated_at?:     string;
//   employee_count?: number;
// }

// export interface CreateSubDepartmentDto {
//   name:       string;
// }

// export interface UpdateSubDepartmentDto {
//   name?:      string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?:    string;
//   is_active?: 'true' | 'false' | 'all';
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const subDepartmentService = {
//   getAll: (params?: SubDepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment[]>>('/sub-department', { params }),

//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`),

//   create: (data: CreateSubDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<SubDepartment>>('/sub-department', data),

//   update: (id: number, data: UpdateSubDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`, data),

//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/sub-department/${id}`),
// };



// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface SubDepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface SubDepartmentDepartment {
//   id: number;
//   name: string;
//   company_id: number;
// }

// export interface SubDepartment {
//   id: number;
//   department_id: number;
//   name: string;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   // Associations (present on getById)
//   department?: SubDepartmentDepartment;
//   employees?: SubDepartmentEmployee[];
// }

// export interface CreateSubDepartmentDto {
//   company_id: number;
//   department_id: number;
//   sub_department_name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all';
//   /** Filters to sub-departments of a single parent department. */
//   department_id?: number;
//   /** See note in department.service.ts — not read by the controller yet. */
//   company_id?: number;
// }

// // ─── Service ──────────────────────────────────────────────────────────────────
// // NOTE: route base kept as '/sub-department' to match the router you shared.

// export const subDepartmentService = {
//   getAll: (params?: SubDepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment[]>>('/sub-department', { params }),

//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`),

//   create: (data: CreateSubDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<SubDepartment>>('/sub-department', data),

//   update: (id: number, data: UpdateSubDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`, data),

//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/sub-department/${id}`),
// };


// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface SubDepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface SubDepartmentDepartment {
//   id: number;
//   department_name: string; // Fixed: Matched DB model field attribute name
//   company_id: number;
// }

// export interface SubDepartment {
//   id: number;
//   department_id: number;
//   name: string;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   // Associations
//   department?: SubDepartmentDepartment;
//   employees?: SubDepartmentEmployee[];
// }

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string; // Fixed: Backend expects 'name', not 'sub_department_name'
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all';
//   department_id?: number;
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const subDepartmentService = {
//   getAll: (params?: SubDepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment[]>>('/sub-department', { params }),

//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`),

//   create: (data: CreateSubDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<SubDepartment>>('/sub-department', data),

//   update: (id: number, data: UpdateSubDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`, data),

//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/sub-department/${id}`),
// };



import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Department Head / Employee (same shape as Department's)
// ─────────────────────────────────────────────────────────────────────────────

export interface SubDepartmentHead {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  designation_id?: number | null;
}

export interface SubDepartmentEmployee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  status: string;
  avatar_url?: string | null;
  designation_id?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Associated Department
// ─────────────────────────────────────────────────────────────────────────────

export interface AssociatedDepartment {
  id: number;
  department_name: string;
  department_code?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Department Entity
// ─────────────────────────────────────────────────────────────────────────────

export interface SubDepartment {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_all_departments: boolean;
  is_active: boolean;
  head_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  employee_count?: number;
  head?: SubDepartmentHead | null;
  employees?: SubDepartmentEmployee[];

  /**
   * List of parent Department IDs assigned to this sub-department via pivot table
   */
  department_ids: number[];

  /**
   * List of mapped parent Department details
   */
  departments: AssociatedDepartment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSubDepartmentDto {
  name: string;
  code?: string | null;
  description?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  head_id?: number | null;
}

export interface UpdateSubDepartmentDto {
  name?: string;
  code?: string | null;
  description?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  head_id?: number | null;
  is_active?: boolean;
}

export interface SubDepartmentQueryParams {
  search?: string;
  is_active?: 'true' | 'false' | 'all' | boolean;
  department_id?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Department API Service
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: unlike Designation/Sub-Designation (one shared router mounted at
// /designations), Sub-Department has its own controller/service file and
// its own frontend feature folder — so it's assumed to be mounted at its
// own base path, `/sub-departments`, not nested under `/departments`.
// CONFIRM this against your actual subDepartment.routes.ts mount point
// before relying on this.

export const subDepartmentService = {
  /**
   * Get all sub-departments with optional filters (search, active status, department_id)
   */
  getAll: (params?: SubDepartmentQueryParams) =>
    apiClient.get<unknown, ApiResponse<SubDepartment[]>>('/sub-department', {
      params,
    }),

  /**
   * Get a single sub-department by ID (includes mapped departments and active employees)
   */
  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`),

  /**
   * Create a new sub-department (all-departments, or one/many specific department_ids)
   */
  create: (data: CreateSubDepartmentDto) =>
    apiClient.post<unknown, ApiResponse<SubDepartment>>('/sub-department', data),

  /**
   * Update an existing sub-department (including adding/removing linked departments)
   */
  update: (id: number, data: UpdateSubDepartmentDto) =>
    apiClient.put<unknown, ApiResponse<SubDepartment>>(`/sub-department/${id}`, data),

  /**
   * Soft-delete a sub-department (blocked if active employees are assigned)
   */
  delete: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/sub-department/${id}`),
};
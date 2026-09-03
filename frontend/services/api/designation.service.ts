// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';
// import type {
//   Designation, DesignationStats,
//   CreateDesignationDto, UpdateDesignationDto, DesignationQueryParams,
// } from '../../features/designations/types/designation.types';

// export const designationService = {
//   // GET /api/designations?department_id=1&is_active=true|false|all&search=eng
//   getAll: (params?: DesignationQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Designation[]>>('/designations', { params }),

//   // GET /api/designations/stats
//   getStats: () =>
//     apiClient.get<unknown, ApiResponse<DesignationStats>>('/designations/stats'),

//   // GET /api/designations/:id  (includes employees list)
//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Designation>>(`/designations/${id}`),

//   // POST /api/designations
//   create: (data: CreateDesignationDto) =>
//     apiClient.post<unknown, ApiResponse<Designation>>('/designations', data),

//   // PUT /api/designations/:id
//   update: (id: number, data: UpdateDesignationDto) =>
//     apiClient.put<unknown, ApiResponse<Designation>>(`/designations/${id}`, data),

//   // PATCH /api/designations/:id/toggle
//   toggle: (id: number) =>
//     apiClient.patch<unknown, ApiResponse<Designation>>(`/designations/${id}/toggle`),

//   // DELETE /api/designations/:id
//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/designations/${id}`),
// };




// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─────────────────────────────────────────────────────────────────────────────
// // Associated Department
// // ─────────────────────────────────────────────────────────────────────────────

// export interface AssociatedDepartment {
//   id: number;
//   department_name: string;
//   department_code?: string | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Sub-Designation Entity
// // ─────────────────────────────────────────────────────────────────────────────

// export interface SubDesignation {
//   id: number;
//   designation_id: number;
//   name: string;
//   code?: string | null;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   deleted_at?: string | null;
//   designation?: {
//     id: number;
//     name: string;
//     code?: string | null;
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Designation Entity
// // ─────────────────────────────────────────────────────────────────────────────

// export interface Designation {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments: boolean;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   deleted_at?: string | null;

//   /**
//    * List of nested sub-designations linked to this designation
//    */
//   sub_designations?: SubDesignation[];

//   /**
//    * List of department IDs assigned to this designation via the pivot table
//    */
//   department_ids: number[];

//   /**
//    * List of mapped Department details
//    */
//   departments: AssociatedDepartment[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DTOs - Designation
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateSubDesignationInlineDto {
//   name: string;
//   code?: string;
// }

// export interface CreateDesignationDto {
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   sub_designations?: CreateSubDesignationInlineDto[];
// }

// export interface UpdateDesignationDto {
//   name?: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   is_active?: boolean;
// }

// export interface DesignationQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all' | boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DTOs - Sub-Designation
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateSubDesignationDto {
//   designation_id: number;
//   name: string;
//   code?: string | null;
// }

// export interface UpdateSubDesignationDto {
//   name?: string;
//   code?: string | null;
//   is_active?: boolean;
// }

// export interface SubDesignationQueryParams {
//   search?: string;
//   designation_id?: number;
//   is_active?: 'true' | 'false' | 'all' | boolean;
// }

// // Helper to format array or boolean filters into query params
// function formatQueryParams(params?: Record<string, any>): Record<string, any> | undefined {
//   if (!params) return undefined;
  
//   const query: Record<string, any> = { ...params };

//   if (Array.isArray(query.department_ids)) {
//     query.department_ids = query.department_ids.join(',');
//   }

//   return query;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Designation & Sub-Designation API Service
// // ─────────────────────────────────────────────────────────────────────────────

// export const designationService = {
//   // =========================================================================
//   // DESIGNATIONS
//   // =========================================================================

//   /**
//    * Get all designations with optional query filters (search, active status)
//    */
//   getAll: (params?: DesignationQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Designation[]>>('/designations', {
//       params: formatQueryParams(params),
//     }),

//   /**
//    * Get a single designation by ID (includes mapped departments and sub-designations)
//    */
//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Designation>>(`/designations/${id}`),

//   /**
//    * Create a new designation (optionally passing sub-designations inline)
//    */
//   create: (data: CreateDesignationDto) =>
//     apiClient.post<unknown, ApiResponse<Designation>>('/designations', data),

//   /**
//    * Update an existing designation (including adding/removing assigned departments)
//    */
//   update: (id: number, data: UpdateDesignationDto) =>
//     apiClient.put<unknown, ApiResponse<Designation>>(`/designations/${id}`, data),

//   /**
//    * Soft-delete a designation (also cleans up department mappings and sub-designations)
//    */
//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/designations/${id}`),

//   // =========================================================================
//   // SUB-DESIGNATIONS
//   // =========================================================================

//   /**
//    * Get all sub-designations with optional filters (designation_id, search, active status)
//    */
//   getAllSubDesignations: (params?: SubDesignationQueryParams) =>
//     apiClient.get<unknown, ApiResponse<SubDesignation[]>>('/sub-designations', {
//       params: formatQueryParams(params),
//     }),

//   /**
//    * Create a standalone sub-designation tied to a specific parent designation
//    */
//   createSubDesignation: (data: CreateSubDesignationDto) =>
//     apiClient.post<unknown, ApiResponse<SubDesignation>>('/sub-designations', data),

//   /**
//    * Update a sub-designation
//    */
//   updateSubDesignation: (id: number, data: UpdateSubDesignationDto) =>
//     apiClient.put<unknown, ApiResponse<SubDesignation>>(`/sub-designations/${id}`, data),

//   /**
//    * Soft-delete a sub-designation
//    */
//   deleteSubDesignation: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/sub-designations/${id}`),
// };





// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─────────────────────────────────────────────────────────────────────────────
// // Associated Entities
// // ─────────────────────────────────────────────────────────────────────────────

// export interface AssociatedDepartment {
//   id: number;
//   department_name: string;
//   department_code?: string | null;
// }

// export interface AssociatedDesignation {
//   id: number;
//   name: string;
//   code?: string | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Sub-Designation Entity
// // ─────────────────────────────────────────────────────────────────────────────

// export interface SubDesignation {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_designations: boolean;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   deleted_at?: string | null;

//   /**
//    * List of parent Designation IDs assigned to this sub-designation via pivot table
//    */
//   designation_ids: number[];

//   /**
//    * List of mapped parent Designation details
//    */
//   designations: AssociatedDesignation[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Designation Entity
// // ─────────────────────────────────────────────────────────────────────────────

// export interface Designation {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments: boolean;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   deleted_at?: string | null;

//   /**
//    * List of mapped Sub-Designation details
//    */
//   sub_designations?: SubDesignation[];

//   /**
//    * List of Sub-Designation IDs assigned to this designation
//    */
//   sub_designation_ids?: number[];

//   /**
//    * List of department IDs assigned to this designation via the pivot table
//    */
//   department_ids: number[];

//   /**
//    * List of mapped Department details
//    */
//   departments: AssociatedDepartment[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DTOs - Designation
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateDesignationDto {
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   sub_designation_ids?: number[];
// }

// export interface UpdateDesignationDto {
//   name?: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   is_active?: boolean;
// }

// export interface DesignationQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all' | boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DTOs - Sub-Designation
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateSubDesignationDto {
//   name: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   designation_ids?: number[];
// }

// export interface UpdateSubDesignationDto {
//   name?: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   designation_ids?: number[];
//   is_active?: boolean;
// }

// export interface SubDesignationQueryParams {
//   search?: string;
//   designation_id?: number;
//   is_active?: 'true' | 'false' | 'all' | boolean;
// }

// // Helper to format array or boolean filters into query params
// function formatQueryParams(params?: Record<string, any>): Record<string, any> | undefined {
//   if (!params) return undefined;
  
//   const query: Record<string, any> = { ...params };

//   if (Array.isArray(query.department_ids)) {
//     query.department_ids = query.department_ids.join(',');
//   }

//   if (Array.isArray(query.designation_ids)) {
//     query.designation_ids = query.designation_ids.join(',');
//   }

//   return query;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Designation & Sub-Designation API Service
// // ─────────────────────────────────────────────────────────────────────────────

// export const designationService = {
//   // =========================================================================
//   // DESIGNATIONS
//   // =========================================================================

//   /**
//    * Get all designations with optional query filters (search, active status)
//    */
//   getAll: (params?: DesignationQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Designation[]>>('/designations', {
//       params: formatQueryParams(params),
//     }),

//   /**
//    * Get a single designation by ID (includes mapped departments and sub-designations)
//    */
//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Designation>>(`/designations/${id}`),

//   /**
//    * Create a new designation (optionally passing assigned sub-designations IDs)
//    */
//   create: (data: CreateDesignationDto) =>
//     apiClient.post<unknown, ApiResponse<Designation>>('/designations', data),

//   /**
//    * Update an existing designation (including adding/removing assigned departments)
//    */
//   update: (id: number, data: UpdateDesignationDto) =>
//     apiClient.put<unknown, ApiResponse<Designation>>(`/designations/${id}`, data),

//   /**
//    * Soft-delete a designation (also cleans up department and sub-designation mappings)
//    */
//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/designations/${id}`),

//   // =========================================================================
//   // SUB-DESIGNATIONS
//   // =========================================================================

//   /**
//    * Get all sub-designations with optional filters (designation_id, search, active status)
//    */
//   getAllSubDesignations: (params?: SubDesignationQueryParams) =>
//     apiClient.get<unknown, ApiResponse<SubDesignation[]>>('/sub-designations', {
//       params: formatQueryParams(params),
//     }),

//   /**
//    * Get a single sub-designation by ID
//    */
//   getSubDesignationById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<SubDesignation>>(`/sub-designations/${id}`),

//   /**
//    * Create a standalone sub-designation tied to target parent designations
//    */
//   createSubDesignation: (data: CreateSubDesignationDto) =>
//     apiClient.post<unknown, ApiResponse<SubDesignation>>('/sub-designations', data),

//   /**
//    * Update a sub-designation (including updating parent designation mappings)
//    */
//   updateSubDesignation: (id: number, data: UpdateSubDesignationDto) =>
//     apiClient.put<unknown, ApiResponse<SubDesignation>>(`/sub-designations/${id}`, data),

//   /**
//    * Soft-delete a sub-designation
//    */
//   deleteSubDesignation: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/sub-designations/${id}`),
// };


import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// Associated Entities
// ─────────────────────────────────────────────────────────────────────────────

export interface AssociatedDepartment {
  id: number;
  department_name: string;
  department_code?: string | null;
}

export interface AssociatedDesignation {
  id: number;
  name: string;
  code?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Designation Entity
// ─────────────────────────────────────────────────────────────────────────────

export interface SubDesignation {
  id: number;
  name: string;
  code?: string | null;
  is_all_designations: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  /**
   * List of parent Designation IDs assigned to this sub-designation via pivot table
   */
  designation_ids: number[];

  /**
   * List of mapped parent Designation details
   */
  designations: AssociatedDesignation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Designation Entity
// ─────────────────────────────────────────────────────────────────────────────

export interface Designation {
  id: number;
  name: string;
  code?: string | null;
  is_all_departments: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  /**
   * List of mapped Sub-Designation details
   */
  sub_designations: SubDesignation[];

  /**
   * List of Sub-Designation IDs assigned to this designation
   */
  sub_designation_ids: number[];

  /**
   * List of department IDs assigned to this designation via the pivot table
   */
  department_ids: number[];

  /**
   * List of mapped Department details
   */
  departments: AssociatedDepartment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs - Designation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateDesignationDto {
  name: string;
  code?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  sub_designation_ids?: number[];
}

export interface UpdateDesignationDto {
  name?: string;
  code?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  is_active?: boolean;
}

export interface DesignationQueryParams {
  search?: string;
  is_active?: 'true' | 'false' | 'all' | boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs - Sub-Designation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateSubDesignationDto {
  name: string;
  code?: string | null;
  is_all_designations?: boolean;
  designation_ids?: number[];
}

export interface UpdateSubDesignationDto {
  name?: string;
  code?: string | null;
  is_all_designations?: boolean;
  designation_ids?: number[];
  is_active?: boolean;
}

export interface SubDesignationQueryParams {
  search?: string;
  designation_id?: number;
  is_active?: 'true' | 'false' | 'all' | boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Designation & Sub-Designation API Service
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: both Designation and Sub-Designation routes live under the SAME
// backend router, mounted once at `/designations` (see designation.routes.ts).
// That's why every sub-designation call below is prefixed with
// `/designations/sub-designations`, not a bare `/sub-designations`.

export const designationService = {
  // =========================================================================
  // DESIGNATIONS
  // =========================================================================

  /**
   * Get all designations with optional query filters (search, active status)
   */
  getAll: (params?: DesignationQueryParams) =>
    apiClient.get<unknown, ApiResponse<Designation[]>>('/designations', {
      params,
    }),

  /**
   * Get a single designation by ID (includes mapped departments and sub-designations)
   */
  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<Designation>>(`/designations/${id}`),

  /**
   * Create a new designation (optionally passing assigned sub-designations IDs)
   */
  create: (data: CreateDesignationDto) =>
    apiClient.post<unknown, ApiResponse<Designation>>('/designations', data),

  /**
   * Update an existing designation (including adding/removing assigned departments)
   */
  update: (id: number, data: UpdateDesignationDto) =>
    apiClient.put<unknown, ApiResponse<Designation>>(`/designations/${id}`, data),

  /**
   * Soft-delete a designation (also cleans up department and sub-designation mappings)
   */
  delete: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/designations/${id}`),

  // =========================================================================
  // SUB-DESIGNATIONS
  // =========================================================================

  /**
   * Get all sub-designations with optional filters (designation_id, search, active status)
   */
  getAllSubDesignations: (params?: SubDesignationQueryParams) =>
    apiClient.get<unknown, ApiResponse<SubDesignation[]>>('/designations/sub-designations', {
      params,
    }),

  /**
   * Get a single sub-designation by ID
   */
  getSubDesignationById: (id: number) =>
    apiClient.get<unknown, ApiResponse<SubDesignation>>(`/designations/sub-designations/${id}`),

  /**
   * Create a standalone sub-designation tied to target parent designations
   */
  createSubDesignation: (data: CreateSubDesignationDto) =>
    apiClient.post<unknown, ApiResponse<SubDesignation>>('/designations/sub-designations', data),

  /**
   * Update a sub-designation (including updating parent designation mappings)
   */
  updateSubDesignation: (id: number, data: UpdateSubDesignationDto) =>
    apiClient.put<unknown, ApiResponse<SubDesignation>>(`/designations/sub-designations/${id}`, data),

  /**
   * Soft-delete a sub-designation
   */
  deleteSubDesignation: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/designations/sub-designations/${id}`),
};
// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────

// export interface DepartmentHead {
//   id:              number;
//   first_name:      string;
//   last_name:       string;
//   avatar_url?:     string | null;
//   designation_id?: number | null;
// }

// // export interface DepartmentDesignation {
// //   id:     number;
// //   name: string;
// //   grade?: string | null;
// // }

// export interface DepartmentEmployee {
//   id:             number;
//   first_name:     string;
//   last_name:      string;
//   employee_code:  string;
//   status:         string;
//   avatar_url?:    string | null;
//   designation_id?: number | null;
// }

// // export interface DepartmentParent {
// //   id:    number;
// //   dpname:string;
// //   code?: string | null;
// // }

// export interface Department {
//   id:               number;
//   department_name:  string;
//   department_code?: string | null;
//   head_id?:         number | null;
//   is_active:        boolean;
//   created_at?:      string;
//   updated_at?:      string;
//   employee_count?:  number;
//   // Associations
//   head?:           DepartmentHead | null;
//   employees?:      DepartmentEmployee[];
// }

// export interface DepartmentStats {
//   total:            number;
//   active:           number;
//   inactive:         number;
//   withHead:         number;
//   withoutHead:      number;
//   largestDeptId:    number | null;
//   largestDeptCount: number;
// }

// export interface CreateDepartmentDto {
//   department_name:  string;
//   department_code?: string | null;
//   head_id?:         number | null;
// }

// export interface UpdateDepartmentDto {
//   department_name?: string;
//   department_code?: string | null;
//   head_id?:         number | null;
//   is_active?:       boolean;
// }

// export interface DepartmentQueryParams {
//   search?:    string;
//   is_active?: 'true' | 'false' | 'all';
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const departmentService = {
//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', { params }),

//   getStats: () =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats'),

//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`),

//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department>>('/departments', data),

//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`),
// };


// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─── Types ────────────────────────────────────────────────────────────────────
// // NOTE: aligned to the actual Department model / DepartmentService contract:
// //   - the model field is `name`, there is no `department_code` column
// //     (it's commented out in the model), so those were removed below.
// //   - `head_id` is accepted by the DTOs but department.service.ts's
// //     create()/update() never assign it to the record yet — the field is
// //     kept here so the UI is ready, but it won't actually persist until
// //     that's fixed on the backend.
// //   - getStats() only returns the 5 fields below — `withHead` / `withoutHead`
// //     don't exist in the current implementation.

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface Department {
//   id: number;
//   name: string;
//   head_id?: number | null;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   // Associations (present on getById, not on getAll)
//   head?: DepartmentHead | null;
//   employees?: DepartmentEmployee[];
// }

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;
//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// export interface CreateDepartmentDto {
//   name: string;
//   head_id?: number | null;
// }

// export interface UpdateDepartmentDto {
//   name?: string;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all';
//   /**
//    * Not read by the current controller (companyId always comes from
//    * req.user!.companyId). Included so this is ready to go the moment the
//    * backend accepts an override for admin users — until then, passing this
//    * has no effect on the response.
//    */
//   company_id?: number;
// }

// // ─── Service ──────────────────────────────────────────────────────────────────

// export const departmentService = {
//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', { params }),

//   getStats: (params?: Pick<DepartmentQueryParams, 'company_id'>) =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats', { params }),

//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`),

//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department>>('/departments', data),

//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`),
// };


// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Head
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Employee
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department
// // ─────────────────────────────────────────────────────────────────────────────

// export interface Department {
//   id: number;
//   company_id: number;
//   department_name: string;
//   head_id?: number | null;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   head?: DepartmentHead | null;
//   employees?: DepartmentEmployee[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Stats
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;
//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Create
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateDepartmentDto {
//   company_id: number;
//   department_name: string;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Update
// // ─────────────────────────────────────────────────────────────────────────────

// export interface UpdateDepartmentDto {
//   company_id: number;
//   department_name?: string;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Query
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentQueryParams {
//   search?: string;

//   is_active?: 'true' | 'false' | 'all';

//   company_id?: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // API Service
// // ─────────────────────────────────────────────────────────────────────────────

// export const departmentService = {

//   // GET /departments?company_id=1
//   getAll: (
//     params?: DepartmentQueryParams,
//   ) =>
//     apiClient.get<
//       unknown,
//       ApiResponse<Department[]>
//     >(
//       '/departments',
//       {
//         params,
//       },
//     ),

//   // GET /departments/stats?company_id=1
//   getStats: (
//     params?: Pick<
//       DepartmentQueryParams,
//       'company_id'
//     >,
//   ) =>
//     apiClient.get<
//       unknown,
//       ApiResponse<DepartmentStats>
//     >(
//       '/departments/stats',
//       {
//         params,
//       },
//     ),

//   // GET /departments/:id?company_id=1
//   getById: (
//     id: number,
//     companyId: number,
//   ) =>
//     apiClient.get<
//       unknown,
//       ApiResponse<Department>
//     >(
//       `/departments/${id}`,
//       {
//         params: {
//           company_id: companyId,
//         },
//       },
//     ),

//   // POST /departments
//   create: (
//     data: CreateDepartmentDto,
//   ) =>
//     apiClient.post<
//       unknown,
//       ApiResponse<Department>
//     >(
//       '/departments',
//       data,
//     ),

//   // PUT /departments/:id
//   update: (
//     id: number,
//     data: UpdateDepartmentDto,
//   ) =>
//     apiClient.put<
//       unknown,
//       ApiResponse<Department>
//     >(
//       `/departments/${id}`,
//       data,
//     ),

//   // DELETE /departments/:id?company_id=1
//   delete: (
//     id: number,
//     companyId: number,
//   ) =>
//     apiClient.delete<
//       unknown,
//       ApiResponse<null>
//     >(
//       `/departments/${id}`,
//       {
//         params: {
//           company_id: companyId,
//         },
//       },
//     ),
// };

// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface Department {
//   id: number;
//   company_id: number;
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   head?: DepartmentHead | null;
//   employees?: DepartmentEmployee[];
// }

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;
//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// export interface CreateDepartmentDto {
//   company_id: number;
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface UpdateDepartmentDto {
//   company_id: number;
//   department_name?: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all';
//   company_id?: number;
// }

// export const departmentService = {
//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', { params }),

//   getStats: (params?: Pick<DepartmentQueryParams, 'company_id'>) =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats', { params }),

//   getById: (id: number, companyId: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`, {
//       params: { company_id: companyId },
//     }),

//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department>>('/departments', data),

//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

//   delete: (id: number, companyId: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`, {
//       params: { company_id: companyId },
//     }),
// };



// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// export interface Department {
//   id: number;
//   company_id: number;
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active: boolean;
//   created_at?: string;
//   updated_at?: string;
//   employee_count?: number;
//   head?: DepartmentHead | null;
//   employees?: DepartmentEmployee[];
//   company_ids?: number[];
// }

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;
//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// export interface CreateDepartmentDto {
//   company_ids: number[];
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface UpdateDepartmentDto {
//   current_company_id: number;
//   company_ids?: number[];
//   department_name?: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all';
//   company_id?: number;
// }

// export const departmentService = {
//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', { params }),

//   getStats: (params?: Pick<DepartmentQueryParams, 'company_id'>) =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats', { params }),

//   getById: (id: number, companyId: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`, {
//       params: { company_id: companyId },
//     }),

//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department[]>>('/departments', data),

//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

//   delete: (id: number, companyId: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`, {
//       params: { company_id: companyId },
//     }),
// };

























// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Head
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Employee
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department
// // ─────────────────────────────────────────────────────────────────────────────

// export interface Department {
//   /**
//    * ID of the department row.
//    *
//    * Since the database has one company_id per row,
//    * the same logical department can have different row IDs
//    * for different companies.
//    */
//   id: number;

//   /**
//    * Company ID of this particular department row.
//    */
//   company_id: number | null;

//   department_name: string;

//   department_code?: string | null;

//   head_id?: number | null;

//   is_active: boolean;

//   created_by?: number | null;
//   updated_by?: number | null;

//   created_at?: string;
//   updated_at?: string;

//   employee_count?: number;

//   head?: DepartmentHead | null;

//   employees?: DepartmentEmployee[];

//   /**
//    * When departments are grouped across companies,
//    * this contains all companies to which the logical
//    * department is associated.
//    *
//    * Example:
//    * company_ids: [1, 2, 5]
//    */
//   company_ids?: number[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Stats
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;

//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Create Department
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateDepartmentDto {
//   /**
//    * Companies where this department should be created.
//    *
//    * Example:
//    * company_ids: [1, 2, 3, 5]
//    */
//   company_ids: number[];

//   department_name: string;

//   department_code?: string | null;

//   head_id?: number | null;

//   is_active?: boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Update Department
// // ─────────────────────────────────────────────────────────────────────────────

// export interface UpdateDepartmentDto {
//   /**
//    * Company from which the department is currently being edited.
//    *
//    * This is required because the same logical department
//    * can exist for multiple companies.
//    */
//   current_company_id: number;

//   /**
//    * FINAL company list for this department.
//    *
//    * Example:
//    *
//    * Existing:
//    * [1, 2, 3, 4]
//    *
//    * User unchecks company 3:
//    * [1, 2, 4]
//    *
//    * Backend should remove/soft-delete only company 3.
//    */
//   company_ids?: number[];

//   department_name?: string;

//   department_code?: string | null;

//   head_id?: number | null;

//   is_active?: boolean;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Query Params
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentQueryParams {
//   search?: string;

//   is_active?: 'true' | 'false' | 'all';

//   /**
//    * Fetch departments for one company.
//    *
//    * Example:
//    * ?company_id=1
//    */
//   company_id?: number;

//   /**
//    * Fetch departments for multiple companies.
//    *
//    * Example:
//    * ?company_ids=1&company_ids=2&company_ids=3
//    *
//    * The backend should convert this into:
//    * WHERE company_id IN (1, 2, 3)
//    */
//   company_ids?: number[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // API Service
// // ─────────────────────────────────────────────────────────────────────────────

// export const departmentService = {
//   // ───────────────────────────────────────────────────────────────────────────
//   // GET ALL DEPARTMENTS
//   // ───────────────────────────────────────────────────────────────────────────

//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', {
//       params,
//     }),

//   // ───────────────────────────────────────────────────────────────────────────
//   // GET DEPARTMENT STATS
//   // ───────────────────────────────────────────────────────────────────────────

//   getStats: (
//     params?: Pick<
//       DepartmentQueryParams,
//       'company_id' | 'company_ids'
//     >,
//   ) =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>(
//       '/departments/stats',
//       {
//         params,
//       },
//     ),

//   // ───────────────────────────────────────────────────────────────────────────
//   // GET SINGLE DEPARTMENT
//   // ───────────────────────────────────────────────────────────────────────────

//   getById: (id: number, companyId: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(
//       `/departments/${id}`,
//       {
//         params: {
//           company_id: companyId,
//         },
//       },
//     ),

//   // ───────────────────────────────────────────────────────────────────────────
//   // CREATE DEPARTMENT
//   // ───────────────────────────────────────────────────────────────────────────

//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department[]>>(
//       '/departments',
//       data,
//     ),

//   // ───────────────────────────────────────────────────────────────────────────
//   // UPDATE DEPARTMENT
//   // ───────────────────────────────────────────────────────────────────────────

//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department[]>>(
//       `/departments/${id}`,
//       data,
//     ),

//   // ───────────────────────────────────────────────────────────────────────────
//   // DELETE DEPARTMENT FROM ONE COMPANY
//   // ───────────────────────────────────────────────────────────────────────────

//   delete: (id: number, companyId: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(
//       `/departments/${id}`,
//       {
//         params: {
//           company_id: companyId,
//         },
//       },
//     ),
// };





































// import apiClient from './client';
// import type { ApiResponse } from '../../types/api.types';

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Head
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentHead {
//   id: number;
//   first_name: string;
//   last_name: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Employee
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentEmployee {
//   id: number;
//   first_name: string;
//   last_name: string;
//   employee_code: string;
//   status: string;
//   avatar_url?: string | null;
//   designation_id?: number | null;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Associated Company
// // ─────────────────────────────────────────────────────────────────────────────

// export interface AssociatedCompany {
//   id: number;
//   name: string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Entity
// // ─────────────────────────────────────────────────────────────────────────────

// export interface Department {
//   id: number;
//   department_name: string;
//   department_code?: string | null;
//   is_all_companies: boolean;
//   is_active: boolean;
//   head_id?: number | null;
//   created_by?: number | null;
//   updated_by?: number | null;
//   created_at?: string;
//   updated_at?: string;
//   deleted_at?: string | null;

//   employee_count?: number;
//   head?: DepartmentHead | null;
//   employees?: DepartmentEmployee[];

//   /**
//    * List of company IDs assigned to this department via the pivot table
//    */
//   company_ids: number[];

//   /**
//    * List of mapped Company details
//    */
//   companies: AssociatedCompany[];
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department Stats
// // ─────────────────────────────────────────────────────────────────────────────

// export interface DepartmentStats {
//   total: number;
//   active: number;
//   inactive: number;
//   largestDeptId: number | null;
//   largestDeptCount: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DTOs
// // ─────────────────────────────────────────────────────────────────────────────

// export interface CreateDepartmentDto {
//   department_name: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
// }

// export interface UpdateDepartmentDto {
//   department_name?: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: 'true' | 'false' | 'all' | boolean;
//   company_id?: number;
//   company_ids?: number[] | string;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Department API Service
// // ─────────────────────────────────────────────────────────────────────────────

// export const departmentService = {
//   /**
//    * Get all departments with optional query filters (search, active status, company IDs)
//    */
//   getAll: (params?: DepartmentQueryParams) =>
//     apiClient.get<unknown, ApiResponse<Department[]>>('/departments', {
//       params,
//     }),

//   /**
//    * Get department statistics
//    */
//   getStats: (
//     params?: Pick<DepartmentQueryParams, 'company_id' | 'company_ids'>,
//   ) =>
//     apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats', {
//       params,
//     }),

//   /**
//    * Get a single department by ID
//    */
//   getById: (id: number) =>
//     apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`),

//   /**
//    * Create a new department
//    */
//   create: (data: CreateDepartmentDto) =>
//     apiClient.post<unknown, ApiResponse<Department>>('/departments', data),

//   /**
//    * Update an existing department
//    */
//   update: (id: number, data: UpdateDepartmentDto) =>
//     apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

//   /**
//    * Soft-delete a department
//    */
//   delete: (id: number) =>
//     apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`),
// };


























import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─────────────────────────────────────────────────────────────────────────────
// Department Head
// ─────────────────────────────────────────────────────────────────────────────

export interface DepartmentHead {
  id: number;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  designation_id?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Department Employee
// ─────────────────────────────────────────────────────────────────────────────

export interface DepartmentEmployee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  status: string;
  avatar_url?: string | null;
  designation_id?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Associated Company
// ─────────────────────────────────────────────────────────────────────────────

export interface AssociatedCompany {
  id: number;
  name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Department Entity
// ─────────────────────────────────────────────────────────────────────────────

export interface Department {
  id: number;
  department_name: string;
  department_code?: string | null;
  is_all_companies: boolean;
  is_active: boolean;
  head_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;

  employee_count?: number;
  head?: DepartmentHead | null;
  employees?: DepartmentEmployee[];

  /**
   * List of company IDs assigned to this department via the pivot table
   */
  company_ids: number[];

  /**
   * List of mapped Company details
   */
  companies: AssociatedCompany[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Department Stats
// ─────────────────────────────────────────────────────────────────────────────

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  largestDeptId: number | null;
  largestDeptCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateDepartmentDto {
  department_name: string;
  department_code?: string | null;
  is_all_companies?: boolean;
  company_ids?: number[];
  head_id?: number | null;
}

export interface UpdateDepartmentDto {
  department_name?: string;
  department_code?: string | null;
  is_all_companies?: boolean;
  company_ids?: number[];
  head_id?: number | null;
  is_active?: boolean;
}

export interface DepartmentQueryParams {
  search?: string;
  is_active?: 'true' | 'false' | 'all' | boolean;
  company_id?: number;
  company_ids?: number[] | string;
}

// Helper to format company_ids array into CSV strings for GET query params
function formatQueryParams(params?: DepartmentQueryParams): Record<string, any> | undefined {
  if (!params) return undefined;
  
  const query: Record<string, any> = { ...params };

  if (Array.isArray(query.company_ids)) {
    query.company_ids = query.company_ids.join(',');
  }

  return query;
}

// ─────────────────────────────────────────────────────────────────────────────
// Department API Service
// ─────────────────────────────────────────────────────────────────────────────

export const departmentService = {
  /**
   * Get all departments with optional query filters (search, active status, company IDs)
   */
  getAll: (params?: DepartmentQueryParams) =>
    apiClient.get<unknown, ApiResponse<Department[]>>('/departments', {
      params: formatQueryParams(params),
    }),

  /**
   * Get department statistics
   */
  getStats: (
    params?: Pick<DepartmentQueryParams, 'company_id' | 'company_ids'>,
  ) =>
    apiClient.get<unknown, ApiResponse<DepartmentStats>>('/departments/stats', {
      params: formatQueryParams(params),
    }),

  /**
   * Get a single department by ID
   */
  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<Department>>(`/departments/${id}`),

  /**
   * Create a new department
   */
  create: (data: CreateDepartmentDto) =>
    apiClient.post<unknown, ApiResponse<Department>>('/departments', data),

  /**
   * Update an existing department (including adding or removing assigned companies)
   */
  update: (id: number, data: UpdateDepartmentDto) =>
    apiClient.put<unknown, ApiResponse<Department>>(`/departments/${id}`, data),

  /**
   * Soft-delete a department
   */
  delete: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/departments/${id}`),
};
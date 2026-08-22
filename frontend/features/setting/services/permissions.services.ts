import apiClient from '../../../services/api/client';
import type { ApiResponse } from '../../../types/api.types';
import { PermGroup } from '../types/permissions.types';

// ─── Existing API layer (unchanged) ───────────────────────────────────────────
export const pgApi = {
  list: () => apiClient.get<unknown, ApiResponse<PermGroup[]>>('/permission-groups'),
  create: (d: any) => apiClient.post<unknown, ApiResponse<PermGroup>>('/permission-groups', d),
  update: (id: number, d: any) => apiClient.put<unknown, ApiResponse<PermGroup>>(`/permission-groups/${id}`, d),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}`),
  getPerms: (id: number, companyId?: number) => apiClient.get<unknown, ApiResponse<string[]>>(`/permission-groups/${id}/permissions${companyId ? `?company_id=${companyId}` : ''}`),
  setPerms: (id: number, slugs: string[], companyIds: number[]) => apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${id}/permissions`, { slugs, companyIds }),
  getMembers: (id: number) => apiClient.get<unknown, ApiResponse<any[]>>(`/permission-groups/${id}/members`),
  addMember: (id: number, uid: number, companyIds?: number[]) => apiClient.post<unknown, ApiResponse<any>>(`/permission-groups/${id}/members`, { employee_id: uid, company_ids: companyIds }),
  removeMember: (id: number, companyId: number, uid: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}/members/${uid}?company_id=${companyId}`),
  seed: () => apiClient.post<unknown, ApiResponse<any>>('/permission-groups/seed', {}),
  employees: () => apiClient.get<unknown, ApiResponse<any[]>>('/employees/managed'),
  setOverrides: (groupId: number, employeeId: number, companyIds: number[], overrides: { module: string; field_name: null; permission: string; granted: boolean }[]) => apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${groupId}/members/${employeeId}/overrides`, { company_ids: companyIds, overrides }),
  getOverrides: (groupId: number, employeeId: number, companyId: number) => apiClient.get<unknown, ApiResponse<{ module: string; permission: string; granted: boolean }[]>>(`/permission-groups/${groupId}/members/${employeeId}/overrides?company_id=${companyId}`),
  deleteOverride: (groupId: number, employeeId: number, overrideId: number) => apiClient.delete(`/permission-groups/${groupId}/members/${employeeId}/overrides/${overrideId}`),
  resolveMyFieldPermissions: (formId: number) => apiClient.get<unknown, ApiResponse<Record<string, { can_view: boolean; can_edit: boolean; can_copy: boolean; can_download: boolean; is_masked: boolean }>>>(`/field-permissions/forms/${formId}/resolve`),
  listModules: () => apiClient.get<unknown, ApiResponse<any[]>>('/rbac/modules/catalog'),
  listForms: (moduleId: number) => apiClient.get<unknown, ApiResponse<any[]>>(`/rbac/modules/${moduleId}/forms`),
  fieldPermissionMatrix: (formId: number, companyId: number) => apiClient.get<unknown, ApiResponse<{ groups: any[]; fields: any[]; matrix: Record<number, Record<number, any>> }>>(`/rbac/forms/${formId}/permission-matrix?company_id=${companyId}`),
  groupFieldPermissions: (formId: number, groupId: number, companyId: number) =>
    apiClient.get<unknown, ApiResponse<{ fields: any[]; perms: Record<number, any> }>>(
      `/rbac/forms/${formId}/groups/${groupId}/permissions?company_id=${companyId}`
    ),
  setFieldPermission: (fieldId: number, groupId: number, companyId: number, dto: any) => apiClient.put<unknown, ApiResponse<any>>(`/rbac/fields/${fieldId}/permissions`, { group_id: groupId, company_ids: [companyId], ...dto }),
  bulkSetFieldPermissions: (groupId: number, companyIds: number[], permissions: any[]) => apiClient.post<unknown, ApiResponse<any>>('/rbac/permissions/bulk', { group_id: groupId, company_ids: companyIds, permissions }),
  listFieldOverrides: (groupId: number, employeeId: number, companyId: number, module: string) =>
    apiClient.get<unknown, ApiResponse<Record<string, Record<string, boolean>>>>(
      `/permission-groups/${groupId}/members/${employeeId}/field-overrides?company_id=${companyId}&module=${module}`
    ),
  setFieldOverrides: (groupId: number, employeeId: number, companyIds: number[], module: string, overrides: { field_name: string; permission: string; granted: boolean }[]) =>
    apiClient.put<unknown, ApiResponse<any>>(
      `/permission-groups/${groupId}/members/${employeeId}/field-overrides`,
      { company_ids: companyIds, module, overrides }
    ),
  groupCompanyScope: (groupId: number) =>
    apiClient.get<unknown, ApiResponse<number[]>>(`/rbac/groups/${groupId}/company-scope`),
  companyModules: (companyId?: number) =>
    apiClient.get<unknown, ApiResponse<{ module: string; label: string }[]>>(
      `/permission-groups/company-modules${companyId ? `?company_id=${companyId}` : ''}`),
  // NEW — modules actually enabled for ONE specific company, sourced from our
  // HrModule/ModuleCompany catalog (NOT the old CompanyModule table above).
  // This is what company badges and sidebar visibility should use — the old
  // `companyModules` above stays only for whatever still legitimately reads
  // the old on/off toggle table; don't repoint it, add alongside it instead.
  companyEnabledModules: (companyId: number) =>
    apiClient.get<unknown, ApiResponse<any[]>>(`/rbac/modules?company_id=${companyId}`),
};
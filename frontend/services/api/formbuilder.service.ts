import apiClient from './client';

export const formbuilderapi = {
  modules: () => apiClient.get<any, any>('/rbac/modules'),
  createModule: (d: any) => apiClient.post<any, any>('/rbac/modules', d),
  updateModule: (id: number, d: any) => apiClient.put<any, any>(`/rbac/modules/${id}`, d),
  deleteModule: (id: number) => apiClient.delete<any, any>(`/rbac/modules/${id}`),
  forms: (mId: number) => apiClient.get<any, any>(`/rbac/modules/${mId}/forms`),
  createForm: (mId: number, d: any) => apiClient.post<any, any>(`/rbac/modules/${mId}/forms`, d),
  updateForm: (id: number, d: any) => apiClient.put<any, any>(`/rbac/forms/${id}`, d),
  deleteForm: (id: number) => apiClient.delete<any, any>(`/rbac/forms/${id}`),
  formDetail: (id: number) => apiClient.get<any, any>(`/rbac/forms/${id}`),
  createField: (fId: number, d: any) => apiClient.post<any, any>(`/rbac/forms/${fId}/fields`, d),
  updateField: (id: number, d: any) => apiClient.put<any, any>(`/rbac/fields/${id}`, d),
  deleteField: (id: number) => apiClient.delete<any, any>(`/rbac/fields/${id}`),
  reorder: (fId: number, order: any) => apiClient.put<any, any>(`/rbac/forms/${fId}/reorder`, { order }),
  matrix: (fId: number) => apiClient.get<any, any>(`/rbac/forms/${fId}/permission-matrix`),
  bulkPerm: (fId: number, rId: number, perms: any) => apiClient.post<any, any>('/rbac/permissions/bulk', { role_id: rId, permissions: perms }),
  roles: () => apiClient.get<any, any>('/rbac/roles'),
  dynSource: (src: string) => apiClient.get<any, any>(`/rbac/dynamic-source/${src}`),
};
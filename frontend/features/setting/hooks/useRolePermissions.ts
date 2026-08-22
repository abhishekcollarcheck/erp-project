import { useQuery, useQueries } from '@tanstack/react-query';
import { pgApi } from '../services/permissions.services';
import type { Form, Module, ModuleDef } from '../types/permissions.types';

export function useGroups() {
  return useQuery({ queryKey: ['rp', 'groups'], queryFn: () => pgApi.list(), staleTime: 0, select: r => r.data ?? [] });
}
export function useGroupPerms(id: number, companyId?: number) {
  return useQuery({
    queryKey: ['rp', 'group-perms', id, companyId],
    queryFn: () => pgApi.getPerms(id, companyId),
    enabled: id > 0,
    select: r => r.data ?? [],
  });
}
export function useEmployees() {
  return useQuery({ queryKey: ['employees-light'], queryFn: () => pgApi.employees(), staleTime: 5 * 60_000, select: r => r.data ?? [] });
}

export function useEmployeeOverrides(groupId: number, employeeId: number | undefined, companyId: number | undefined) {
  return useQuery({
    queryKey: ['rp', 'employee-overrides', groupId, employeeId, companyId],
    queryFn: () => pgApi.getOverrides(groupId, employeeId!, companyId!),
    enabled: groupId > 0 && !!employeeId && !!companyId,
    select: r => r.data ?? [],
    refetchOnMount: true,
  });
}

export function useGroupFieldPermissionMatrix(formId: number, companyId: number) {
  return useQuery({
    queryKey: ['field-perm-matrix', formId, companyId],
    queryFn: () => pgApi.fieldPermissionMatrix(formId, companyId),
    enabled: formId > 0 && companyId > 0,
    select: r => r.data,
  });
}

export function useGroupFieldPermissions(formId: number, groupId: number, companyId: number) {
  return useQuery({
    queryKey: ['group-field-perms', formId, groupId, companyId],
    queryFn: () => pgApi.groupFieldPermissions(formId, groupId, companyId),
    enabled: formId > 0 && groupId > 0 && companyId > 0,
    select: r => r.data,
  });
}

export function useModuleList() {
  return useQuery({
    queryKey: ['rp', 'company-modules'],
    queryFn: () => pgApi.listModules(),
    staleTime: 5 * 60_000,
    select: (r: any): ModuleDef[] =>
      ((r.data ?? []) as any[]).map(m => ({ key: m.permission_key ?? m.slug, label: m.name })),
  });
}

export function useHrModules() {
  return useQuery({
    queryKey: ['field-perm-modules'],
    queryFn: () => pgApi.listModules(),
    select: (r: any): Module[] => r.data ?? [],
    staleTime: 5 * 60_000,
  });
}

export function useAllModuleForms(modules: Module[], enabled = true) {
  return useQueries({
    queries: modules.map(module => ({
      queryKey: ['field-perm-forms', module.id],
      queryFn: () => pgApi.listForms(module.id),
      enabled: enabled && modules.length > 0,
      select: (r: any): Form[] => (Array.isArray(r.data) ? r.data : []),
    })),
  });
}

export function useEmployeeFieldOverrides(groupId: number, employeeId: number | undefined, companyId: number | undefined, module: string) {
  return useQuery({
    queryKey: ['field-overrides', groupId, employeeId, companyId, module],
    queryFn: () => pgApi.listFieldOverrides(groupId, employeeId!, companyId!, module),
    enabled: !!employeeId && !!companyId && groupId > 0 && !!module,
    select: r => r.data ?? {},
    staleTime: 0,
  });
}
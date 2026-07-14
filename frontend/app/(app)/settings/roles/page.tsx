'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { updateToken, setPermissions, selectManagedCompanies } from '../../../../store/slices/authSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Modal } from '../../../../components/ui/Modal';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { showToast } from '../../../../utils/toast';
import apiClient from '../../../../services/api/client';
import type { ApiResponse } from '../../../../types/api.types';
import { Eye, SquarePen, Trash2, Download, Pen } from 'lucide-react';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { PageHeaderWithCompany, useCompanySelector } from '../../../../components/company/CompanySelector';
import { PermissionGuard } from '../../../../utils/permissionGuard';
import { useCompanyModulesMap } from '../../../../hooks/useCompanyModulesMap';
import { useFieldPermissions } from '../../../../features/employees/hooks/useEmployees';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'groups' | 'edit';

interface PermGroup {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  is_system: boolean;
  is_active: boolean;
  member_count: number;
  permissions?: { id: number; slug: string; module: string; action: string }[];
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  designation?: string;
  user?: { id: number; email: string };
}

// ─── New UI: Module definitions with sections ─────────────────────────────────
// Matches the HTML matrix exactly — 4 sections, 16 modules

// Only the 6 modules that exist in the project.
// employees is the only module whose permissions can be modified per employee.
const MODULE_SECTIONS = [
  {
    label: 'Modules',
    modules: [
      { key: 'recruitment', label: 'Recruitment / ATS' },
      { key: 'aptitude', label: 'Aptitude Test' },
      { key: 'employees', label: 'Employee Directory' },
      { key: 'department', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'settings', label: 'Settings & RBAC' },
    ],
  },
];


// Flat list for helpers
const MODULES = MODULE_SECTIONS.flatMap(s => s.modules);

// Only module-level permissions (field-level is separate)
const PERMS = ['view', 'create', 'edit', 'delete', 'download'] as const;
type Perm = typeof PERMS[number];

const PERM_ICONS: Record<string, React.ReactNode> = {
  view: <Eye size={13} />,
  create: <Pen size={13} />,
  edit: <SquarePen size={13} />,
  delete: <Trash2 size={13} />,
  download: <Download size={13} />,
};
const PERM_LABELS: Record<string, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', download: 'Download',
};

type ModulePerms = Record<string, Record<string, boolean>>;

const COLOR_OPTS = [
  { key: 'blue', css: 'var(--blue)' },
  { key: 'green', css: 'var(--green)' },
  { key: 'purple', css: 'var(--purple)' },
  { key: 'amber', css: 'var(--amber)' },
  { key: 'red', css: 'var(--red)' },
  { key: 'teal', css: 'var(--teal)' },
  { key: 'pink', css: 'var(--pink, #c0265e)' },
];

function cssForKey(key: string | null | undefined) {
  return COLOR_OPTS.find(c => c.key === key)?.css || key || 'var(--blue)';
}


// ─── Existing API layer (unchanged) ───────────────────────────────────────────

const pgApi = {
  list: () => apiClient.get<unknown, ApiResponse<PermGroup[]>>('/permission-groups'),
  create: (d: any) => apiClient.post<unknown, ApiResponse<PermGroup>>('/permission-groups', d),
  update: (id: number, d: any) => apiClient.put<unknown, ApiResponse<PermGroup>>(`/permission-groups/${id}`, d),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}`),
  getPerms: (id: number) => apiClient.get<unknown, ApiResponse<string[]>>(`/permission-groups/${id}/permissions`),
  setPerms: (id: number, slugs: string[]) => apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${id}/permissions`, { slugs }),
  getMembers: (id: number) => apiClient.get<unknown, ApiResponse<any[]>>(`/permission-groups/${id}/members`),
  addMember: (id: number, uid: number, companyIds?: number[]) => apiClient.post<unknown, ApiResponse<any>>(`/permission-groups/${id}/members`, { employee_id: uid, company_ids: companyIds }),
  removeMember: (id: number, companyId: number, uid: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}/members/${uid}?company_id=${companyId}`),
  seed: () => apiClient.post<unknown, ApiResponse<any>>('/permission-groups/seed', {}),
  employees: () => apiClient.get<unknown, ApiResponse<any[]>>('/employees/managed'),
  setOverrides: (groupId: number, employeeId: number, companyIds: number[], overrides: { module: string; field_name: null; permission: string; granted: boolean }[]) => apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${groupId}/members/${employeeId}/overrides`, { company_ids: companyIds, overrides }),
  getOverrides: (groupId: number, employeeId: number, companyId: number) => apiClient.get<unknown, ApiResponse<{ module: string; permission: string; granted: boolean }[]>>(`/permission-groups/${groupId}/members/${employeeId}/overrides?company_id=${companyId}`),
  deleteOverride: (groupId: number, employeeId: number, overrideId: number) => apiClient.delete(`/permission-groups/${groupId}/members/${employeeId}/overrides/${overrideId}`),
  resolveMyFieldPermissions: (formId: number) => apiClient.get<unknown, ApiResponse<Record<string, { can_view: boolean; can_edit: boolean; can_copy: boolean; can_download: boolean; is_masked: boolean }>>>(`/field-permissions/forms/${formId}/resolve`),
  listModules: () => apiClient.get<unknown, ApiResponse<any[]>>('/rbac/modules'),
  listForms: (moduleId: number) => apiClient.get<unknown, ApiResponse<any[]>>(`/rbac/modules/${moduleId}/forms`),
  fieldPermissionMatrix: (formId: number, companyId: number) => apiClient.get<unknown, ApiResponse<{ groups: any[]; fields: any[]; matrix: Record<number, Record<number, any>> }>>(`/rbac/forms/${formId}/permission-matrix?company_id=${companyId}`),
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
};

// Existing hooks (unchanged)
function useGroups() { return useQuery({ queryKey: ['rp', 'groups'], queryFn: () => pgApi.list(), staleTime: 0, select: r => r.data ?? [] }); }
function useGroupPerms(id: number) { return useQuery({ queryKey: ['rp', 'group-perms', id], queryFn: () => pgApi.getPerms(id), enabled: id > 0, select: r => r.data ?? [] }); }
function useGroupMembers(id: number) { return useQuery({ queryKey: ['rp', 'group-members', id], queryFn: () => pgApi.getMembers(id), enabled: id > 0, select: r => r.data ?? [] }); }
function useEmployees() { return useQuery({ queryKey: ['employees-light'], queryFn: () => pgApi.employees(), staleTime: 5 * 60_000, select: r => r.data ?? [] }); }
function useEmployeeOverrides(groupId: number, employeeId: number | undefined, companyId: number | undefined) {
  return useQuery({
    queryKey: ['rp', 'employee-overrides', groupId, employeeId, companyId],
    queryFn: () => pgApi.getOverrides(groupId, employeeId!, companyId!),
    enabled: groupId > 0 && !!employeeId && !!companyId,
    select: r => r.data ?? [],
    refetchOnMount: true,
  });
}

function useGroupFieldPermissionMatrix(formId: number, companyId: number) {
  return useQuery({
    queryKey: ['field-perm-matrix', formId, companyId],
    queryFn: () => pgApi.fieldPermissionMatrix(formId, companyId),
    enabled: formId > 0 && companyId > 0,
    select: r => r.data,
  });
}

function useEmployeeModuleForms(moduleId: number) {
  return useQuery({
    queryKey: ['field-perm-forms', moduleId],
    queryFn: () => pgApi.listForms(moduleId),
    enabled: moduleId > 0,
    select: r => r.data ?? [],
  });
}

function useEmployeeFieldOverrides(groupId: number, employeeId: number | undefined, companyId: number | undefined, module: string) {
  return useQuery({
    queryKey: ['field-overrides', groupId, employeeId, companyId, module],
    queryFn: () => pgApi.listFieldOverrides(groupId, employeeId!, companyId!, module),
    enabled: !!employeeId && !!companyId && groupId > 0,
    select: r => r.data ?? {},
    staleTime: 0,
  });
}

// ─── Existing slug ↔ modPerms helpers (unchanged) ────────────────────────────

function initModulePerms(on = false): ModulePerms {
  const out: ModulePerms = {};
  for (const m of MODULES) {
    out[m.key] = {};
    for (const p of PERMS) out[m.key][p] = on;
  }
  return out;
}

function countPerm(mp: ModulePerms, perm: string) {
  return MODULES.filter(m => mp[m.key]?.[perm]).length;
}

function slugsToModulePerms(slugs: string[]): ModulePerms {
  const mp = initModulePerms(false);
  for (const slug of slugs) {
    const [mod, action] = slug.split(':');
    if (mp[mod] && action) mp[mod][action] = true;
  }
  return mp;
}

function modulePermsToSlugs(mp: ModulePerms): string[] {
  const out: string[] = [];
  for (const m of MODULES) {
    for (const p of PERMS) {
      if (mp[m.key]?.[p]) out.push(`${m.key}:${p}`);
    }
  }
  return out;
}

// ─── NEW UI: PermToggle (from new design) ─────────────────────────────────────

function PermToggle({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: `1px solid ${on ? 'var(--blue)' : 'var(--border2)'}`,
        background: on ? 'var(--blue-lt)' : 'var(--surface2)',
        color: on ? 'var(--blue)' : 'var(--ink4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all .1s', margin: '0 auto', userSelect: 'none',
      }}
    >
      {on ? '✓' : ''}
    </div>
  );
}

// ─── NEW UI: Avatar ───────────────────────────────────────────────────────────

function Avatar({ name, size = 24, fontSize = 8 }: { name: string; size?: number; fontSize?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── NEW UI: Left sidebar group list ─────────────────────────────────────────

function GroupSidebar({
  groups, selectedId, onSelect, onNew, membersMap,
}: {
  groups: PermGroup[];
  selectedId: number | null;
  onSelect: (g: PermGroup) => void;
  onNew: () => void;
  membersMap: Record<number, any[]>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map(g => {
        const isActive = g.id === selectedId;
        const count = membersMap[g.id]?.length ?? g.member_count;
        return (
          <div
            key={g.id}
            onClick={() => onSelect(g)}
            style={{
              cursor: 'pointer', background: isActive ? 'var(--blue-lt)' : 'var(--surface)',
              border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 'var(--r2)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all .1s',
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: cssForKey(g.color), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1 }}>{count} member{count !== 1 ? 's' : ''}</div>
            </div>
            {isActive && <span style={{ color: 'var(--blue)', fontSize: 13 }}>❯</span>}
          </div>
        );
      })}
      <button className="btn btn-sec btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={onNew}>
        + New Group
      </button>
    </div>
  );
}

// ─── AddPersonForm — company-chip multi-select + employee search ─────────────

function AddPersonForm({ notMembers, search, setSearch, assignedCompanies, onAdd }: {
  notMembers: any[];
  search: string;
  setSearch: (s: string) => void;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  onAdd: (empId: number, companyIds: number[]) => void;
}) {
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<Set<number>>(new Set());
  const [allCompanies, setAllCompanies] = useState(false);

  const toggleChip = (id: number) => {
    setAllCompanies(false);
    setSelectedCompanies(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setAllCompanies(v => !v);
    setSelectedCompanies(new Set());
  };

  const chipStyle = (active: boolean, purple?: boolean): React.CSSProperties => ({
    cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
    transition: 'all .1s', userSelect: 'none',
    border: active ? `1px solid ${purple ? 'var(--purple)' : 'var(--blue)'}` : '1px solid var(--border2)',
    background: active ? (purple ? 'var(--purple-lt, #f3e8ff)' : 'var(--blue-lt)') : 'var(--surface)',
    color: active ? (purple ? 'var(--purple)' : 'var(--blue)') : 'var(--ink3)',
  });

  const handleAdd = () => {
    if (!selectedEmp) return;
    const ids = allCompanies ? assignedCompanies.map(c => c.id) : [...selectedCompanies];
    onAdd(selectedEmp, ids);
    setSelectedEmp(null);
    setSelectedCompanies(new Set());
    setAllCompanies(false);
    setSearch('');
  };

  const canAdd = selectedEmp && (allCompanies || selectedCompanies.size > 0);

  return (
    <div style={{ marginBottom: 12, padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>

      {/* Employee search + select */}
      <div className="fg" style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 4, display: 'block' }}>Employee</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', marginBottom: 6 }}>
          <span style={{ color: 'var(--ink4)', fontSize: 14 }}>⌕</span>
          <input type="text" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} autoFocus
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--ink)', width: '100%', fontFamily: 'var(--font)' }} />
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notMembers.slice(0, 20).map((e: any) => {
            const eName = `${e.first_name} ${e.last_name}`;
            const isSelected = selectedEmp === e.id;
            return (
              <div key={e.id} onClick={() => setSelectedEmp(isSelected ? null : e.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 'var(--r)', cursor: 'pointer', background: isSelected ? 'var(--blue-lt)' : 'transparent', border: isSelected ? '1px solid var(--blue-md)' : '1px solid transparent' }}>
                <Avatar name={eName} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--blue)' : 'var(--ink)' }}>{eName}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink4)' }}>
                    {e.employee_code}
                    {e.company_id && assignedCompanies.find(c => c.id === e.company_id) && (
                      <span style={{ marginLeft: 5, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 600, color: 'var(--ink3)' }}>
                        {assignedCompanies.find(c => c.id === e.company_id)?.shortName}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <span style={{ fontSize: 11, color: 'var(--blue)' }}>✓</span>}
              </div>
            );
          })}
          {notMembers.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink4)', textAlign: 'center', padding: '10px 0' }}>No matching employees</div>}
        </div>
      </div>

      {/* Company scope chips */}
      <div className="fg" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6, display: 'block' }}>Company Scope</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {assignedCompanies.map(co => (
            <span key={co.id} onClick={() => toggleChip(co.id)}
              style={chipStyle(!allCompanies && selectedCompanies.has(co.id))}>
              {co.name}
            </span>
          ))}
          <span onClick={toggleAll} style={chipStyle(allCompanies, true)}>
            🌐 All companies (incl. future)
          </span>
        </div>
      </div>

      <button className="btn btn-pri btn-sm" onClick={handleAdd} disabled={!canAdd}
        style={{ opacity: canAdd ? 1 : 0.5 }}>
        ✓ Add to Group
      </button>
    </div>
  );
}

// ─── MemberCompanyBadges — shows which company the member belongs to ──────────

function MemberCompanyBadges({ member, assignedCompanies, onRemoveCompany }: {
  member: any;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  onRemoveCompany: (companyId: number) => void;
}) {
  if (!member.assigned_company_ids?.length) return null;
  // const availableToAdd = assignedCompanies.filter(co => !member.assigned_company_ids.includes(co.id))

  const companies = member.assigned_company_ids
    .map((id: number) => assignedCompanies.find(ac => ac.id === id))
    .filter(Boolean) as { id: number; name: string; shortName: string }[];

  if (!companies.length) return null;

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 }}>
      {companies.map(c => (
        <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 6px 2px 9px', fontSize: 10, fontWeight: 600, color: 'var(--ink3)' }} title={c.name}>
          {c.shortName}
          <span
            onClick={(e) => { e.stopPropagation(); onRemoveCompany(c.id); }}
            style={{ cursor: 'pointer', color: 'var(--ink4)', fontWeight: 700, padding: '0 2px' }}
            title={`Remove from ${c.name}`}
          >
            ✕
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── NEW UI: Right detail panel for selected group ────────────────────────────

function GroupDetail({
  group, members, onEdit, onFieldPerms, onDelete,
  addPersonOpen, setAddPersonOpen,
  onAddMember, onRemoveMember, employees, assignedCompanies,
  overrides, onToggleOverrides, onEditOverride, onDeleteOverride,
}: {
  group: PermGroup;
  members: any[];
  onEdit: () => void;
  onFieldPerms: () => void;
  onDelete: () => void;
  addPersonOpen: boolean;
  setAddPersonOpen: (v: boolean) => void;
  onAddMember: (empId: number, companyIds: number[]) => void;
  onRemoveMember: (empId: number) => void;
  employees: any[];
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrides: Record<string, boolean>;
  onToggleOverrides: (memberId: number) => void;
  onEditOverride: (memberId: number) => void;
  onDeleteOverride: (
    memberId: number,
    overrideId: number
  ) => void;
}) {
  const slugs = group.permissions?.map(p => p.slug) || [];
  const modPerms = slugsToModulePerms(slugs);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const [addCompanyFor, setAddCompanyFor] = useState<number | null>(null);
  const [selectedNewCompanies, setSelectedNewCompanies] = useState<Set<number>>(new Set());

  const permSummary = useMemo(() =>
    PERMS.map(p => ({ p, count: countPerm(modPerms, p) })).filter(x => x.count > 0),
    [slugs.join(',')]
  );
  const notMembers = useMemo(() => {
    const memberIds = new Set(members.map((m: any) => m.id));
    return employees.filter((e: any) => !memberIds.has(e.id) && (
      !search || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
    ));
  }, [employees, members, search]);

  const memberCompanyPairs = useMemo(() =>
    members.flatMap((m: any) =>
      (m.assigned_company_ids || []).map((cid: number) => ({ memberId: m.id, companyId: cid }))
    ),
    [members]
  );

  const overrideQueries = useQueries({
    queries: memberCompanyPairs.map(({ memberId, companyId }) => ({
      queryKey: ['group-overrides', group?.id, memberId, companyId],
      queryFn: () => pgApi.getOverrides(group!.id, memberId, companyId),
      enabled: !!group && overrides[memberId] === true,
    })),
  });

  const memberOverridesMap = useMemo(() => {
    const map: Record<number, Record<number, any[]>> = {};
    memberCompanyPairs.forEach((pair, idx) => {
      if (!map[pair.memberId]) map[pair.memberId] = {};
      map[pair.memberId][pair.companyId] = overrideQueries[idx]?.data?.data || [];
    });
    return map;
  }, [memberCompanyPairs, overrideQueries]);

  const deleteModuleOverridesMutation = useMutation({
    mutationFn: async ({ memberId, companyId, overrideIds }: { memberId: number; companyId: number; overrideIds: number[] }) => {
      await Promise.all(overrideIds.map((overrideId) => pgApi.deleteOverride(group!.id, memberId, overrideId)));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['group-overrides', group!.id, vars.memberId, vars.companyId] });
      showToast('✓ Override removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed to remove override'),
  });

  const OVERRIDE_PERMISSION_ORDER = [
    'view',
    'create',
    'edit',
    'delete',
    'download',
  ] as const;

  const removeMemberCompanyMutation = useMutation({
    mutationFn: async ({ empId, companyId }: { empId: number; companyId: number }) => {
      await pgApi.removeMember(group.id, companyId, empId);
    },
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast('✓ Company removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const handleRemoveCompany = (member: any, companyId: number) => {
    const isLastCompany = (member.assigned_company_ids?.length || 0) <= 1;
    const companyName = assignedCompanies.find(c => c.id === companyId)?.name || 'this company';
    const confirmMsg = isLastCompany
      ? `This is ${member.first_name}'s only company in this group — removing it will remove them from the group entirely. Continue?`
      : `Remove ${member.first_name} from ${companyName} for this group?`;
    if (window.confirm(confirmMsg)) {
      removeMemberCompanyMutation.mutate({ empId: member.id, companyId });
    }
  };

  const { data: groupSlugs = [] } = useGroupPerms(group.id);
const groupBaseModPerms = useMemo(() => slugsToModulePerms(groupSlugs), [groupSlugs]);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: cssForKey(group.color), flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{group.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 2 }}>{group.description || 'No description'}</div>
        </div>
        <button className="btn btn-sec btn-sm" onClick={onEdit}>✎ Edit Permissions</button>
        {/* <button className="btn btn-sec btn-sm" onClick={onFieldPerms} title="Field Permissions">☷</button> */}
        {!group.is_system && (
          <button className="btn btn-sec btn-sm" onClick={onDelete} style={{ color: 'var(--red)' }}>🗑</button>
        )}
      </div>

      {/* Permission summary */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', marginBottom: 8 }}>Permission Summary</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {permSummary.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>None assigned</span>
          ) : permSummary.map(({ p, count }) => (
            <span key={p} title={`${PERM_LABELS[p]}: ${count} modules`}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: 'var(--ink3)', borderRadius: 99 }}>
              {PERM_ICONS[p]} {count}
            </span>
          ))}
        </div>
      </div>

      {/* Members */}
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)' }}>
            Members ({members.length})
          </div>
          <button className="btn btn-sec btn-sm" onClick={() => setAddPersonOpen(!addPersonOpen)}>
            {addPersonOpen ? '✕ Cancel' : '+ Add Person'}
          </button>
        </div>

        {/* Add person picker — with company multi-select chips */}
        {addPersonOpen && (
          <AddPersonForm
            notMembers={notMembers}
            search={search}
            setSearch={setSearch}
            assignedCompanies={assignedCompanies}
            onAdd={onAddMember}
          />
        )}

        {/* Member rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m: any) => {
            const name = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            const memberId = m.id;
            const showOvrd = overrides[memberId] === true;
            const overridesByCompany = memberOverridesMap[memberId] || {};
            const groupedOverridesByCompany = Object.entries(overridesByCompany).map(([companyIdStr, rows]) => {
              const companyId = Number(companyIdStr);
              const co = assignedCompanies.find(c => c.id === companyId);
              const grouped = Object.values(
                (rows as any[]).reduce((acc: any, row: any) => {
                  if (!acc[row.module]) {
                    acc[row.module] = { module: row.module, overrideIds: [], changes: [] };
                  }
                  acc[row.module].overrideIds.push(row.id);
                  acc[row.module].changes.push({
  permission: row.permission,
  previous: !!groupBaseModPerms[row.module]?.[row.permission],
  current: row.granted,
});
                  console.log(acc[row.module].changes);
                  return acc;
                }, {})
              );
              return { companyId, companyName: co?.name || `Company ${companyId}`, modules: grouped };
            });

            const memberAssignedIds = new Set(m.assigned_company_ids || []);
            const availableToAdd = assignedCompanies.filter((co) => !memberAssignedIds.has(co.id));
            return (
              <div key={memberId} id={`rp-mrow-${memberId}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={name} size={30} fontSize={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{m.designation || m.employee_code}</div>
                  </div>
                  {/* Company badge — shows member's home company */}
                  <MemberCompanyBadges member={m} assignedCompanies={assignedCompanies} onRemoveCompany={(companyId) => handleRemoveCompany(m, companyId)} />

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onToggleOverrides(memberId)}
                    title="View permission overrides"
                    style={{ fontSize: 11 }}
                  >
                    ☷ Overrides
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRemoveMember(memberId)}
                    style={{ color: 'var(--red)', fontSize: 11 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>

                {/* Inline override panel */}
                {showOvrd && (
                  <div style={{ margin: '6px 0 10px 38px', padding: '12px 14px', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                      ☷ Permission overrides for {name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 10 }}>
                      These exceptions apply only to {m.first_name} — everyone else in <strong>{group.name}</strong> keeps the group's default permissions.
                    </div>
                    {groupedOverridesByCompany.map(({ companyId, companyName, modules }) => (
                      modules.length > 0 && (
                        <div key={companyId} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                            {companyName}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {modules.map((mod: any) => (
                              <div key={mod.module} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                    {MODULES.find((x: any) => x.key === mod.module)?.label || mod.module}
                                  </div>
                                  <div style={{ color: 'var(--ink3)', marginTop: 2 }}>
                                    {mod.changes.map((c: any, idx: number) => (
                                      <span key={c.permission}>
                                        <strong style={{ textTransform: 'capitalize' }}>{c.permission}</strong>
                                        {': '}
                                        <span style={{ color: c.previous ? 'var(--green)' : 'var(--red)' }}>
                                          {c.previous ? 'allowed' : 'denied'}
                                        </span>
                                        {' → '}
                                        <span style={{ color: c.current ? 'var(--green)' : 'var(--red)' }}>
                                          {c.current ? 'allowed' : 'denied'}
                                        </span>
                                        {idx < mod.changes.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ fontSize: 10 }}
                                  onClick={() => onEditOverride(memberId)}
                                  title="Edit this override"
                                >
                                  ✎
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--red)' }}
                                  onClick={() => { deleteModuleOverridesMutation.mutate({ memberId, companyId, overrideIds: mod.overrideIds }); }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    {availableToAdd.length > 0 && (
                      <button
                        className="btn btn-sec btn-sm"
                        style={{ fontSize: 11, marginLeft: 6 }}
                        onClick={() => {
                          const next = addCompanyFor === memberId ? null : memberId;
                          setAddCompanyFor(next);
                          setSelectedNewCompanies(new Set());   // ← naya: har baar fresh state
                        }}
                      >
                        {addCompanyFor === memberId ? '✕ Cancel' : '+ Add Company'}
                      </button>
                    )}

                    {addCompanyFor === memberId && (
                      <div style={{ marginTop: 8, padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6 }}>
                          Select companies to add:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {availableToAdd.map((co) => {
                            const isSelected = selectedNewCompanies.has(co.id);
                            return (
                              <span
                                key={co.id}
                                onClick={() => {
                                  setSelectedNewCompanies(prev => {
                                    const n = new Set(prev);
                                    isSelected ? n.delete(co.id) : n.add(co.id);
                                    return n;
                                  });
                                }}
                                style={{
                                  cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                  border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border2)',
                                  background: isSelected ? 'var(--blue-lt)' : 'var(--surface2)',
                                  color: isSelected ? 'var(--blue)' : 'var(--ink3)',
                                }}
                              >
                                {co.name}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          className="btn btn-pri btn-sm"
                          disabled={selectedNewCompanies.size === 0}
                          style={{ opacity: selectedNewCompanies.size === 0 ? 0.5 : 1 }}
                          onClick={() => {
                            onAddMember(memberId, [...selectedNewCompanies]);
                            setAddCompanyFor(null);
                            setSelectedNewCompanies(new Set());
                          }}
                        >
                          ✓ Add Selected
                        </button>
                      </div>
                    )}
                    <button className="btn btn-sec btn-sm" onClick={() => onEditOverride(memberId)} style={{ fontSize: 11 }}>
                      + Edit Override
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink4)', fontStyle: 'italic', padding: '10px 0' }}>No members yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEW UI: Module matrix with "All" toggle col and section grouping ─────────

function ModuleMatrix({ modPerms, onChange, isOverrideMode = false, moduleCompanyMap, assignedCompanies, overrideTargetCompanyIds }: {
  modPerms: ModulePerms;
  onChange: (mp: ModulePerms) => void;
  isOverrideMode?: boolean;
  moduleCompanyMap: Record<string, { label: string; companies: any[] }>;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrideTargetCompanyIds?: number[];
}) {
  const [companyFilter, setCompanyFilter] = useState<number | 'all'>('all');
  const toggle = (mod: string, perm: string) => {
    const current = modPerms[mod] || {};

    const next = {
      ...current,
      [perm]: !current[perm],
    };

    // Any permission except View automatically enables View
    if (
      perm !== 'view' &&
      next[perm]
    ) {
      next.view = true;
    }

    // Turning View OFF removes every dependent permission
    if (
      perm === 'view' &&
      !next.view
    ) {
      next.create = false;
      next.edit = false;
      next.delete = false;
      next.download = false;
    }

    onChange({
      ...modPerms,
      [mod]: next,
    });
  };

  const toggleRow = (modKey: string) => {
    const current = modPerms[modKey] || {};

    const allEnabled = PERMS.every(p => current[p]);

    let next: Record<string, boolean>;

    if (allEnabled) {
      // Turn everything OFF
      next = {
        view: false,
        create: false,
        edit: false,
        delete: false,
        download: false,
      };
    } else {
      // Turn everything ON
      next = {
        view: true,
        create: true,
        edit: true,
        delete: true,
        download: true,
      };
    }

    onChange({
      ...modPerms,
      [modKey]: next,
    });
  };

  const setAll = (on: boolean) => {
    const next = initModulePerms(false);
    for (const m of MODULES) { next[m.key] = {}; for (const p of PERMS) next[m.key][p] = on; }
    onChange(next);
  };
  return (
    <div className="card cp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="ct">
          {isOverrideMode ? 'Module Permissions (group-granted)' : 'Module Permissions'}
        </div>
        {!isOverrideMode && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setAll(true)}>All On</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setAll(false)}>All Off</button>
          </div>
        )}
      </div>
      {isOverrideMode && overrideTargetCompanyIds && overrideTargetCompanyIds.length > 0 && (
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', marginBottom: 10, padding: '6px 10px', background: 'var(--purple-lt, #f3e8ff)', borderRadius: 'var(--r)' }}>
          Modules for: {overrideTargetCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.shortName || id).join(', ')}
        </div>
      )}
      {!isOverrideMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', marginRight: 4 }}>
            Company
          </span>
          <span
            onClick={() => setCompanyFilter('all')}
            style={{
              cursor: 'pointer', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600,
              border: companyFilter === 'all' ? '1px solid var(--blue)' : '1px solid var(--border2)',
              background: companyFilter === 'all' ? 'var(--blue-lt)' : 'var(--surface)',
              color: companyFilter === 'all' ? 'var(--blue)' : 'var(--ink3)',
            }}
          >
            🌐 All companies (baseline)
          </span>
          {assignedCompanies.map(co => (
            <span
              key={co.id}
              onClick={() => setCompanyFilter(co.id)}
              style={{
                cursor: 'pointer', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                border: companyFilter === co.id ? '1px solid var(--blue)' : '1px solid var(--border2)',
                background: companyFilter === co.id ? 'var(--blue-lt)' : 'var(--surface)',
                color: companyFilter === co.id ? 'var(--blue)' : 'var(--ink3)',
              }}
            >
              {co.shortName}
            </span>
          ))}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>Module</th>
              {/* "All" toggle column — from new UI */}
              <th style={{ padding: '7px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'center', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }} title="Toggle all for this module">
                All
              </th>
              {PERMS.map(p => (
                <th key={p} style={{ padding: '7px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {PERM_LABELS[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULE_SECTIONS.map(section => {
              const visibleModules = section.modules.filter(m => {
                if (companyFilter === 'all') return true;
                const companiesForModule = moduleCompanyMap[m.key]?.companies || [];
                return companiesForModule.some(co => co.id === companyFilter);
              });
              if (visibleModules.length === 0) return null;
              return (
                <>
                  {/* Section group header row */}
                  {/* <tr key={section.label}>
                    <td colSpan={PERMS.length + 2} style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                      {section.label}
                    </td>
                  </tr> */}
                  {visibleModules.map(m => {
                    const cur = modPerms[m.key] || {};
                    const allOn = PERMS.every(p => cur[p]);
                    const companiesForModule = moduleCompanyMap[m.key]?.companies || [];
                    return (
                      <tr key={m.key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                          {m.label}
                          {companiesForModule.map(co => (
                            <span
                              key={co.id}
                              title={co.name}
                              style={{
                                marginLeft: 5, fontSize: 9, fontWeight: 700,
                                background: 'var(--surface2)', border: '1px solid var(--border)',
                                borderRadius: 4, padding: '1px 5px', color: 'var(--ink4)',
                              }}
                            >
                              {co.shortName}
                            </span>
                          ))}
                        </td>
                        {/* Row "All" toggle */}
                        <td style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                          <PermToggle on={allOn} onClick={() => toggleRow(m.key)} />
                        </td>
                        {PERMS.map(p => (
                          <td key={p} style={{ padding: '7px 6px', textAlign: 'center' }}>
                            <PermToggle on={!!cur[p]} onClick={() => toggle(m.key, p)} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Existing PermSummary (right col 3) ───────────────────────────────────────

function PermSummary({ modPerms, isOverrideMode = false }: { modPerms: ModulePerms, isOverrideMode?: boolean }) {
  return (
    <div className="card cp">
      <div className="ct" style={{ marginBottom: 12 }}>Permission Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {PERMS.map(p => {
          const count = countPerm(modPerms, p);
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>{PERM_ICONS[p]} {PERM_LABELS[p]}</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: count > 0 ? 'var(--blue)' : 'var(--ink4)' }}>
                {count} / {MODULES.length}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink4)' }}>
        {isOverrideMode
          ? 'Overrides differ from group defaults only where toggled.'
          : 'Shared baseline for all companies. Select a company chip to configure company-specific module access.'}
      </div>
    </div>
  );
}

// ─── Existing MemberPicker for edit view col 1 ────────────────────────────────

function MemberPicker({ selected, onToggle }: { selected: Set<number>; onToggle: (id: number, on: boolean) => void }) {
  const { data: employees = [] } = useEmployees();
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    employees.filter((e: any) => !search || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())),
    [employees, search]
  );
  return (
    <div className="card cp">
      <div className="ct" style={{ marginBottom: 10 }}>
        Members <span style={{ color: 'var(--ink4)', fontWeight: 400, fontSize: 11 }}>({selected.size} selected)</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px', marginBottom: 10 }}>
        <span style={{ color: 'var(--ink4)', fontSize: 14 }}>⌕</span>
        <input type="text" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--ink)', width: '100%', fontFamily: 'var(--font)' }} />
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {filtered.map((e: any) => {
          const name = `${e.first_name} ${e.last_name}`;
          const uid = e.id;
          const isOn = selected.has(uid);
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 2px', borderBottom: '1px solid var(--border)' }}>
              <input type="checkbox" checked={isOn} onChange={ev => onToggle(uid, ev.target.checked)}
                style={{ accentColor: 'var(--blue)', width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }} />
              <Avatar name={name} size={24} fontSize={8} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{e.designation?.name || e.employee_code}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Existing EditView (logic unchanged, layout updated to match new UI) ──────

function EditView({
  group, onBack,
  overrideMemberId, overrideMemberName, overrideMemberCompanyId, overrideMemberCompanyIds, groupName, moduleCompanyMap, assignedCompanies,
}: {
  group: PermGroup | null;
  onBack: () => void;
  overrideMemberId?: number;
  overrideMemberName?: string;
  overrideMemberCompanyId?: number;
  overrideMemberCompanyIds?: number[];
  groupName?: string;
  moduleCompanyMap: Record<string, { label: string; companies: { id: number; name: string; shortName: string }[] }>;
  assignedCompanies: { id: number; name: string; shortName: string }[];
}) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const isNew = !group;
  const isOverrideMode = !!overrideMemberId;
  const { companyId } = useCompanySelector();

  const [name, setName] = useState(group?.name || '');
  const [desc, setDesc] = useState(group?.description || '');
  const [colorKey, setColorKey] = useState(group?.color || 'blue');
  const [modPerms, setModPerms] = useState<ModulePerms>(() => initModulePerms(false));
  const { data: existingSlugs = [] } = useGroupPerms(group?.id || 0);
  const { data: savedOverrides = [] } = useEmployeeOverrides(group?.id || 0, overrideMemberId, overrideMemberCompanyId);
  const [baseModPerms, setBaseModPerms] = useState<ModulePerms>(() => initModulePerms(false));

  const [baseLoaded, setBaseLoaded] = useState(false);
  const [selectedOverrideCompanyIds, setSelectedOverrideCompanyIds] = useState<number[]>(
    overrideMemberCompanyId ? [overrideMemberCompanyId] : []
  );

  useEffect(() => {
    if (overrideMemberCompanyId) {
      setSelectedOverrideCompanyIds([overrideMemberCompanyId]);
    }
  }, [overrideMemberId]);   // jab member badle, selection reset ho, default first company select ho
  // Effect A: load group base permissions
  useEffect(() => {
    if (!existingSlugs.length) return;

    const mp = slugsToModulePerms(existingSlugs);

    setBaseModPerms(mp); // original group permissions
    setModPerms(mp);     // working copy for UI

    setBaseLoaded(true);
  }, [existingSlugs.join(',')]);

  // Effect B: apply saved employee overrides on top — runs after base is loaded
  useEffect(() => {
    if (!baseLoaded || !isOverrideMode) return;
    if (!savedOverrides.length) return;
    setModPerms(prev => {
      const mp = { ...prev };
      for (const o of savedOverrides) {
        if (mp[o.module]) {
          mp[o.module] = { ...mp[o.module], [o.permission]: o.granted };
        }
      }
      return mp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedOverrides.map(o => `${o.module}:${o.permission}:${o.granted}`).join(','), baseLoaded]);

  //   useEffect(() => {
  // if (existingMembers.length) {
  //       setSelMembers(new Set(existingMembers.map((m: any) => m.id)));   // employee_id — no users table
  //     }
  //   }, [existingMembers.length]);

  // Existing save logic (unchanged)
  const saveMutation = useMutation({
    mutationFn: async () => {

      // ── OVERRIDE MODE: update only THIS employee's overrides, never the group ──
      if (isOverrideMode) {
        // Build overrides from ALL modules — employee can get any permission added or removed.
        // Backend replaces all existing overrides for this employee atomically.
        const VALID_PERMS = ['view', 'create', 'edit', 'delete', 'download'] as const;
        const overrides: { module: string; field_name: null; permission: string; granted: boolean }[] = [];
        for (const mod of MODULES) {
          const currentModule = modPerms[mod.key] || {};
          const baseModule = baseModPerms[mod.key] || {};

          for (const perm of VALID_PERMS) {
            const currentValue = !!currentModule[perm];
            const baseValue = !!baseModule[perm];

            if (currentValue !== baseValue) {
              overrides.push({
                module: mod.key,
                field_name: null,
                permission: perm,
                granted: currentValue,
              });
            }
          }
        }

        const targetCompanyIds = selectedOverrideCompanyIds.length > 0
          ? selectedOverrideCompanyIds
          : (overrideMemberCompanyId ? [overrideMemberCompanyId] : []);

        if (targetCompanyIds.length === 0) {
          throw new Error('Select at least one company to save overrides for');
        }
        await pgApi.setOverrides(group!.id, overrideMemberId!, targetCompanyIds, overrides);
        return;
      }

      // ── NORMAL GROUP EDIT: update the group's permissions for all members ──
      const slugs = modulePermsToSlugs(modPerms);
      if (isNew) {
        const r = await pgApi.create({ name, description: desc, color: colorKey });
        const newId = r.data.id;
        await pgApi.setPerms(newId, slugs);
        return r;
      } else {
        await pgApi.update(group!.id, { name, description: desc, color: colorKey });
        await pgApi.setPerms(group!.id, slugs);
      }
    },
    onSuccess: (data: any) => {
      if (isOverrideMode && group?.id && overrideMemberId) {

        if (data?.accessToken) dispatch(updateToken(data.accessToken));
        if (data?.permissions) dispatch(setPermissions(data.permissions));

        qc.refetchQueries({
          queryKey: ['rp', 'employee-overrides', group.id, overrideMemberId]
        });

        // Also refresh the inline overrides panel on the group detail screen —
        // it reads a different cache key ('group-overrides'), so without this
        // it keeps showing stale data after Save until the panel happens to remount.
        qc.invalidateQueries({
          queryKey: ['group-overrides', group.id, overrideMemberId]
        });

        showToast('✓ Employee override saved');

        // ADD THIS
        onBack();

        return;
      }

      qc.refetchQueries({ queryKey: ['rp', 'groups'] });
      qc.refetchQueries({ queryKey: ['rp', 'group-perms', group?.id] });

      showToast(isNew ? '✓ Group created' : '✓ Group updated');
      onBack();
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const fieldModuleAccessGranted = isOverrideMode
    ? !!baseModPerms['employees']?.view
    : !!modPerms['employees']?.view;

  return (
    <div>
      {/* Toolbar — matches new UI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', flex: 1 }} id="rp-edit-title">
          {isOverrideMode
            ? `Overrides for ${overrideMemberName}`
            : isNew ? 'New Permission Group' : `Editing: ${group!.name}`}
        </div>
        <button className="btn btn-sec btn-sm" onClick={onBack}>Cancel</button>
        <button
          className="btn btn-pri btn-sm"
          onClick={() => saveMutation.mutate()}
          disabled={
            (isOverrideMode ? selectedOverrideCompanyIds.length === 0 : !name.trim())
            || saveMutation.isPending
          }
        >
          {saveMutation.isPending ? '…' : '✓ Save Group'}
        </button>
      </div>

      {/* 3-col layout — matches new UI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 240px', gap: 14, alignItems: 'flex-start' }}>

        {/* Col 1: Group details (normal) or member override context (override mode) */}
        {isOverrideMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Member Override</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <Avatar name={overrideMemberName || ''} size={32} fontSize={12} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13 }}>{overrideMemberName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Individual override</div>
                </div>
              </div>
              {isOverrideMode && overrideMemberCompanyIds && overrideMemberCompanyIds.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
                    Override applies to
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {/* ── NAYA: "All assigned companies" toggle chip ── */}
                    <span
                      onClick={() => {
                        const allSelected = selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length;
                        setSelectedOverrideCompanyIds(allSelected ? [] : [...overrideMemberCompanyIds]);
                      }}
                      style={{
                        cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                        border: '1px solid var(--purple)',
                        background: selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length ? 'var(--purple)' : 'var(--surface)',
                        color: selectedOverrideCompanyIds.length === overrideMemberCompanyIds.length ? '#fff' : 'var(--purple)',
                      }}
                    >
                      🌐 All assigned companies
                    </span>

                    {overrideMemberCompanyIds.map((cid) => {
                      const co = assignedCompanies.find(c => c.id === cid);
                      const isSelected = selectedOverrideCompanyIds.includes(cid);
                      return (
                        <span
                          key={cid}
                          onClick={() => {
                            setSelectedOverrideCompanyIds(prev =>
                              isSelected ? prev.filter(id => id !== cid) : [...prev, cid]
                            );
                          }}
                          style={{
                            cursor: 'pointer', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 600,
                            border: isSelected ? '1px solid var(--blue)' : '1px solid var(--border2)',
                            background: isSelected ? 'var(--blue-lt)' : 'var(--surface)',
                            color: isSelected ? 'var(--blue)' : 'var(--ink3)',
                          }}
                        >
                          {co?.name || cid}
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 6, lineHeight: 1.5 }}>
                    Editing overrides for: {selectedOverrideCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).join(', ') || 'none selected'}.
                  </div>
                </div>
              )}
              <div className="info" style={{ fontSize: 11, marginTop: 10, background: 'var(--amber-lt)', borderColor: 'var(--amber-bd)', color: 'var(--amber)' }}>
                Changes apply only to this person. Everyone else in <strong>{groupName}</strong> keeps the group defaults.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 12 }}>Group Details</div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label>Group Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Senior HR" autoFocus />
              </div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label>Colour Tag</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLOR_OPTS.map(c => (
                    <div key={c.key} onClick={() => setColorKey(c.key)}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c.css, cursor: 'pointer', border: `3px solid ${colorKey === c.key ? 'var(--ink)' : 'transparent'}`, transform: colorKey === c.key ? 'scale(1.2)' : 'scale(1)', transition: 'all .12s' }} />
                  ))}
                </div>
              </div>
              <div className="fg">
                <label>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What can this group do?" />
              </div>
            </div>
          </div>
        )}



        {/* Col 2: Module permission matrix — new UI with All col + section grouping */}
        <ModuleMatrix modPerms={modPerms} onChange={setModPerms} isOverrideMode={isOverrideMode} moduleCompanyMap={moduleCompanyMap} assignedCompanies={assignedCompanies} overrideTargetCompanyIds={selectedOverrideCompanyIds} />

        {/* Col 3: Summary */}
        <PermSummary modPerms={modPerms} isOverrideMode={isOverrideMode} />
      </div>
      {group && (
        <div style={{ marginTop: 20 }}>
          <FieldPermissionsPanel
            groupId={group.id}
            assignedCompanies={assignedCompanies}
            isOverrideMode={isOverrideMode}
            overrideMemberId={overrideMemberId}
            overrideMemberCompanyIds={overrideMemberCompanyIds}
            selectedOverrideCompanyIds={selectedOverrideCompanyIds}
            overrideMemberName={overrideMemberName}
            moduleAccessGranted={fieldModuleAccessGranted}
          />
        </div>
      )}
    </div>
  );
}

// ─── Existing FieldPermissionsView (unchanged — only wired into new nav) ──────
function FieldPermissionsPanel({
  groupId, assignedCompanies, isOverrideMode = false,
  overrideMemberId, overrideMemberCompanyIds, selectedOverrideCompanyIds, overrideMemberName, moduleAccessGranted
}: {
  groupId: number;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  isOverrideMode?: boolean;
  overrideMemberId?: number;
  overrideMemberCompanyIds?: number[];
  selectedOverrideCompanyIds?: number[];
  overrideMemberName?: string;
  moduleAccessGranted: boolean;
}) {
  const { data: modules = [] } = useQuery({
    queryKey: ['field-perm-modules'],
    queryFn: () => pgApi.listModules(),
    select: r => r.data ?? [],
    staleTime: 5 * 60_000,
  });
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  useEffect(() => { if (modules.length && !selectedModuleId) setSelectedModuleId(modules[0].id); }, [modules]);

  const { data: forms = [] } = useEmployeeModuleForms(selectedModuleId || 0);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  useEffect(() => { if (forms.length && !selectedFormId) setSelectedFormId(forms[0].id); }, [forms]);

  const { data: members = [] } = useGroupMembers(groupId);
const groupCompanyIds = useMemo(() => {
  const ids = new Set<number>();
  for (const m of members) (m.assigned_company_ids || []).forEach((id: number) => ids.add(id));
  return [...ids].sort((a, b) => a - b);
}, [members]);

const matrixCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : groupCompanyIds[0];
  const { data: matrixData, refetch } = useGroupFieldPermissionMatrix(selectedFormId || 0, matrixCompanyId || 0);
  const fields = matrixData?.fields || [];
  const matrix = matrixData?.matrix || {};

  const [localPerms, setLocalPerms] = useState<Record<number, any>>({});
  const [dirty, setDirty] = useState(false);

  const displayCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : undefined;
  const { data: overrideData } = useEmployeeFieldOverrides(
    groupId, overrideMemberId, displayCompanyId, 'employees'  // 'employees' matches the module key used elsewhere
  );

  useEffect(() => {
    if (isOverrideMode) {
      if (!fields.length) return;
      const merged: Record<number, any> = {};
      for (const f of fields) {
        const groupBase = matrix[groupId]?.[f.id] || { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
        const ov = overrideData?.[f.field_key] || {};
        merged[f.id] = {
          can_view: ov.view !== undefined ? ov.view : groupBase.can_view,
          can_edit: ov.edit !== undefined ? ov.edit : groupBase.can_edit,
          can_copy: ov.copy !== undefined ? ov.copy : groupBase.can_copy,
          can_download: ov.download !== undefined ? ov.download : groupBase.can_download,
          is_masked: ov.mask !== undefined ? ov.mask : groupBase.is_masked,
        };
      }
      setLocalPerms(merged);
      setDirty(false);
    } else if (matrix[groupId]) {
      setLocalPerms(matrix[groupId]);
      setDirty(false);
    }
  }, [groupId, matrixData, isOverrideMode, overrideData, fields]);

  const toggleFP = (
    fieldId: number,
    perm: 'can_view' | 'can_edit' | 'can_copy' | 'can_download' | 'is_masked'
  ) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};

      const next = {
        ...current,
        [perm]: !current[perm],
      };

      // Any permission except View requires View
      if (
        perm !== 'can_view' &&
        next[perm]
      ) {
        next.can_view = true;
      }

      // Turning View OFF clears all dependent permissions
      if (
        perm === 'can_view' &&
        !next.can_view
      ) {
        next.can_edit = false;
        next.can_copy = false;
        next.can_download = false;
        next.is_masked = false;
      }

      return {
        ...prev,
        [fieldId]: next,
      };
    });

    setDirty(true);
  };
  const toggleFieldRow = (fieldId: number) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};

      const allEnabled =
        current.can_view &&
        current.can_edit &&
        current.can_copy &&
        current.can_download &&
        current.is_masked;

      const next = allEnabled
        ? {
          can_view: false,
          can_edit: false,
          can_copy: false,
          can_download: false,
          is_masked: false,
        }
        : {
          can_view: true,
          can_edit: true,
          can_copy: true,
          can_download: true,
          is_masked: true,
        };

      return {
        ...prev,
        [fieldId]: next,
      };
    });

    setDirty(true);
  };
  const grantAll = () => {
    setLocalPerms(prev => {
      const n = { ...prev };

      for (const f of fields)
        n[f.id] = {
          can_view: true,
          can_edit: true,
          can_copy: true,
          can_download: true,
          is_masked: false,
        };

      return n;
    });

    setDirty(true);
  };
  const revokeAll = () => { setLocalPerms(prev => { const n = { ...prev }; for (const f of fields) n[f.id] = { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false }; return n; }); setDirty(true); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isOverrideMode) {
        if (!selectedOverrideCompanyIds?.length) throw new Error('Select at least one company to save overrides for');
        if (!overrideMemberId) throw new Error('No member selected');

        // Only send overrides for fields the admin actually touched vs. the group baseline —
        // sending everything would create unnecessary override rows for untouched fields.
        const overrides: { field_name: string; permission: string; granted: boolean }[] = [];
        for (const f of fields) {
          const groupBase = matrix[groupId]?.[f.id] || {};
          const cur = localPerms[f.id] || {};
          (['view', 'edit', 'copy', 'download'] as const).forEach(p => {
            const key = `can_${p}` as const;
            if (!!cur[key] !== !!groupBase[key]) overrides.push({ field_name: f.field_key, permission: p, granted: !!cur[key] });
          });
          if (!!cur.is_masked !== !!groupBase.is_masked) overrides.push({ field_name: f.field_key, permission: 'mask', granted: !!cur.is_masked });
        }

        await pgApi.setFieldOverrides(groupId, overrideMemberId, selectedOverrideCompanyIds, 'employees', overrides);
      } else {
        if (!groupCompanyIds.length) throw new Error('This group has no members in any company yet');
        const permissions = fields.map((f: any) => ({
          field_id: f.id,
          can_view: !!localPerms[f.id]?.can_view, can_edit: !!localPerms[f.id]?.can_edit,
          can_copy: !!localPerms[f.id]?.can_copy, can_download: !!localPerms[f.id]?.can_download,
          is_masked: !!localPerms[f.id]?.is_masked,
        }));
        await pgApi.bulkSetFieldPermissions(groupId, groupCompanyIds, permissions);
      }
    },
    onSuccess: () => { showToast(isOverrideMode ? '✓ Field overrides saved' : '✓ Field permissions saved'); setDirty(false); refetch(); },
    onError: (e: any) => showToast(e?.message || 'Failed to save'),
  });

  const selectedForm = forms.find((f: any) => f.id === selectedFormId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="ct" style={{ flex: 1 }}>{isOverrideMode ? 'Field-Level Overrides' : 'Field-Level Permissions'}</div>
        {moduleAccessGranted && (
          isOverrideMode
            ? selectedOverrideCompanyIds && selectedOverrideCompanyIds.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Applies to: {selectedOverrideCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              </div>
            )
            : groupCompanyIds.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Applies to: {groupCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              </div>
            )
        )}
        {moduleAccessGranted && dirty && (
          <button className="btn btn-pri btn-sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '…' : '✓ Save Changes'}
          </button>
        )}
      </div>
      {!moduleAccessGranted ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
          {isOverrideMode
            ? 'This group has no granted modules — there are no fields to override for this person.'
            : <>This group has no module access — there are no fields to configure.<br /><span style={{ fontSize: 11 }}>Grant module view access above to manage field-level rules.</span></>}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 14 }}>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)' }}>Sections</div>
              <div style={{ padding: '6px 0' }}>
                {forms.map((f: any) => (
                  <div key={f.id} onClick={() => setSelectedFormId(f.id)}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedFormId === f.id ? 600 : 400, color: selectedFormId === f.id ? 'var(--blue)' : 'var(--ink3)', background: selectedFormId === f.id ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${selectedFormId === f.id ? 'var(--blue)' : 'transparent'}` }}>
                    {f.name}
                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 400 }}>{f.fields?.length || 0} fields</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink3)' }}>{selectedForm?.name || '...'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={grantAll}>Grant all</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10 }} onClick={revokeAll}>Revoke all</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={{ textAlign: 'left', padding: '7px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)' }}>
                    Field
                  </th>

                  <th style={{ padding: '7px 8px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)' }}>
                    All
                  </th>

                  {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => (
                    <th
                      key={p}
                      style={{
                        padding: '7px 8px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--ink4)',
                        borderBottom: '1px solid var(--border)',
                        textAlign: 'center'
                      }}
                    >
                      {p.replace('can_', '').replace('is_', '')}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {fields.map((f: any) => {
                    const fp = localPerms[f.id] || { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                          <PermToggle
                            on={
                              fp.can_view &&
                              fp.can_edit &&
                              fp.can_copy &&
                              fp.can_download &&
                              fp.is_masked
                            }
                            onClick={() => toggleFieldRow(f.id)}
                          />
                        </td>
                        {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => (
                          <td key={p} style={{ padding: '7px 6px', textAlign: 'center' }}><PermToggle on={!!fp[p]} onClick={() => toggleFP(f.id, p)} /></td>
                        ))}
                      </tr>
                    );
                  })}
                  {fields.length === 0 && <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>No fields found for this form.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="card cp">
              <div className="ct" style={{ marginBottom: 10 }}>Stats</div>
              {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                const on = fields.filter((f: any) => localPerms[f.id]?.[p]).length;
                return (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink3)' }}>{p.replace('can_', '').replace('is_', '')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: on > 0 ? 'var(--blue)' : 'var(--ink4)' }}>{on}/{fields.length}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ── How it works — mode-aware copy ── */}
          <div style={{ fontSize: 11, color: 'var(--ink4)', lineHeight: 1.6, marginTop: 14, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
            {isOverrideMode ? (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 Member overrides</strong>
                Choose which companies this override applies to above. You can set different overrides per company or apply one rule to all assigned companies.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask</strong> shows the value as •••• — useful for salary &amp; ID numbers.
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 5 }}>🔒 How it works</strong>
                Field rules override module rules. A field blocked here won't show even if the module is visible.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask</strong> shows the value as •••• — useful for salary &amp; ID numbers.
              </>
            )}
          </div>
        </>
      )
      }

    </div>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────

export default function RolesPermissionsPage() {
  const dispatch = useAppDispatch();
  const { canView, canEdit, canCreate, canDelete } = usePermission();
  const { companyId } = useCompanySelector();
  const managedCompanies = useAppSelector(selectManagedCompanies);
  const { data: perms } = useFieldPermissions();  // apna emergency-contacts formId daalo

  // Build assignedCompanies with shortNames for chips and badges
  const assignedCompanies = useMemo(() =>
    managedCompanies.map((co: any) => ({
      id: co.id,
      name: co.name,
      shortName: co.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4),
    })),
    [managedCompanies],
  );
  const qc = useQueryClient();

  const { data: groups = [], isLoading } = useGroups();

  // View state
  const [view, setView] = useState<View>('groups');
  const [editGroup, setEditGroup] = useState<PermGroup | null>(null);
  const [fpGroupId, setFpGroupId] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PermGroup | null>(null);

  // NEW UI state
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  // Derived live from query — always reflects server state after any refetch
  const selectedGroup = groups.find(g => g.id === activeGroupId) ?? groups[0] ?? null;
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [memberOverrides, setMemberOverrides] = useState<Record<number, boolean>>({});

  // Override mode — opens EditView for a specific member
  const [overrideMemberId, setOverrideMemberId] = useState<number | undefined>();
  const [overrideMemberName, setOverrideMemberName] = useState<string | undefined>();
  const [overrideMemberCompanyId, setOverrideMemberCompanyId] = useState<number | undefined>();
  const [overrideMemberCompanyIds, setOverrideMemberCompanyIds] = useState<number[]>([]);

  const { data: employees = [] } = useEmployees();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Roles & Permissions', breadcrumb: 'Settings' }));
  }, [dispatch]);

  // Load members for all groups using existing pattern
  const memberQueries = useQueries({
    queries: groups.map(g => ({
      queryKey: ['rp', 'group-members', g.id],
      queryFn: () => pgApi.getMembers(g.id),
      enabled: !!g.id,
    })),
  });

  const groupMembersMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    groups.forEach((g, i) => { map[g.id] = memberQueries[i]?.data?.data || []; });
    return map;
  }, [groups, memberQueries]);

  // Select first group on load
  useEffect(() => {
    if (groups.length && !activeGroupId) setActiveGroupId(groups[0].id);
  }, [groups]);

  // Stats — existing computation
  const { data: stats } = useQuery({
    queryKey: ['rbac-stats', companyId],
    queryFn: () => apiClient.get<any, any>(`/permission-groups/stats?company_id=${companyId}`),
    enabled: !!companyId,
    select: (r: any) => r.data,
  });

  const totalAssigned = groups.reduce((s, g) => s + (groupMembersMap[g.id]?.length || 0), 0);
  const fieldRuleCount = groups.reduce((s, g) => s + (g.permissions?.length || 0) * 3, 0);

  // Existing mutations
  const seedMutation = useMutation({
    mutationFn: () => pgApi.seed(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp'] }); showToast('✓ System groups seeded'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pgApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rp'] });
      showToast('Group deleted');
      setDeleteTarget(null);
      if (selectedGroup?.id === deleteTarget?.id) setActiveGroupId(groups[0]?.id ?? null);
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) =>
      pgApi.addMember(groupId, empId, companyIds.length > 0 ? companyIds : undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp', 'group-members'] }); setMemberOverrides({}); showToast('✓ Member added'); setAddPersonOpen(false); },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) => {
      for (const companyId of companyIds) {
        await pgApi.removeMember(groupId, companyId, empId);
      }
    },
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast('Member removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const handleToggleOverrides = (memberId: number) => {
    setMemberOverrides(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  // const handleEditOverride = (memberId: number) => {
  //   const member = groupMembersMap[selectedGroup?.id || 0]?.find((m: any) => m.id === memberId);
  //   const name = member ? `${member.first_name} ${member.last_name}`.trim() : '';
  //   setOverrideMemberId(memberId);
  //   setOverrideMemberName(name);
  //   setOverrideMemberCompanyId(member?.assigned_company_ids?.[0]);
  //   setView('edit');
  // };

  const handleEditOverride = (memberId: number) => {
    const member = groupMembersMap[selectedGroup?.id || 0]?.find((m: any) => m.id === memberId);
    const name = member ? `${member.first_name} ${member.last_name}`.trim() : '';
    setOverrideMemberId(memberId);
    setOverrideMemberName(name);
    setOverrideMemberCompanyId(member?.assigned_company_ids?.[0]);       // purana, default company (GET ke liye use hoga)
    setOverrideMemberCompanyIds(member?.assigned_company_ids || []);      // ← naya, poori list (chips ke liye)
    setView('edit');
  };

  const deleteOverrideMutation = useMutation({
    mutationFn: ({
      memberId,
      overrideId,
    }: {
      memberId: number;
      overrideId: number;
    }) =>
      pgApi.deleteOverride(
        selectedGroup!.id,
        memberId,
        overrideId
      ),
  });

  const moduleCompanyMap = useCompanyModulesMap(assignedCompanies);

  // Views
  if (view === 'edit') return (
    <AppShell>
      <div className="pg-enter">
        <EditView
          group={overrideMemberId ? selectedGroup : editGroup}
          onBack={() => { setView('groups'); setEditGroup(null); setOverrideMemberId(undefined); setOverrideMemberName(undefined); }}
          overrideMemberId={overrideMemberId}
          overrideMemberName={overrideMemberName}
          overrideMemberCompanyId={overrideMemberCompanyId}
          overrideMemberCompanyIds={overrideMemberCompanyIds}
          groupName={selectedGroup?.name}
          moduleCompanyMap={moduleCompanyMap}
          assignedCompanies={assignedCompanies}
        />
      </div>
    </AppShell>
  );

  // if (view === 'field-perms') return (
  //   <AppShell>
  //     <div className="pg-enter">
  //       <FieldPermissionsView groupId={fpGroupId} onBack={() => setView('groups')} />
  //     </div>
  //   </AppShell>
  // );

  return (
    <PermissionGuard permission="settings:view">
      <AppShell>
        <div className="pg-enter">

          <PageHeaderWithCompany
            title="Roles & Permissions"
            description="Permission groups · Employee assignment · Field-level access control"
            actions={
              canCreate('settings') ? (
                <div className="ph-r">
                  <button className="btn btn-pri btn-sm" onClick={() => { setEditGroup(null); setView('edit'); }}>
                    + New Group
                  </button>
                </div>
              ) : undefined
            }
          />

          {/* Stats — existing logic, new styling */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Permission Groups', value: stats?.totalGroups ?? groups.length, color: 'var(--blue)' },
              { label: 'Employees Assigned', value: totalAssigned ?? '—', color: 'var(--green)' },
              { label: 'Unassigned', value: stats?.unassigned ?? '—', color: 'var(--amber)' },
              { label: 'Field Rules', value: fieldRuleCount ?? '—', color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '14px 18px', boxShadow: 'var(--sh)' }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* NEW UI: 2-column layout — left sidebar list + right detail panel */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', height: 100, marginBottom: 12 }}>
                <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--r3)' }} />
              </div>
            ))
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No permission groups yet</div>
              <div style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Seed the system defaults or create your first group</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-sec" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                  {seedMutation.isPending ? '…' : '🌱 Seed System Groups'}
                </button>
                <button className="btn btn-pri" onClick={() => { setEditGroup(null); setView('edit'); }}>+ New Group</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>

              {/* Left: group sidebar list */}
              <GroupSidebar
                groups={groups}
                selectedId={selectedGroup?.id ?? null}
                onSelect={g => { setActiveGroupId(g.id); setAddPersonOpen(false); setMemberOverrides({}); }}
                onNew={() => { setEditGroup(null); setView('edit'); }}
                membersMap={groupMembersMap}
              />

              {/* Right: selected group detail */}
              {selectedGroup ? (
                <GroupDetail
                  group={selectedGroup}
                  members={groupMembersMap[selectedGroup.id] || []}
                  onEdit={() => { setEditGroup(selectedGroup); setView('edit'); }}
                  onFieldPerms={() => { setFpGroupId(selectedGroup.id); setView('edit'); }}
                  onDelete={() => setDeleteTarget(selectedGroup)}
                  addPersonOpen={addPersonOpen}
                  setAddPersonOpen={setAddPersonOpen}
                  onAddMember={(empId, companyIds) => addMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds })}
                  onRemoveMember={(empId) => {
                    const member = (groupMembersMap[selectedGroup.id] || []).find((m: any) => m.id === empId);
                    removeMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds: member?.assigned_company_ids || [] });
                  }}
                  employees={employees}
                  assignedCompanies={assignedCompanies}
                  overrides={memberOverrides}
                  onToggleOverrides={handleToggleOverrides}
                  onEditOverride={handleEditOverride}
                  onDeleteOverride={(memberId, overrideId) =>
                    deleteOverrideMutation.mutate({
                      memberId,
                      overrideId,
                    })
                  }
                />
              ) : null}
            </div>
          )}

        </div>
      </AppShell>

      {/* Delete confirmation modal — existing */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title={`Delete "${deleteTarget.name}"?`}>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>
            This will permanently delete the group and remove all member assignments. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-pri" style={{ background: 'var(--red)' }}
              onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? '…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </PermissionGuard>
  );
}
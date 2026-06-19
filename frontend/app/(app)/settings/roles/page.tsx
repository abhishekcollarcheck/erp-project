'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch }      from '../../../../store';
import { setPageTitle }        from '../../../../store/slices/uiSlice';
import { updateToken, setPermissions } from '../../../../store/slices/authSlice';
import { AppShell }            from '../../../../layouts/AppLayout';
import { Modal }               from '../../../../components/ui/Modal';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { showToast }           from '../../../../utils/toast';
import apiClient               from '../../../../services/api/client';
import type { ApiResponse }    from '../../../../types/api.types';
import { Eye, SquarePen, Trash2, Download, Pen } from 'lucide-react';
import { usePermission }       from '../../../../features/auth/hooks/useAuth';
import { PageHeaderWithCompany, useCompanySelector } from '../../../../components/company/CompanySelector';
import { PermissionGuard }     from '../../../../utils/permissionGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'groups' | 'edit' | 'field-perms';

interface PermGroup {
  id:           number;
  name:         string;
  slug:         string;
  description?: string | null;
  color?:       string | null;
  is_system:    boolean;
  is_active:    boolean;
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
      { key: 'recruitment', label: 'Recruitment / ATS'  },
      { key: 'aptitude',    label: 'Aptitude Test'      },
      { key: 'employees',   label: 'Employee Directory' },
      { key: 'department',  label: 'Department'         },
      { key: 'designation', label: 'Designation'        },
      { key: 'settings',    label: 'Settings & RBAC'    },
    ],
  },
];


// Flat list for helpers
const MODULES = MODULE_SECTIONS.flatMap(s => s.modules);

// Only module-level permissions (field-level is separate)
const PERMS    = ['view', 'create', 'edit', 'delete', 'download'] as const;
type Perm = typeof PERMS[number];

const PERM_ICONS: Record<string, React.ReactNode> = {
  view:     <Eye size={13} />,
  create:   <Pen size={13} />,
  edit:     <SquarePen size={13} />,
  delete:   <Trash2 size={13} />,
  download: <Download size={13} />,
};
const PERM_LABELS: Record<string, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', download: 'Download',
};

type ModulePerms = Record<string, Record<string, boolean>>;

const COLOR_OPTS = [
  { key: 'blue',   css: 'var(--blue)'   },
  { key: 'green',  css: 'var(--green)'  },
  { key: 'purple', css: 'var(--purple)' },
  { key: 'amber',  css: 'var(--amber)'  },
  { key: 'red',    css: 'var(--red)'    },
  { key: 'teal',   css: 'var(--teal)'   },
  { key: 'pink',   css: 'var(--pink, #c0265e)' },
];

function cssForKey(key: string | null | undefined) {
  return COLOR_OPTS.find(c => c.key === key)?.css || key || 'var(--blue)';
}

// ─── Existing API layer (unchanged) ───────────────────────────────────────────

const pgApi = {
  list:        () => apiClient.get<unknown, ApiResponse<PermGroup[]>>('/permission-groups'),
  create:      (d: any) => apiClient.post<unknown, ApiResponse<PermGroup>>('/permission-groups', d),
  update:      (id: number, d: any) => apiClient.put<unknown, ApiResponse<PermGroup>>(`/permission-groups/${id}`, d),
  delete:      (id: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}`),
  getPerms:    (id: number) => apiClient.get<unknown, ApiResponse<string[]>>(`/permission-groups/${id}/permissions`),
  setPerms:    (id: number, slugs: string[]) => apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${id}/permissions`, { slugs }),
  getMembers:  (id: number) => apiClient.get<unknown, ApiResponse<any[]>>(`/permission-groups/${id}/members`),
  addMember:   (id: number, uid: number) => apiClient.post<unknown, ApiResponse<any>>(`/permission-groups/${id}/members`, { employee_id: uid }),
  removeMember:(id: number, uid: number) => apiClient.delete<unknown, ApiResponse<any>>(`/permission-groups/${id}/members/${uid}`),
  seed:        () => apiClient.post<unknown, ApiResponse<any>>('/permission-groups/seed', {}),
  employees:   () => apiClient.get<unknown, ApiResponse<any[]>>('/employees?limit=100'),
  // Employee-level override — PUT to override endpoint, never touches group permissions
  setOverrides: (groupId: number, employeeId: number, overrides: { module: string; field_name: null; permission: string; granted: boolean }[]) =>
    apiClient.put<unknown, ApiResponse<any>>(`/permission-groups/${groupId}/members/${employeeId}/overrides`, { overrides }),
  // Load existing overrides for an employee in a group
  getOverrides: (groupId: number, employeeId: number) =>
    apiClient.get<unknown, ApiResponse<{ module: string; permission: string; granted: boolean }[]>>(
      `/permission-groups/${groupId}/members/${employeeId}/overrides`
    ),
};

// Existing hooks (unchanged)
function useGroups()             { return useQuery({ queryKey: ['rp', 'groups'],           queryFn: () => pgApi.list(),          staleTime: 0, select: r => r.data ?? [] }); }
function useGroupPerms(id: number) { return useQuery({ queryKey: ['rp', 'group-perms', id], queryFn: () => pgApi.getPerms(id),    enabled: id > 0,   select: r => r.data ?? [] }); }
function useGroupMembers(id: number){ return useQuery({ queryKey: ['rp', 'group-members', id], queryFn: () => pgApi.getMembers(id), enabled: id > 0,   select: r => r.data ?? [] }); }
function useEmployees()          { return useQuery({ queryKey: ['employees-light'],          queryFn: () => pgApi.employees(),     staleTime: 5 * 60_000, select: r => r.data ?? [] }); }
function useEmployeeOverrides(groupId: number, employeeId: number | undefined) {
  return useQuery({
    queryKey: ['rp', 'employee-overrides', groupId, employeeId],
    queryFn:  () => pgApi.getOverrides(groupId, employeeId!),
    enabled:  groupId > 0 && !!employeeId,
    select:   r => r.data ?? [],
    staleTime: 0,
    refetchOnMount: true,
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
  groups:     PermGroup[];
  selectedId: number | null;
  onSelect:   (g: PermGroup) => void;
  onNew:      () => void;
  membersMap: Record<number, any[]>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map(g => {
        const isActive = g.id === selectedId;
        const count    = membersMap[g.id]?.length ?? g.member_count;
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

// ─── NEW UI: Right detail panel for selected group ────────────────────────────

function GroupDetail({
  group, members, onEdit, onFieldPerms, onDelete,
  addPersonOpen, setAddPersonOpen,
  onAddMember, onRemoveMember, employees,
  overrides, onToggleOverrides, onEditOverride, onDeleteOverride,
}: {
  group:           PermGroup;
  members:         any[];
  onEdit:          () => void;
  onFieldPerms:    () => void;
  onDelete:        () => void;
  addPersonOpen:   boolean;
  setAddPersonOpen:(v: boolean) => void;
  onAddMember:     (empId: number) => void;
  onRemoveMember:  (empId: number) => void;
  employees:       any[];
  overrides:       Record<string, boolean>;
  onToggleOverrides:(memberId: number) => void;
  onEditOverride:  (memberId: number) => void;
  onDeleteOverride:(memberId: number) => void;
}) {
  const slugs    = group.permissions?.map(p => p.slug) || [];
  const modPerms = slugsToModulePerms(slugs);
  const [search, setSearch] = useState('');

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
        <button className="btn btn-sec btn-sm" onClick={onFieldPerms} title="Field Permissions">☷</button>
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

        {/* Add person picker */}
        {addPersonOpen && (
          <div style={{ marginBottom: 12, padding: 12, background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 10px' }}>
              <span style={{ color: 'var(--ink4)', fontSize: 14 }}>⌕</span>
              <input
                type="text" placeholder="Search employees…" value={search}
                onChange={e => setSearch(e.target.value)} autoFocus
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--ink)', width: '100%', fontFamily: 'var(--font)' }}
              />
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {notMembers.slice(0, 20).map((e: any) => {
                const name = `${e.first_name} ${e.last_name}`;
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
                    <Avatar name={name} size={24} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{e.employee_code}</div>
                    </div>
                    <button className="btn btn-sec btn-sm" style={{ fontSize: 11 }} onClick={() => onAddMember(e.id)}>
                      + Add
                    </button>
                  </div>
                );
              })}
              {notMembers.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--ink4)', textAlign: 'center', padding: '10px 0' }}>No matching employees</div>
              )}
            </div>
          </div>
        )}

        {/* Member rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.map((m: any) => {
            const name      = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            const memberId  = m.id;
            const showOvrd  = overrides[memberId] === true;
            return (
              <div key={memberId} id={`rp-mrow-${memberId}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar name={name} size={30} fontSize={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{m.designation || m.employee_code}</div>
                  </div>
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

function ModuleMatrix({ modPerms, onChange, isOverrideMode = false }: {
  modPerms:        ModulePerms;
  onChange:        (mp: ModulePerms) => void;
  isOverrideMode?: boolean;
}) {
  const toggle = (mod: string, perm: string) => {
    onChange({ ...modPerms, [mod]: { ...modPerms[mod], [perm]: !modPerms[mod][perm] } });
  };

  const toggleRow = (modKey: string) => {
    const cur = modPerms[modKey] || {};
    const allOn = PERMS.every(p => cur[p]);
    const next  = {} as Record<string, boolean>;
    for (const p of PERMS) next[p] = !allOn;
    onChange({ ...modPerms, [modKey]: next });
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
          {isOverrideMode ? 'Employee Override' : 'Module Permissions'}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setAll(true)}>All On</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAll(false)}>All Off</button>
        </div>
      </div>

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
            {MODULE_SECTIONS.map(section => (
              <>
                {/* Section group header row */}
                <tr key={section.label}>
                  <td colSpan={PERMS.length + 2} style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    {section.label}
                  </td>
                </tr>
                {section.modules.map(m => {
                  const cur   = modPerms[m.key] || {};
                  const allOn    = PERMS.every(p => cur[p]);
                  return (
                    <tr key={m.key} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                        {m.label}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Existing PermSummary (right col 3) ───────────────────────────────────────

function PermSummary({ modPerms }: { modPerms: ModulePerms }) {
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
      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink4)' }}>Field-level rules may further restrict access per field.</div>
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
          const uid  = e.id;
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
  overrideMemberId, overrideMemberName, groupName,
}: {
  group:              PermGroup | null;
  onBack:             () => void;
  overrideMemberId?:  number;
  overrideMemberName?: string;
  groupName?:         string;
}) {
  const qc             = useQueryClient();
  const dispatch       = useAppDispatch();
  const isNew          = !group;
  const isOverrideMode = !!overrideMemberId;

  const [name,       setName]       = useState(group?.name || '');
  const [desc,       setDesc]       = useState(group?.description || '');
  const [colorKey,   setColorKey]   = useState(group?.color || 'blue');
  const [modPerms,   setModPerms]   = useState<ModulePerms>(() => initModulePerms(false));
  const [selMembers, setSelMembers] = useState<Set<number>>(new Set());

  const { data: existingSlugs   = [] } = useGroupPerms(group?.id || 0);
  const { data: existingMembers = [] } = useGroupMembers(group?.id || 0);
  // Load saved overrides for this employee — only active in override mode
  const { data: savedOverrides  = [] } = useEmployeeOverrides(group?.id || 0, overrideMemberId);

  // Populate modPerms from server on mount (and when the employee changes).
  // Two separate effects so they compose correctly:
  //   Effect A: runs when group slugs load → sets base state
  //   Effect B: runs when saved overrides load → patches the employees module
  // Neither runs after the user edits — modPerms state is the source of truth while editing.
  const [baseLoaded, setBaseLoaded] = useState(false);

  // Effect A: load group base permissions
  useEffect(() => {
    if (!existingSlugs.length) return;
    const mp = slugsToModulePerms(existingSlugs);
    setModPerms(mp);
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

  useEffect(() => {
    if (existingMembers.length) {
      setSelMembers(new Set(existingMembers.map((m: any) => m.id)));   // employee_id — no users table
    }
  }, [existingMembers.length]);

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
          const modState = modPerms[mod.key] || {};
          for (const perm of VALID_PERMS) {
            overrides.push({ module: mod.key, field_name: null, permission: perm, granted: !!modState[perm] });
          }
        }
        // PUT /permission-groups/:groupId/members/:employeeId/overrides
        // Writes to employee_permission_overrides ONLY — group table untouched
        await pgApi.setOverrides(group!.id, overrideMemberId!, overrides);
        return;
      }

      // ── NORMAL GROUP EDIT: update the group's permissions for all members ──
      const slugs = modulePermsToSlugs(modPerms);
      if (isNew) {
        const r = await pgApi.create({ name, description: desc, color: colorKey });
        const newId = r.data.id;
        await pgApi.setPerms(newId, slugs);
        for (const uid of selMembers) { try { await pgApi.addMember(newId, uid); } catch {} }
        return r;
      } else {
        await pgApi.update(group!.id, { name, description: desc, color: colorKey });
        await pgApi.setPerms(group!.id, slugs);
        const existing = new Set(existingMembers.map((m: any) => m.id)); // employee_id — no users table
        const toAdd = [...selMembers].filter(id => !existing.has(id));
        const toRm  = [...existing].filter(id  => !selMembers.has(id));
        for (const uid of toAdd) { try { await pgApi.addMember(group!.id, uid);    } catch {} }
        for (const uid of toRm)  { try { await pgApi.removeMember(group!.id, uid); } catch {} }
      }
    },
    onSuccess: (data: any) => {
      if (isOverrideMode && group?.id && overrideMemberId) {
        // Backend re-issues a fresh access token with merged permissions.
        // Dispatch to Redux immediately — portal canView()/canEdit() update without re-login.
        if (data?.accessToken) dispatch(updateToken(data.accessToken));
        if (data?.permissions) dispatch(setPermissions(data.permissions));
        qc.refetchQueries({ queryKey: ['rp', 'employee-overrides', group.id, overrideMemberId] });
        showToast('✓ Employee override saved');
      } else {
        qc.refetchQueries({ queryKey: ['rp', 'groups'] });
        qc.refetchQueries({ queryKey: ['rp', 'group-perms', group?.id] });
        showToast(isNew ? '✓ Group created' : '✓ Group updated');
        onBack();
      }
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

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
        <button className="btn btn-pri btn-sm" onClick={() => saveMutation.mutate()} disabled={(isOverrideMode ? false : !name.trim()) || saveMutation.isPending}>
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
            <MemberPicker
              selected={selMembers}
              onToggle={(id, on) => setSelMembers(prev => { const n = new Set(prev); on ? n.add(id) : n.delete(id); return n; })}
            />
          </div>
        )}

        {/* Col 2: Module permission matrix — new UI with All col + section grouping */}
        <ModuleMatrix modPerms={modPerms} onChange={setModPerms} isOverrideMode={isOverrideMode} />

        {/* Col 3: Summary */}
        <PermSummary modPerms={modPerms} />
      </div>
    </div>
  );
}

// ─── Existing FieldPermissionsView (unchanged — only wired into new nav) ──────

const FP_FIELD_MODULES = [
  { key: 'employee', label: 'Employee Directory', sub: 'Personal data, statutory, bank, payroll fields', fields: [
    { k: 'full_name',          label: 'Full Name',       section: 'Personal'  },
    { k: 'date_of_birth',      label: 'Date of Birth',   section: 'Personal'  },
    { k: 'gender',             label: 'Gender',          section: 'Personal'  },
    { k: 'personal_email',     label: 'Personal Email',  section: 'Personal'  },
    { k: 'phone',              label: 'Phone',           section: 'Personal'  },
    { k: 'address_line1',      label: 'Address',         section: 'Address'   },
    { k: 'city',               label: 'City',            section: 'Address'   },
    { k: 'aadhaar_number',     label: 'Aadhaar Number',  section: 'Statutory', sensitive: true },
    { k: 'pan_number',         label: 'PAN Number',      section: 'Statutory', sensitive: true },
    { k: 'bank_account_number',label: 'Bank Account',    section: 'Statutory', sensitive: true },
    { k: 'basic_salary',       label: 'Basic Salary',    section: 'Payroll',  sensitive: true },
    { k: 'net_pay',            label: 'Net Pay',         section: 'Payroll',  sensitive: true },
    { k: 'pf_number',          label: 'PF Number',       section: 'Statutory', sensitive: true },
    { k: 'esi_number',         label: 'ESI Number',      section: 'Statutory', sensitive: true },
  ]},
  { key: 'candidate', label: 'Candidate / ATS', sub: 'Resume, offer, aptitude data', fields: [
    { k: 'candidate_name',  label: 'Candidate Name',  section: 'Basic'              },
    { k: 'email',           label: 'Email',           section: 'Basic'              },
    { k: 'phone_number',    label: 'Phone',           section: 'Basic'              },
    { k: 'current_salary',  label: 'Current Salary',  section: 'Offer', sensitive: true },
    { k: 'expected_salary', label: 'Expected Salary', section: 'Offer', sensitive: true },
    { k: 'offered_ctc',     label: 'Offered CTC',     section: 'Offer', sensitive: true },
    { k: 'resume_url',      label: 'Resume',          section: 'Basic'              },
    { k: 'aadhaar',         label: 'Aadhaar',         section: 'KYC',  sensitive: true },
    { k: 'pan',             label: 'PAN',             section: 'KYC',  sensitive: true },
  ]},
  { key: 'payroll', label: 'Payroll', sub: 'Salary breakup and payslip data', fields: [
    { k: 'basic',   label: 'Basic',     section: 'Components'                    },
    { k: 'hra',     label: 'HRA',       section: 'Components'                    },
    { k: 'gross',   label: 'Gross Pay', section: 'Summary',   sensitive: true },
    { k: 'tds',     label: 'TDS',       section: 'Deductions',sensitive: true },
    { k: 'net_pay', label: 'Net Pay',   section: 'Summary',   sensitive: true },
  ]},
];

type FPPermission = { view: boolean; create: boolean; edit: boolean; delete: boolean; download: boolean };
type FPPerms = Record<string, FPPermission>;

function FieldPermissionsView({ groupId, onBack }: { groupId: number; onBack: () => void }) {
  const { data: groups = [] } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [selectedModKey,  setSelectedModKey]  = useState(FP_FIELD_MODULES[0].key);
  const [fp, setFp]     = useState<FPPerms>({});
  const [dirty, setDirty] = useState(false);

  const selMod = FP_FIELD_MODULES.find(m => m.key === selectedModKey)!;

  useEffect(() => {
    const init: FPPerms = {};
    for (const m of FP_FIELD_MODULES) {
      for (const f of m.fields) {
        init[`${m.key}:${f.k}`] = { view: true, create: !f.sensitive, edit: !f.sensitive, delete: !f.sensitive, download: !f.sensitive };
      }
    }
    setFp(init);
  }, [selectedGroupId]);

  const toggleFP = (key: string, perm: keyof FPPermission) => {
    setFp(prev => ({ ...prev, [key]: { ...prev[key], [perm]: !prev[key]?.[perm] } }));
    setDirty(true);
  };

  const grantAll  = () => { setFp(prev => { const n = { ...prev }; for (const f of selMod.fields) n[`${selMod.key}:${f.k}`] = { view: true, create: true, edit: true, delete: true, download: true }; return n; }); setDirty(true); };
  const revokeAll = () => { setFp(prev => { const n = { ...prev }; for (const f of selMod.fields) n[`${selMod.key}:${f.k}`] = { view: false, create: false, edit: false, delete: false, download: false }; return n; }); setDirty(true); };
  const save = () => { showToast('✓ Field permissions saved'); setDirty(false); };

  const sections: Record<string, typeof selMod.fields> = {};
  for (const f of selMod.fields) (sections[f.section] = sections[f.section] || []).push(f);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Groups</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>Field-Level Permissions</div>
        <select value={selectedGroupId} onChange={e => setSelectedGroupId(Number(e.target.value))}
          style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: 12 }}>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        {dirty && <button className="btn btn-pri btn-sm" onClick={save}>✓ Save Changes</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 14 }}>
        {/* Module nav */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)' }}>Modules</div>
          <div style={{ padding: '6px 0' }}>
            {FP_FIELD_MODULES.map(m => (
              <div key={m.key} onClick={() => setSelectedModKey(m.key)}
                style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedModKey === m.key ? 600 : 400, color: selectedModKey === m.key ? 'var(--blue)' : 'var(--ink3)', background: selectedModKey === m.key ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${selectedModKey === m.key ? 'var(--blue)' : 'transparent'}` }}>
                {m.label}
                <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 400 }}>{m.fields.length} fields</div>
              </div>
            ))}
          </div>
        </div>

        {/* Field table */}
        <div>
          <div style={{ background: 'var(--blue)', color: '#fff', borderRadius: 'var(--r2)', padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{selMod.label}</div>
              <div style={{ fontSize: 11, opacity: .8, marginTop: 2 }}>{selMod.sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.2)', borderColor: 'rgba(255,255,255,.3)', color: '#fff', fontSize: 11 }} onClick={grantAll}>✓ Grant All</button>
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', borderColor: 'rgba(255,255,255,.25)', color: '#fff', fontSize: 11 }} onClick={revokeAll}>✕ Revoke All</button>
            </div>
          </div>
          {Object.entries(sections).map(([section, fields]) => (
            <div key={section} className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)' }}>{section}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '7px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)' }}>Field</th>
                    {PERMS.map(p => (
                      <th key={p} style={{ padding: '7px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink4)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{PERM_LABELS[p]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map(f => {
                    const fk  = `${selMod.key}:${f.k}`;
                    const fpf = fp[fk] || { view: true, create: false, edit: false, delete: false, download: false };
                    return (
                      <tr key={f.k} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                          {f.label}
                          {(f as any).sensitive && <span style={{ fontSize: 9, marginLeft: 6, color: 'var(--amber)', background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>SENSITIVE</span>}
                        </td>
                        {PERMS.map(p => (
                          <td key={p} style={{ padding: '7px 6px', textAlign: 'center' }}>
                            <PermToggle on={!!(fpf as any)[p]} onClick={() => toggleFP(fk, p as keyof FPPermission)} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Legend + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card cp">
            <div className="ct" style={{ marginBottom: 12 }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <PermToggle on={true} />
                <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Allowed</div><div style={{ fontSize: 10, color: 'var(--ink4)' }}>Permission is granted</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <PermToggle on={false} />
                <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Denied</div><div style={{ fontSize: 10, color: 'var(--ink4)' }}>Permission is blocked</div></div>
              </div>
            </div>
          </div>
          <div className="card cp">
            <div className="ct" style={{ marginBottom: 10 }}>Module Stats</div>
            {PERMS.map(p => {
              const on = selMod.fields.filter(f => fp[`${selMod.key}:${f.k}`]?.[p as keyof FPPermission]).length;
              return (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>{PERM_ICONS[p]} {PERM_LABELS[p]}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: on > 0 ? 'var(--blue)' : 'var(--ink4)' }}>{on}/{selMod.fields.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────

export default function RolesPermissionsPage() {
  const dispatch  = useAppDispatch();
  const { canView, canEdit, canCreate, canDelete } = usePermission();
  const { companyId } = useCompanySelector();
  const qc = useQueryClient();

  const { data: groups = [], isLoading } = useGroups();

  // View state
  const [view,         setView]         = useState<View>('groups');
  const [editGroup,    setEditGroup]     = useState<PermGroup | null>(null);
  const [fpGroupId,    setFpGroupId]     = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PermGroup | null>(null);

  // NEW UI state
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  // Derived live from query — always reflects server state after any refetch
  const selectedGroup = groups.find(g => g.id === activeGroupId) ?? groups[0] ?? null;
  const [addPersonOpen,    setAddPersonOpen]    = useState(false);
  const [memberOverrides,  setMemberOverrides]  = useState<Record<number, boolean>>({});

  // Override mode — opens EditView for a specific member
  const [overrideMemberId,   setOverrideMemberId]   = useState<number | undefined>();
  const [overrideMemberName, setOverrideMemberName] = useState<string | undefined>();

  const { data: employees = [] } = useEmployees();

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Roles & Permissions', breadcrumb: 'Settings' }));
  }, [dispatch]);

  // Load members for all groups using existing pattern
  const memberQueries = useQueries({
    queries: groups.map(g => ({
      queryKey: ['rp', 'group-members', g.id],
      queryFn:  () => pgApi.getMembers(g.id),
      enabled:  !!g.id,
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
    queryFn:  () => apiClient.get<any, any>(`/permission-groups/stats?company_id=${companyId}`),
    enabled:  !!companyId,
    select:   (r: any) => r.data,
  });

  const totalAssigned  = groups.reduce((s, g) => s + (groupMembersMap[g.id]?.length || 0), 0);
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
    mutationFn: ({ groupId, empId }: { groupId: number; empId: number }) => pgApi.addMember(groupId, empId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp', 'group-members'] }); showToast('✓ Member added'); setAddPersonOpen(false); },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, empId }: { groupId: number; empId: number }) => pgApi.removeMember(groupId, empId),
    onSuccess: () => {
      // The backend emits 'permissions:updated' directly to the removed employee's
      // socket room (employee_${empId}). Their browser calls /auth/me and updates.
      // Here we only refresh the admin's member list UI.
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast('Member removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const handleToggleOverrides = (memberId: number) => {
    setMemberOverrides(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleEditOverride = (memberId: number) => {
    const member = groupMembersMap[selectedGroup?.id || 0]?.find((m: any) => m.id === memberId);
    const name   = member ? `${member.first_name} ${member.last_name}`.trim() : '';
    setOverrideMemberId(memberId);
    setOverrideMemberName(name);
    setView('edit');
  };

  // Views
  if (view === 'edit') return (
    <AppShell>
      <div className="pg-enter">
        <EditView
          group={overrideMemberId ? selectedGroup : editGroup}
          onBack={() => { setView('groups'); setEditGroup(null); setOverrideMemberId(undefined); setOverrideMemberName(undefined); }}
          overrideMemberId={overrideMemberId}
          overrideMemberName={overrideMemberName}
          groupName={selectedGroup?.name}
        />
      </div>
    </AppShell>
  );

  if (view === 'field-perms') return (
    <AppShell>
      <div className="pg-enter">
        <FieldPermissionsView groupId={fpGroupId} onBack={() => setView('groups')} />
      </div>
    </AppShell>
  );

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
              { label: 'Permission Groups',  value: stats?.totalGroups ?? groups.length, color: 'var(--blue)'   },
              { label: 'Employees Assigned', value: totalAssigned ?? '—',                 color: 'var(--green)'  },
              { label: 'Unassigned',         value: stats?.unassigned ?? '—',             color: 'var(--amber)'  },
              { label: 'Field Rules',        value: fieldRuleCount ?? '—',                color: 'var(--purple)' },
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
                  onFieldPerms={() => { setFpGroupId(selectedGroup.id); setView('field-perms'); }}
                  onDelete={() => setDeleteTarget(selectedGroup)}
                  addPersonOpen={addPersonOpen}
                  setAddPersonOpen={setAddPersonOpen}
                  onAddMember={empId => addMemberMutation.mutate({ groupId: selectedGroup.id, empId })}
                  onRemoveMember={empId => removeMemberMutation.mutate({ groupId: selectedGroup.id, empId })}
                  employees={employees}
                  overrides={memberOverrides}
                  onToggleOverrides={handleToggleOverrides}
                  onEditOverride={handleEditOverride}
                  onDeleteOverride={() => {}}
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
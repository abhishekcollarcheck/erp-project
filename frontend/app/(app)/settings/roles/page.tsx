'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { updateToken, setPermissions, selectManagedCompanies } from '../../../../store/slices/authSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Modal } from '../../../../components/ui/Modal';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { showToast } from '../../../../utils/toast';
import { Eye, SquarePen, Trash2, Download, Pen } from 'lucide-react';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { PageHeaderWithCompany } from '../../../../components/company/CompanySelector';
import { PermissionGuard } from '../../../../utils/permissionGuard';
import { useCompanyModulesMap } from '../../../../hooks/useCompanyModulesMap';
import { pgApi } from '../../../../features/setting/services/permissions.services';
import { PermGroup } from '../../../../features/setting/types/permissions.types';


type View = 'groups' | 'edit';

interface Form {
  id: number;
  name: string;
  fields?: Array<{
    id: number;
    field_key: string;
    name: string;
    [key: string]: any;
  }>;
  moduleId?: number;
  moduleName?: string;
  moduleKey?: string;
  [key: string]: any;
}

interface Module {
  id: number;
  name: string;
  slug?: string;
  permission_key?: string;
  [key: string]: any;
}

// Only module-level permissions (field-level is separate)
const PERMS = ['view', 'create', 'edit', 'delete', 'download'] as const;

// Module list is driven by the API (/permission-groups/company-modules).
// Never hardcode module keys here — unknown keys get dropped on save.
export type ModuleDef = { key: string; label: string };

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

// Fallback when a field's label isn't in the loaded form data:
// department_name → Department Name
function humanizeFieldKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function cssForKey(key: string | null | undefined): string {
  return COLOR_OPTS.find((c) => c.key === key)?.css || key || 'var(--blue)';
}


// ─── Queries ──────────────────────────────────────────────────────────────────

function useGroups() {
  return useQuery({ queryKey: ['rp', 'groups'], queryFn: () => pgApi.list(), staleTime: 0, select: r => r.data ?? [] });
}
function useGroupPerms(id: number) {
  return useQuery({ queryKey: ['rp', 'group-perms', id], queryFn: () => pgApi.getPerms(id), enabled: id > 0, select: r => r.data ?? [] });
}
function useEmployees() {
  return useQuery({ queryKey: ['employees-light'], queryFn: () => pgApi.employees(), staleTime: 5 * 60_000, select: r => r.data ?? [] });
}

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

function useGroupFieldPermissions(formId: number, groupId: number, companyId: number) {
  return useQuery({
    queryKey: ['group-field-perms', formId, groupId, companyId],
    queryFn: () => pgApi.groupFieldPermissions(formId, groupId, companyId),
    enabled: formId > 0 && groupId > 0 && companyId > 0,
    select: r => r.data,
  });
}

// Permission-module list — the single source of truth for the module matrix.
// Sourced from the HrModule catalog (our module system) — NOT the old
// CompanyModule/company_modules table anymore. Shape kept identical
// ({key,label}[]) so every downstream consumer (slugsToModulePerms,
// modulePermsToSlugs, the matrix UI) needs no changes.
function useModuleList() {
  return useQuery({
    queryKey: ['rp', 'company-modules'],
    queryFn: () => pgApi.listModules(),
    staleTime: 5 * 60_000,
    select: (r: any): ModuleDef[] =>
      ((r.data ?? []) as any[]).map(m => ({ key: m.permission_key ?? m.slug, label: m.name })),
  });
}

// HrModule rows — these carry permission_key, which joins the form/field side
// to the permission-module keys used by the matrix. Shared cache key so the
// override panel and the field panel don't double-fetch.
function useHrModules() {
  return useQuery({
    queryKey: ['field-perm-modules'],
    queryFn: () => pgApi.listModules(),
    select: (r: any): Module[] => r.data ?? [],
    staleTime: 5 * 60_000,
  });
}

function useAllModuleForms(modules: Module[], enabled = true) {
  return useQueries({
    queries: modules.map(module => ({
      queryKey: ['field-perm-forms', module.id],
      queryFn: () => pgApi.listForms(module.id),
      enabled: enabled && modules.length > 0,
      select: (r: any): Form[] => (Array.isArray(r.data) ? r.data : []),
    })),
  });
}

function useEmployeeFieldOverrides(groupId: number, employeeId: number | undefined, companyId: number | undefined, module: string) {
  return useQuery({
    queryKey: ['field-overrides', groupId, employeeId, companyId, module],
    queryFn: () => pgApi.listFieldOverrides(groupId, employeeId!, companyId!, module),
    enabled: !!employeeId && !!companyId && groupId > 0 && !!module,
    select: r => r.data ?? {},
    staleTime: 0,
  });
}

// ─── slug ↔ modPerms helpers ──────────────────────────────────────────────────

function initModulePerms(modules: ModuleDef[], on = false): ModulePerms {
  const out: ModulePerms = {};
  for (const m of modules) {
    out[m.key] = {};
    for (const p of PERMS) out[m.key][p] = on;
  }
  return out;
}

// Counts DISTINCT module keys with `perm` on — not array entries. Two
// different HrModule catalog rows can share the same key (permission_key
// collisions via HR_MODULE_TO_PERM_KEY, or two modules whose slugs both
// resolve to the same passthrough key), and modulePermsToSlugs already
// dedupes by key when saving (`new Set(out)`) — this makes counting match
// what actually gets saved instead of over-counting duplicates.
function countPerm(mp: ModulePerms, perm: string, modules: ModuleDef[]) {
  const keys = new Set(modules.map(m => m.key));
  let n = 0;
  for (const key of keys) if (mp[key]?.[perm]) n++;
  return n;
}

// Distinct module count — same dedup basis as countPerm, so a "X / Y" denominator
// never shows more slots than actually exist as distinct permission keys.
function distinctModuleCount(modules: ModuleDef[]) {
  return new Set(modules.map(m => m.key)).size;
}

function slugsToModulePerms(slugs: string[], modules: ModuleDef[]): ModulePerms {
  const mp = initModulePerms(modules, false);
  for (const slug of slugs) {
    const [mod, action] = slug.split(':');
    if (mp[mod] && action) mp[mod][action] = true;
  }
  return mp;
}

// originalSlugs passthrough: never drop permissions for modules the client
// doesn't know about — setPermissions destroys-then-recreates from this array.
function modulePermsToSlugs(
  mp: ModulePerms, modules: ModuleDef[], originalSlugs: string[] = [],
): string[] {
  const known = new Set(modules.map(m => m.key));
  const out = originalSlugs.filter(s => !known.has(s.split(':')[0]));
  for (const m of modules) {
    for (const p of PERMS) if (mp[m.key]?.[p]) out.push(`${m.key}:${p}`);
  }
  return [...new Set(out)];
}

// ─── PermToggle ───────────────────────────────────────────────────────────────

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 24, fontSize = 8 }: { name: string; size?: number; fontSize?: number }) {
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ─── Left sidebar group list ─────────────────────────────────────────────────

function GroupSidebar({
  groups, selectedId, onSelect, onNew, membersMap,
}: {
  groups: PermGroup[];
  selectedId: number | null;
  onSelect: (g: PermGroup) => void;
  onNew?: () => void;
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
      {onNew && (
        <button className="btn btn-sec btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={onNew}>
          + New Group
        </button>
      )}
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
  const visible = notMembers.slice(0, 20);

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
          {visible.map((e: any) => {
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
          {notMembers.length > visible.length && (
            <div style={{ fontSize: 10, color: 'var(--ink4)', textAlign: 'center', padding: '6px 0' }}>
              Showing {visible.length} of {notMembers.length} — refine your search
            </div>
          )}
        </div>
      </div>

      {/* Company scope chips */}
      <div className="fg" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6, display: 'block' }}>Company Scope</label>
        {assignedCompanies.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--ink4)', fontStyle: 'italic' }}>
            No companies available — you don&apos;t manage any company yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {assignedCompanies.map(co => (
              <span key={co.id} onClick={() => toggleChip(co.id)}
                style={chipStyle(!allCompanies && selectedCompanies.has(co.id))}>
                {co.name}
              </span>
            ))}
            <span onClick={toggleAll} style={chipStyle(allCompanies, true)}>
              🌐 All companies
            </span>
          </div>
        )}
      </div>

      <button className="btn btn-pri btn-sm" onClick={handleAdd} disabled={!canAdd}
        style={{ opacity: canAdd ? 1 : 0.5 }}>
        ✓ Add to Group
      </button>
    </div>
  );
}

// ─── MemberCompanyBadges ──────────────────────────────────────────────────────

function MemberCompanyBadges({ member, assignedCompanies, onRemoveCompany }: {
  member: any;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  onRemoveCompany: (companyId: number) => void;
}) {
  if (!member.assigned_company_ids?.length) return null;

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

// ─── Right detail panel for selected group ────────────────────────────────────

function GroupDetail({
  group, members, onEdit, onDelete,
  addPersonOpen, setAddPersonOpen,
  onAddMember, onRemoveMember, employees, assignedCompanies,
  overrides, onToggleOverrides, onEditOverride, modules,
}: {
  group: PermGroup;
  members: any[];
  onEdit?: () => void;
  onDelete?: () => void;
  addPersonOpen: boolean;
  setAddPersonOpen: (v: boolean) => void;
  onAddMember: (empId: number, companyIds: number[]) => void;
  onRemoveMember: (empId: number) => void;
  employees: any[];
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrides: Record<string, boolean>;
  onToggleOverrides: (memberId: number) => void;
  onEditOverride: (memberId: number) => void;
  modules: ModuleDef[];
}) {
  const slugs = group.permissions?.map(p => p.slug) || [];
  const modPerms = slugsToModulePerms(slugs, modules);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const [addCompanyFor, setAddCompanyFor] = useState<number | null>(null);
  const [selectedNewCompanies, setSelectedNewCompanies] = useState<Set<number>>(new Set());

  const { data: groupSlugs = [] } = useGroupPerms(group.id);
  const groupBaseModPerms = useMemo(() => slugsToModulePerms(groupSlugs, modules), [groupSlugs, modules]);
  const { data: hrModules = [] } = useHrModules();

  const permSummary = useMemo(
    () => PERMS.map(p => ({ p, count: countPerm(modPerms, p, modules) })).filter(x => x.count > 0),
    [slugs.join(','), modules],
  );

  const notMembers = useMemo(() => {
    const memberIds = new Set(members.map((m: any) => m.id));
    const q = search.trim().toLowerCase();
    return employees.filter((e: any) => !memberIds.has(e.id) && (
      !q ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      `${e.employee_code || ''}`.toLowerCase().includes(q)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberCompanyPairs, overrideQueries.map(q => q.dataUpdatedAt).join(',')]);

  // ── Field-level overrides, same shape as the module-level ones above ──
  // Only modules the group can actually view can carry field rules, so the
  // fan-out is bounded by granted modules and only fires when a panel is open.
  const grantedModules = useMemo(
    () => hrModules.filter((m: Module) => {
      const k = (m.permission_key ?? m.slug) as string;
      return !!k && !!groupBaseModPerms[k]?.view;
    }),
    [hrModules, groupBaseModPerms],
  );

  const grantedModuleKeys = useMemo(
    () => grantedModules.map((m: Module) => (m.permission_key ?? m.slug) as string),
    [grantedModules],
  );

  // Only fetch form/field metadata once a panel is actually expanded.
  const anyOverridePanelOpen = Object.values(overrides).some(Boolean);
  const grantedFormsQueries = useAllModuleForms(grantedModules, anyOverridePanelOpen);

  // field_key → human label, sourced from the same forms the field panel uses.
  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of grantedFormsQueries) {
      for (const form of ((q.data || []) as Form[])) {
        for (const fl of (form.fields || [])) {
          if (fl?.field_key) map[fl.field_key] = (fl as any).label || fl.name || fl.field_key;
        }
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantedFormsQueries.map(q => q.dataUpdatedAt).join(',')]);

  const fieldOverrideTargets = useMemo(
    () => memberCompanyPairs.flatMap(pair =>
      grantedModuleKeys.map(moduleKey => ({ ...pair, moduleKey }))
    ),
    [memberCompanyPairs, grantedModuleKeys],
  );

  const fieldOverrideQueries = useQueries({
    queries: fieldOverrideTargets.map(({ memberId, companyId, moduleKey }) => ({
      queryKey: ['group-field-overrides', group?.id, memberId, companyId, moduleKey],
      queryFn: () => pgApi.listFieldOverrides(group!.id, memberId, companyId, moduleKey),
      enabled: !!group && overrides[memberId] === true,
    })),
  });

  // An override row only exists because it differs from the group baseline,
  // so `previous` is always the inverse of the stored value — no extra fetch.
  const memberFieldOverridesMap = useMemo(() => {
    const map: Record<number, Record<number, { moduleKey: string; fields: { fieldKey: string; fieldLabel: string; changes: { permission: string; previous: boolean; current: boolean }[] }[] }[]>> = {};
    fieldOverrideTargets.forEach((target, idx) => {
      const raw = (fieldOverrideQueries[idx]?.data as any)?.data || {};
      const fields = Object.entries(raw).map(([fieldKey, perms]) => ({
        fieldKey,
        fieldLabel: fieldLabelMap[fieldKey] || humanizeFieldKey(fieldKey),
        changes: Object.entries(perms as Record<string, boolean>).map(([permission, granted]) => ({
          permission, previous: !granted, current: !!granted,
        })),
      })).filter(f => f.changes.length > 0);
      if (!fields.length) return;
      if (!map[target.memberId]) map[target.memberId] = {};
      if (!map[target.memberId][target.companyId]) map[target.memberId][target.companyId] = [];
      map[target.memberId][target.companyId].push({ moduleKey: target.moduleKey, fields });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldOverrideTargets, fieldLabelMap, fieldOverrideQueries.map(q => q.dataUpdatedAt).join(',')]);

  const deleteModuleOverridesMutation = useMutation({
    mutationFn: async ({ memberId, companyId, overrideIds }: { memberId: number; companyId: number; overrideIds: number[] }) => {
      await Promise.all(overrideIds.map((overrideId) => pgApi.deleteOverride(group!.id, memberId, overrideId)));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['group-overrides', group!.id, vars.memberId, vars.companyId] });
      qc.invalidateQueries({ queryKey: ['rp', 'employee-overrides', group!.id, vars.memberId, vars.companyId] });
      showToast('✓ Override removed');
    },
    onError: (e: any) => showToast(e?.message || 'Failed to remove override'),
  });

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

  return (
    <div className="card" style={{ overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: cssForKey(group.color), flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{group.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 2 }}>{group.description || 'No description'}</div>
        </div>
        {onEdit && <button className="btn btn-sec btn-sm" onClick={onEdit}>✎ Edit Permissions</button>}
        {onDelete && !group.is_system && (
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
                  return acc;
                }, {})
              );
              const fieldRows = (memberFieldOverridesMap[memberId] || {})[companyId] || [];
              return { companyId, companyName: co?.name || `Company ${companyId}`, moduleRows: grouped, fieldRows };
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

                  <MemberCompanyBadges member={m} assignedCompanies={assignedCompanies} onRemoveCompany={(companyId) => handleRemoveCompany(m, companyId)} />

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onToggleOverrides(memberId)}
                    title="View permission overrides"
                    aria-label={`View permission overrides for ${name}`}
                    style={{ fontSize: 11 }}
                  >
                    ☷ Overrides
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onRemoveMember(memberId)}
                    style={{ color: 'var(--red)', fontSize: 11 }}
                    title="Remove from group"
                    aria-label={`Remove ${name} from group`}
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
                      These exceptions apply only to {m.first_name} — everyone else in <strong>{group.name}</strong> keeps the group&apos;s default permissions.
                    </div>
                    {groupedOverridesByCompany.map(({ companyId, companyName, moduleRows, fieldRows }) => (
                      (moduleRows.length > 0 || fieldRows.length > 0) && (
                        <div key={companyId} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                            {companyName}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {moduleRows.map((mod: any) => (
                              <div key={mod.module} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                    {modules.find(x => x.key === mod.module)?.label || mod.module}
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
                                  aria-label="Edit this override"
                                >
                                  ✎
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--red)' }}
                                  title="Delete this override"
                                  aria-label="Delete this override"
                                  disabled={deleteModuleOverridesMutation.isPending}
                                  onClick={() => { deleteModuleOverridesMutation.mutate({ memberId, companyId, overrideIds: mod.overrideIds }); }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            {fieldRows.map(({ moduleKey, fields }) => (
                              <div key={`f-${moduleKey}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11 }}>
                                <div style={{ fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', color: 'var(--ink4)' }}>
                                    Field
                                  </span>
                                  {modules.find(x => x.key === moduleKey)?.label || moduleKey}
                                </div>
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {fields.map(f => (
                                    <div key={f.fieldKey} style={{ color: 'var(--ink3)' }}>
                                      <strong style={{ color: 'var(--ink2)' }} title={f.fieldKey}>{f.fieldLabel}</strong>
                                      {' — '}
                                      {f.changes.map((c, idx) => (
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
                                          {idx < f.changes.length - 1 ? ', ' : ''}
                                        </span>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: 10 }}
                                    onClick={() => onEditOverride(memberId)}
                                    title="Edit field overrides"
                                    aria-label="Edit field overrides"
                                  >
                                    ✎
                                  </button>
                                </div>
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
                          setSelectedNewCompanies(new Set());
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

// ─── Module matrix ────────────────────────────────────────────────────────────

function ModuleMatrix({ modPerms, onChange, isOverrideMode = false, moduleCompanyMap, assignedCompanies, overrideTargetCompanyIds, modules }: {
  modPerms: ModulePerms;
  onChange: (mp: ModulePerms) => void;
  isOverrideMode?: boolean;
  moduleCompanyMap: Record<string, { label: string; companies: any[] }>;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  overrideTargetCompanyIds?: number[];
  modules: ModuleDef[];
}) {
 
  const [companyFilter, setCompanyFilter] = useState<number | 'all'>('all');

  const toggle = (mod: string, perm: string) => {
    const current = modPerms[mod] || {};

    const next: Record<string, boolean> = {
      ...current,
      [perm]: !current[perm],
    };

    // Any permission except View automatically enables View
    if (perm !== 'view' && next[perm]) {
      next.view = true;
    }

    // Turning View OFF removes every dependent permission
    if (perm === 'view' && !next.view) {
      next.create = false;
      next.edit = false;
      next.delete = false;
      next.download = false;
    }

    onChange({ ...modPerms, [mod]: next });
  };

  const toggleRow = (modKey: string) => {
    const current = modPerms[modKey] || {};
    const allEnabled = PERMS.every(p => current[p]);
    const next: Record<string, boolean> = allEnabled
      ? { view: false, create: false, edit: false, delete: false, download: false }
      : { view: true, create: true, edit: true, delete: true, download: true };

    onChange({ ...modPerms, [modKey]: next });
  };

  const setAll = (on: boolean) => onChange(initModulePerms(modules, on));

  const visibleModules = modules.filter(m => {
    if (companyFilter === 'all') return true;
    return (moduleCompanyMap[m.key]?.companies || []).some(co => co.id === companyFilter);
  });


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
            🌐 All companies
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
          <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}>
            (filters the list — permissions are shared across companies)
          </span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink4)', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>Module</th>
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
            {visibleModules.length === 0 && (
              <tr>
                <td colSpan={PERMS.length + 2} style={{ padding: 20, textAlign: 'center', color: 'var(--ink4)', fontSize: 12 }}>
                  No modules available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PermSummary ──────────────────────────────────────────────────────────────

function PermSummary({ modPerms, modules, isOverrideMode = false }: {
  modPerms: ModulePerms; modules: ModuleDef[]; isOverrideMode?: boolean;
}) {
  return (
    <div className="card cp">
      <div className="ct" style={{ marginBottom: 12 }}>Permission Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {PERMS.map(p => {
          const count = countPerm(modPerms, p, modules);
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 5 }}>{PERM_ICONS[p]} {PERM_LABELS[p]}</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: count > 0 ? 'var(--blue)' : 'var(--ink4)' }}>
                {count} / {distinctModuleCount(modules)}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--ink4)' }}>
        {isOverrideMode
          ? 'Overrides differ from group defaults only where toggled.'
          : 'Shared baseline across all companies this group applies to.'}
      </div>
    </div>
  );
}

// ─── EditView ─────────────────────────────────────────────────────────────────

function EditView({
  group, onBack,
  overrideMemberId, overrideMemberName, overrideMemberCompanyId, overrideMemberCompanyIds,
  groupName, moduleCompanyMap, assignedCompanies, modules,
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
  modules: ModuleDef[];
}) {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const isNew = !group;
  const isOverrideMode = !!overrideMemberId;

  const [name, setName] = useState(group?.name || '');
  const [desc, setDesc] = useState(group?.description || '');
  const [colorKey, setColorKey] = useState(group?.color || 'blue');
  const [modPerms, setModPerms] = useState<ModulePerms>({});
  const [baseModPerms, setBaseModPerms] = useState<ModulePerms>({});
  const [baseLoaded, setBaseLoaded] = useState(false);

  const { data: existingSlugs = [] } = useGroupPerms(group?.id || 0);
  const { data: savedOverrides = [] } = useEmployeeOverrides(group?.id || 0, overrideMemberId, overrideMemberCompanyId);

  const [selectedOverrideCompanyIds, setSelectedOverrideCompanyIds] = useState<number[]>(
    overrideMemberCompanyId ? [overrideMemberCompanyId] : []
  );

  // Field-permission save is registered by the panel and flushed by this view's save.
  const fieldSaveRef = useRef<null | ((createdGroupId?: number) => Promise<any>)>(null);

  useEffect(() => {
    if (overrideMemberCompanyId) {
      setSelectedOverrideCompanyIds([overrideMemberCompanyId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideMemberId]);

  // Effect A: load the group baseline. Must wait for the module list, otherwise
  // slugsToModulePerms builds an empty matrix and every toggle renders off.
  useEffect(() => {
    if (!modules.length) return;
    if (!group) { setBaseModPerms({}); setModPerms({}); setBaseLoaded(true); return; }
    const mp = slugsToModulePerms(existingSlugs || [], modules);
    setBaseModPerms(mp);
    setModPerms(mp);
    setBaseLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, existingSlugs.join(','), modules]);

  // Effect B: apply saved employee overrides on top of the baseline.
  useEffect(() => {
    if (!baseLoaded || !isOverrideMode) return;
    setModPerms(() => {
      const mp: ModulePerms = {};
      for (const k of Object.keys(baseModPerms)) mp[k] = { ...baseModPerms[k] };
      for (const o of savedOverrides) {
        if (mp[o.module]) {
          mp[o.module] = { ...mp[o.module], [o.permission]: o.granted };
        }
      }
      return mp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedOverrides.map((o: any) => `${o.module}:${o.permission}:${o.granted}`).join(','), baseLoaded, isOverrideMode]);

  const saveMutation = useMutation({
    mutationFn: async () => {

      // ── OVERRIDE MODE: update only THIS employee's overrides, never the group ──
      if (isOverrideMode) {
        const overrides: { module: string; field_name: null; permission: string; granted: boolean }[] = [];
        for (const mod of modules) {
          const currentModule = modPerms[mod.key] || {};
          const baseModule = baseModPerms[mod.key] || {};

          for (const perm of PERMS) {
            const currentValue = !!currentModule[perm];
            const baseValue = !!baseModule[perm];
            if (currentValue !== baseValue) {
              overrides.push({ module: mod.key, field_name: null, permission: perm, granted: currentValue });
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
        await fieldSaveRef.current?.();
        return;
      }

      // ── NORMAL GROUP EDIT ──
      // existingSlugs passthrough keeps permissions for modules not in the UI list.
      const slugs = modulePermsToSlugs(modPerms, modules, existingSlugs);

      if (isNew) {
        const r = await pgApi.create({ name, description: desc, color: colorKey });
        const newId = r.data.id;
        await pgApi.setPerms(newId, slugs);
        // Field rules were staged before the group existed — apply them now.
        await fieldSaveRef.current?.(newId);
        return r;
      }
      await pgApi.update(group!.id, { name, description: desc, color: colorKey });
      await pgApi.setPerms(group!.id, slugs);
      await fieldSaveRef.current?.();
    },
    onSuccess: (data: any) => {
      if (isOverrideMode && group?.id && overrideMemberId) {
        if (data?.accessToken) dispatch(updateToken(data.accessToken));
        if (data?.permissions) dispatch(setPermissions(data.permissions));

        const targetCompanyIds = selectedOverrideCompanyIds.length > 0
          ? selectedOverrideCompanyIds
          : (overrideMemberCompanyId ? [overrideMemberCompanyId] : []);

        for (const cid of targetCompanyIds) {
          qc.refetchQueries({ queryKey: ['rp', 'employee-overrides', group.id, overrideMemberId, cid] });
          qc.invalidateQueries({ queryKey: ['group-overrides', group.id, overrideMemberId, cid] });
        }
        // Field overrides are saved by the panel, which unmounts on onBack() —
        // invalidate here so the group list reflects them straight away.
        qc.invalidateQueries({ queryKey: ['field-overrides'] });
        qc.invalidateQueries({ queryKey: ['group-field-overrides'] });

        showToast('✓ Employee override saved');
        onBack();
        return;
      }

      qc.refetchQueries({ queryKey: ['rp', 'groups'] });
      qc.refetchQueries({ queryKey: ['rp', 'group-perms', group?.id] });
      qc.invalidateQueries({ queryKey: ['group-field-perms'] });
      qc.invalidateQueries({ queryKey: ['field-perm-matrix'] });

      showToast(isNew ? '✓ Group created' : '✓ Group updated');
      onBack();
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  // Field panel needs the *effective* view state — base group perms merged
  // with this employee's saved/live module overrides (Effect B keeps modPerms
  // in sync) — not the frozen group baseline, or a module granted only via an
  // employee override would never become editable here.
  const effectiveModPerms = modPerms;

  return (
    <div>
      {/* Toolbar */}
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
            || !baseLoaded
            || saveMutation.isPending
          }
        >
          {saveMutation.isPending ? '…' : isOverrideMode ? '✓ Save Overrides' : '✓ Save Group'}
        </button>
      </div>

      {/* 3-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 240px', gap: 14, alignItems: 'flex-start' }}>

        {/* Col 1 */}
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
              {overrideMemberCompanyIds && overrideMemberCompanyIds.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 8 }}>
                    Override applies to
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                    Editing overrides for: {selectedOverrideCompanyIds.map(id => assignedCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ') || 'none selected'}.
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
                <label htmlFor="rp-group-name">Group Name *</label>
                <input id="rp-group-name" type="text" value={name} maxLength={80}
                  onChange={e => setName(e.target.value)} placeholder="e.g. Senior HR" autoFocus />
              </div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label>Colour Tag</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLOR_OPTS.map(c => (
                    <div key={c.key} onClick={() => setColorKey(c.key)} title={c.key}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c.css, cursor: 'pointer', border: `3px solid ${colorKey === c.key ? 'var(--ink)' : 'transparent'}`, transform: colorKey === c.key ? 'scale(1.2)' : 'scale(1)', transition: 'all .12s' }} />
                  ))}
                </div>
              </div>
              <div className="fg">
                <label htmlFor="rp-group-desc">Description</label>
                <textarea id="rp-group-desc" value={desc} maxLength={255}
                  onChange={e => setDesc(e.target.value)} rows={2} placeholder="What can this group do?" />
              </div>
            </div>
          </div>
        )}

        {/* Col 2 */}
        <ModuleMatrix
          modPerms={modPerms}
          onChange={setModPerms}
          isOverrideMode={isOverrideMode}
          moduleCompanyMap={moduleCompanyMap}
          assignedCompanies={assignedCompanies}
          overrideTargetCompanyIds={selectedOverrideCompanyIds}
          modules={modules}
        />

        {/* Col 3 */}
        <PermSummary modPerms={modPerms} modules={modules} isOverrideMode={isOverrideMode} />
      </div>

      {!isOverrideMode || group ? (
        <div style={{ marginTop: 20 }}>
          <FieldPermissionsPanel
            groupId={group?.id ?? 0}
            assignedCompanies={assignedCompanies}
            isOverrideMode={isOverrideMode}
            overrideMemberId={overrideMemberId}
            selectedOverrideCompanyIds={selectedOverrideCompanyIds}
            modPerms={effectiveModPerms}
            onRegisterSave={fn => { fieldSaveRef.current = fn; }}
          />
        </div>
      ) : null}
    </div>
  );
}

// ─── FieldPermissionsPanel ────────────────────────────────────────────────────

function FieldPermissionsPanel({
  groupId, assignedCompanies, isOverrideMode = false,
  overrideMemberId, selectedOverrideCompanyIds, modPerms, onRegisterSave,
}: {
  groupId: number;
  assignedCompanies: { id: number; name: string; shortName: string }[];
  isOverrideMode?: boolean;
  overrideMemberId?: number;
  selectedOverrideCompanyIds?: number[];
  modPerms: ModulePerms;
  onRegisterSave?: (fn: (createdGroupId?: number) => Promise<any>) => void;
}) {

  const isDraft = !(groupId > 0);

  const qc = useQueryClient();

  const { data: modules = [] } = useHrModules();
  
  const allFormsQueries = useAllModuleForms(modules);
  const allForms = allFormsQueries.flatMap((query, moduleIndex) => {
    const mod = modules[moduleIndex];
    if (!mod) return [];
    return (query.data || []).map((form: Form) => ({
      ...form,
      moduleId: mod.id,
      moduleName: mod.name,
      moduleKey: mod.permission_key ?? mod.slug,
    }));
  });

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  // Only sections whose module is checked in the matrix above. Reads live from
  // modPerms, so ticking/unticking a module updates this list immediately —
  // that's what makes it work for a group that doesn't exist yet.
  const visibleForms = useMemo(
    () => allForms.filter((f: any) => !!f.moduleKey && !!modPerms[f.moduleKey]?.view),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allForms.map((f: any) => f.id).join(','), modPerms],
  );

  useEffect(() => { setSelectedFormId(null); }, [groupId]);

  // Keep the selection inside the visible set — unchecking a module must not
  // leave a stale form selected and editable.
  useEffect(() => {
    if (!visibleForms.length) { if (selectedFormId !== null) setSelectedFormId(null); return; }
    if (!selectedFormId || !visibleForms.some((f: any) => f.id === selectedFormId)) {
      setSelectedFormId(visibleForms[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleForms.map((f: any) => f.id).join(','), selectedFormId]);

  const selectedForm = visibleForms.find((f: any) => f.id === selectedFormId);
  const selectedModuleKey: string | undefined = selectedForm?.moduleKey;
  const moduleAccessGranted = visibleForms.length > 0 && !!selectedModuleKey;

  // Same live-from-modPerms pattern as the View gate above, one level down:
  // View gates whether the whole section is reachable, Edit gates just the
  // Edit column within it — mirrors the backend's own ceiling in
  // resolveFormPermissions (`can_edit = can_edit && moduleEdit`).
  const moduleEditGranted = !!selectedModuleKey && !!modPerms[selectedModuleKey]?.edit;

  // Company scope comes from the group, not from its members — a brand-new
  // group with no members can still be configured.
  const { data: scopeCompanyIds = [] } = useQuery({
    queryKey: ['group-company-scope', groupId],
    queryFn: () => pgApi.groupCompanyScope(groupId),
    enabled: !isDraft,
    select: (r: any): number[] => r.data ?? [],
  });

  // A draft group has no scope endpoint to call yet — fall back to the
  // companies this admin manages so the field matrix can still render.
  const groupCompanyIds: number[] = isDraft ? assignedCompanies.map(c => c.id) : scopeCompanyIds;

  const matrixCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : groupCompanyIds[0];
  const { data: matrixData, refetch } = useGroupFieldPermissionMatrix(selectedFormId || 0, matrixCompanyId || 0);
  const fields = matrixData?.fields || [];

  const { data: groupPermsData, refetch: refetchGroupPerms } = useGroupFieldPermissions(
    selectedFormId || 0, groupId, matrixCompanyId || 0
  );

  const [localPerms, setLocalPerms] = useState<Record<number, any>>({});
  const [dirty, setDirty] = useState(false);

  const displayCompanyId = isOverrideMode ? selectedOverrideCompanyIds?.[0] : undefined;
  const { data: overrideData, refetch: refetchOverrides } = useEmployeeFieldOverrides(
    groupId, overrideMemberId, displayCompanyId, selectedModuleKey || ''
  );

  // Merge group baseline + employee overrides into the working copy.
  // Guarded on `dirty` so a background refetch can't silently discard edits.
  useEffect(() => {
    if (dirty) return;
    if (!fields.length) return;

    const merged: Record<number, any> = {};
    for (const f of fields) {
      const groupBase =
        groupPermsData?.perms?.[f.id] ||
        matrixData?.matrix?.[groupId]?.[f.id] ||
        { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };

      if (isOverrideMode) {
        const ov = overrideData?.[f.field_key] || {};
        merged[f.id] = {
          can_view: ov.view !== undefined ? ov.view : groupBase.can_view,
          can_edit: ov.edit !== undefined ? ov.edit : groupBase.can_edit,
          can_copy: ov.copy !== undefined ? ov.copy : groupBase.can_copy,
          can_download: ov.download !== undefined ? ov.download : groupBase.can_download,
          is_masked: ov.mask !== undefined ? ov.mask : groupBase.is_masked,
        };
      } else {
        merged[f.id] = groupBase;
      }
    }
    setLocalPerms(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, selectedFormId, matrixCompanyId, groupPermsData, isOverrideMode, overrideData, matrixData]);

  // Live-sync: the instant a module's View/Edit/Download is toggled in the
  // top matrix, mirror that into this module's field checkboxes right away —
  // matching exactly what applyModuleDefaultsToFields will persist on save,
  // so the panel never shows a state that then silently flips after saving.
  //
  // Baseline is seeded ONCE, at mount, from whatever modPerms looked like
  // for every module at that moment — not lazily the first time we happen
  // to look at a given module. This matters for a module whose fields only
  // become visible/selectable AFTER being toggled on: without a pre-seeded
  // baseline, the toggle-on event and "first time seeing this module" are
  // the exact same render, so a lazy per-module seed would incorrectly
  // treat the toggle itself as "nothing to compare against yet" and defer
  // to the fetch-based merge — which shows nothing for a brand-new,
  // never-saved group. Seeding everything up front means ANY change
  // relative to mount-time state — including a module going from
  // false→true for the first time — is correctly detected as a real toggle.
  const prevModulePermsRef = useRef<Record<string, { view: boolean; edit: boolean; download: boolean }> | null>(null);
  useEffect(() => {
    if (prevModulePermsRef.current) return; // seed exactly once per panel instance
    const seed: Record<string, { view: boolean; edit: boolean; download: boolean }> = {};
    for (const key of Object.keys(modPerms)) {
      seed[key] = {
        view: !!modPerms[key]?.view,
        edit: !!modPerms[key]?.edit,
        download: !!modPerms[key]?.download,
      };
    }
    prevModulePermsRef.current = seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOverrideMode) return; // override mode has its own merge above; don't fight it
    if (!selectedModuleKey || !fields.length) return;
    if (!prevModulePermsRef.current) return; // baseline not seeded yet

    const cur = {
      view: !!modPerms[selectedModuleKey]?.view,
      edit: !!modPerms[selectedModuleKey]?.edit,
      download: !!modPerms[selectedModuleKey]?.download,
    };
    // Module not present in the mount-time seed at all (e.g. a module added
    // to the catalog mid-session) — falls back to the natural false
    // baseline, same treatment as any other brand-new module.
    const prev = prevModulePermsRef.current[selectedModuleKey] ?? { view: false, edit: false, download: false };
    prevModulePermsRef.current[selectedModuleKey] = cur;

    if (prev.view === cur.view && prev.edit === cur.edit && prev.download === cur.download) return;

    setLocalPerms(p => {
      const next = { ...p };
      for (const f of fields) {
        next[f.id] = cur.view
          ? { can_view: true, can_edit: cur.edit, can_copy: true, can_download: cur.download, is_masked: !!f.is_hidden }
          : { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
      }
      return next;
    });
    setDirty(true);
  }, [selectedModuleKey, modPerms, fields, isOverrideMode]);

  // Mirrors the backend's module-edit ceiling so the admin UI never shows or
  // saves a field-level Edit grant the runtime would ignore anyway.
  const effectiveCanEdit = (fp: any) => moduleEditGranted && !!fp?.can_edit;

  const toggleFP = (
    fieldId: number,
    perm: 'can_view' | 'can_edit' | 'can_copy' | 'can_download' | 'is_masked'
  ) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      const next: Record<string, boolean> = { ...current, [perm]: !current[perm] };

      // Any permission except View requires View
      if (perm !== 'can_view' && next[perm]) {
        next.can_view = true;
      }

      // Turning View OFF clears all dependent permissions
      if (perm === 'can_view' && !next.can_view) {
        next.can_edit = false;
        next.can_copy = false;
        next.can_download = false;
        next.is_masked = false;
      }

      return { ...prev, [fieldId]: next };
    });
    setDirty(true);
  };

  // "All" covers the four grants — masking is an independent concern and is
  // deliberately left out, otherwise granting everything would also hide it.
  const toggleFieldRow = (fieldId: number) => {
    setLocalPerms(prev => {
      const current = prev[fieldId] || {};
      const allEnabled = current.can_view && effectiveCanEdit(current) && current.can_copy && current.can_download;
      const next = allEnabled
        ? { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false }
        : { can_view: true, can_edit: moduleEditGranted, can_copy: true, can_download: true, is_masked: !!current.is_masked };
      return { ...prev, [fieldId]: next };
    });
    setDirty(true);
  };

  const grantAll = () => {
    setLocalPerms(prev => {
      const n = { ...prev };
      for (const f of fields) {
        n[f.id] = { can_view: true, can_edit: moduleEditGranted, can_copy: true, can_download: true, is_masked: false };
      }
      return n;
    });
    setDirty(true);
  };

  const revokeAll = () => {
    setLocalPerms(prev => {
      const n = { ...prev };
      for (const f of fields) {
        n[f.id] = { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
      }
      return n;
    });
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (createdGroupId?: number) => {
      if (!selectedModuleKey) throw new Error('No form selected');

      // For a new group the id only exists once the parent has created it.
      const targetGroupId = createdGroupId ?? groupId;
      if (!(targetGroupId > 0)) throw new Error('Group not saved yet');

      if (isOverrideMode) {
        if (!selectedOverrideCompanyIds?.length) throw new Error('Select at least one company to save overrides for');
        if (!overrideMemberId) throw new Error('No member selected');

        // Only send what differs from the group baseline — sending everything
        // would create override rows for untouched fields.
        const overrides: { field_name: string; permission: string; granted: boolean }[] = [];
        for (const f of fields) {
          const groupBase = groupPermsData?.perms?.[f.id] || {};
          const cur = localPerms[f.id] || {};
          (['view', 'edit', 'copy', 'download'] as const).forEach(p => {
            const key = `can_${p}` as const;
            const curVal = p === 'edit' ? effectiveCanEdit(cur) : !!cur[key];
            if (curVal !== !!groupBase[key]) overrides.push({ field_name: f.field_key, permission: p, granted: curVal });
          });
          if (!!cur.is_masked !== !!groupBase.is_masked) overrides.push({ field_name: f.field_key, permission: 'mask', granted: !!cur.is_masked });
        }

        await pgApi.setFieldOverrides(targetGroupId, overrideMemberId, selectedOverrideCompanyIds, selectedModuleKey, overrides);
      } else {
        if (!matrixCompanyId) throw new Error('No company in scope for this group');
        const permissions = fields.map((f: any) => ({
          field_id: f.id,
          can_view: !!localPerms[f.id]?.can_view,
          can_edit: effectiveCanEdit(localPerms[f.id]),
          can_copy: !!localPerms[f.id]?.can_copy,
          can_download: !!localPerms[f.id]?.can_download,
          is_masked: !!localPerms[f.id]?.is_masked,
        }));
        // Writes to the company currently on screen only — writing to every
        // company would flatten per-company differences.
        console.log('Saving field permissions for group', targetGroupId, 'company', matrixCompanyId, permissions);
        await pgApi.bulkSetFieldPermissions(targetGroupId, [matrixCompanyId], permissions);
      }
    },
    onSuccess: () => {
      showToast(isOverrideMode ? '✓ Field overrides saved' : '✓ Field permissions saved');
      setDirty(false);
      refetch();
      refetchGroupPerms();
      if (isOverrideMode) refetchOverrides();
      // The group list reads the same rows under a different key — invalidate
      // both, or the inline override panel stays stale until a page reload.
      qc.invalidateQueries({ queryKey: ['field-overrides'] });
      qc.invalidateQueries({ queryKey: ['group-field-overrides'] });
      qc.invalidateQueries({ queryKey: ['group-field-perms'] });
      qc.invalidateQueries({ queryKey: ['field-perm-matrix'] });
    },
    onError: (e: any) => showToast(e?.message || 'Failed to save'),
  });

  // The parent's Save flushes this — one save button for the whole screen.
  useEffect(() => {
    onRegisterSave?.((createdGroupId?: number) =>
      (dirty ? saveMutation.mutateAsync(createdGroupId) : Promise.resolve()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, saveMutation, onRegisterSave]);

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
            : !!matrixCompanyId && (
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                Editing: {assignedCompanies.find(c => c.id === matrixCompanyId)?.name || `Company ${matrixCompanyId}`}
              </div>
            )
        )}
        {moduleAccessGranted && dirty && (
          <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600 }}>
            Unsaved — use Save above
          </span>
        )}
      </div>

      {!moduleAccessGranted ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink4)', fontSize: 13 }}>
          {!allForms.length
            ? 'No forms configured yet — nothing to set field rules on.'
            : isOverrideMode
              ? 'This group has no modules with field-level forms — there are no fields to override for this person.'
              : <>No modules with field-level forms selected.<br /><span style={{ fontSize: 11 }}>Tick <strong>View</strong> on a module above to configure its fields.</span></>}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 14 }}>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink4)' }}>Sections</div>
              <div style={{ padding: '6px 0' }}>
                {visibleForms.map((f: any) => (
                  <div key={`${f.moduleId}-${f.id}`} onClick={() => setSelectedFormId(f.id)}
                    style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: selectedFormId === f.id ? 600 : 400, color: selectedFormId === f.id ? 'var(--blue)' : 'var(--ink3)', background: selectedFormId === f.id ? 'var(--blue-lt)' : 'transparent', borderLeft: `3px solid ${selectedFormId === f.id ? 'var(--blue)' : 'transparent'}` }}>
                    {f.name}
                    <div style={{ fontSize: 10, color: 'var(--ink4)', fontWeight: 400 }}>
                      {f.moduleName} • {f.fields?.length || 0} fields
                    </div>
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
                  {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                    const editGated = p === 'can_edit' && !moduleEditGranted;
                    return (
                      <th
                        key={p}
                        title={editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit' : undefined}
                        style={{
                          padding: '7px 8px', fontSize: 10, fontWeight: 700,
                          textTransform: 'uppercase', color: editGated ? 'var(--ink5, var(--ink4))' : 'var(--ink4)',
                          borderBottom: '1px solid var(--border)', textAlign: 'center',
                          opacity: editGated ? 0.6 : 1,
                        }}
                      >
                        {p.replace('can_', '').replace('is_', '')}
                      </th>
                    );
                  })}
                </tr></thead>
                <tbody>
                  {fields.map((f: any) => {
                    const fp = localPerms[f.id] || { can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false };
                    const allOn = fp.can_view && effectiveCanEdit(fp) && fp.can_copy && fp.can_download;
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 500, color: 'var(--ink2)' }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                          <PermToggle on={allOn} onClick={() => toggleFieldRow(f.id)} />
                        </td>
                        {(['can_view', 'can_edit', 'can_copy', 'can_download', 'is_masked'] as const).map(p => {
                          const editGated = p === 'can_edit' && !moduleEditGranted;
                          const on = p === 'can_edit' ? effectiveCanEdit(fp) : !!fp[p];
                          return (
                            <td key={p} style={{ padding: '7px 6px', textAlign: 'center', opacity: editGated ? 0.45 : 1 }}
                              title={editGated ? 'Module-level Edit is off — enable it above to allow field-level Edit' : undefined}>
                              <PermToggle on={on} onClick={editGated ? undefined : () => toggleFP(f.id, p)} />
                            </td>
                          );
                        })}
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
                const on = fields.filter((f: any) => p === 'can_edit' ? effectiveCanEdit(localPerms[f.id]) : localPerms[f.id]?.[p]).length;
                return (
                  <div key={p} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink3)' }}>{p.replace('can_', '').replace('is_', '')}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: on > 0 ? 'var(--blue)' : 'var(--ink4)' }}>{on}/{fields.length}</span>
                  </div>
                );
              })}
            </div>
          </div>

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
                Field rules sit under module rules. A field blocked here won&apos;t show even if the module is visible, and no field is visible without module view access. The <strong>Edit</strong> column follows the same rule — it&apos;s greyed out here whenever the module&apos;s own Edit permission is off.<br /><br />
                <strong style={{ color: 'var(--amber)' }}>Mask</strong> shows the value as •••• — useful for salary &amp; ID numbers.
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────

export default function RolesPermissionsPage() {
  const dispatch = useAppDispatch();
  const { canEdit, canCreate, canDelete } = usePermission();
  const managedCompanies = useAppSelector(selectManagedCompanies);

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
  const { data: modules = [], isLoading: modulesLoading } = useModuleList();

  // View state
  const [view, setView] = useState<View>('groups');
  const [editGroup, setEditGroup] = useState<PermGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PermGroup | null>(null);

  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, memberQueries.map(q => q.dataUpdatedAt).join(',')]);

  useEffect(() => {
    if (groups.length && !activeGroupId) setActiveGroupId(groups[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const totalAssigned = groups.reduce((s, g) => s + (groupMembersMap[g.id]?.length || 0), 0);
  const totalPermRules = groups.reduce((s, g) => s + (g.permissions?.length || 0), 0);

  const seedMutation = useMutation({
    mutationFn: () => pgApi.seed(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp'] }); showToast('✓ System groups seeded'); },
    onError: (e: any) => showToast(e?.message || 'Failed to seed system groups'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pgApi.delete(id),
    onSuccess: (_, deletedId) => {
      qc.invalidateQueries({ queryKey: ['rp'] });
      showToast('Group deleted');
      setDeleteTarget(null);
      if (activeGroupId === deletedId) setActiveGroupId(null);
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) =>
      pgApi.addMember(groupId, empId, companyIds.length > 0 ? companyIds : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rp', 'group-members'] });
      qc.invalidateQueries({ queryKey: ['group-company-scope'] });
      setMemberOverrides({});
      showToast('✓ Saved');
      setAddPersonOpen(false);
    },
    onError: (e: any) => showToast(e?.message || 'Failed'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, empId, companyIds }: { groupId: number; empId: number; companyIds: number[] }) => {
      const results = await Promise.allSettled(
        companyIds.map(companyId => pgApi.removeMember(groupId, companyId, empId))
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed) throw new Error(`Removed from ${companyIds.length - failed} of ${companyIds.length} companies`);
    },
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      qc.invalidateQueries({ queryKey: ['group-company-scope'] });
      showToast('Member removed');
    },
    onError: (e: any) => {
      qc.refetchQueries({ queryKey: ['rp', 'group-members'] });
      showToast(e?.message || 'Failed');
    },
  });

  const handleToggleOverrides = (memberId: number) => {
    setMemberOverrides(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const handleEditOverride = (memberId: number) => {
    const member = groupMembersMap[selectedGroup?.id || 0]?.find((m: any) => m.id === memberId);
    const name = member ? `${member.first_name} ${member.last_name}`.trim() : '';
    setOverrideMemberId(memberId);
    setOverrideMemberName(name);
    setOverrideMemberCompanyId(member?.assigned_company_ids?.[0]);
    setOverrideMemberCompanyIds(member?.assigned_company_ids || []);
    setView('edit');
  };

  const moduleCompanyMap = useCompanyModulesMap(assignedCompanies);

  const closeEdit = () => {
    setView('groups');
    setEditGroup(null);
    setOverrideMemberId(undefined);
    setOverrideMemberName(undefined);
    setOverrideMemberCompanyId(undefined);
    setOverrideMemberCompanyIds([]);
  };

  // ── Edit / override view ──
  if (view === 'edit') return (
    <PermissionGuard permission="settings:edit">
      <AppShell>
        <div className="pg-enter">
          <EditView
            group={overrideMemberId ? selectedGroup : editGroup}
            onBack={closeEdit}
            overrideMemberId={overrideMemberId}
            overrideMemberName={overrideMemberName}
            overrideMemberCompanyId={overrideMemberCompanyId}
            overrideMemberCompanyIds={overrideMemberCompanyIds}
            groupName={selectedGroup?.name}
            moduleCompanyMap={moduleCompanyMap}
            assignedCompanies={assignedCompanies}
            modules={modules}
          />
        </div>
      </AppShell>
    </PermissionGuard>
  );

  // ── Groups list view ──
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

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Permission Groups', value: groups.length, color: 'var(--blue)' },
              { label: 'Employees Assigned', value: totalAssigned, color: 'var(--green)' },
              { label: 'Module Rules', value: totalPermRules, color: 'var(--purple)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: '14px 18px', boxShadow: 'var(--sh)' }}>
                <div style={{ fontSize: 26, fontWeight: 500, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {isLoading || modulesLoading ? (
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
                {canCreate('settings') && (
                  <>
                    <button className="btn btn-sec" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                      {seedMutation.isPending ? '…' : '🌱 Seed System Groups'}
                    </button>
                    <button className="btn btn-pri" onClick={() => { setEditGroup(null); setView('edit'); }}>+ New Group</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14, alignItems: 'start' }}>

              <GroupSidebar
                groups={groups}
                selectedId={selectedGroup?.id ?? null}
                onSelect={g => { setActiveGroupId(g.id); setAddPersonOpen(false); setMemberOverrides({}); }}
                onNew={canCreate('settings') ? () => { setEditGroup(null); setView('edit'); } : undefined}
                membersMap={groupMembersMap}
              />

              {selectedGroup ? (
                <GroupDetail
                  group={selectedGroup}
                  members={groupMembersMap[selectedGroup.id] || []}
                  onEdit={canEdit('settings') ? () => { setEditGroup(selectedGroup); setView('edit'); } : undefined}
                  onDelete={canDelete('settings') ? () => setDeleteTarget(selectedGroup) : undefined}
                  addPersonOpen={addPersonOpen}
                  setAddPersonOpen={setAddPersonOpen}
                  onAddMember={(empId, companyIds) => addMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds })}
                  onRemoveMember={(empId) => {
                    const member = (groupMembersMap[selectedGroup.id] || []).find((m: any) => m.id === empId);
                    const nm = `${member?.first_name ?? ''} ${member?.last_name ?? ''}`.trim() || 'this member';
                    if (!window.confirm(`Remove ${nm} from ${selectedGroup.name} in all companies?`)) return;
                    removeMemberMutation.mutate({ groupId: selectedGroup.id, empId, companyIds: member?.assigned_company_ids || [] });
                  }}
                  employees={employees}
                  assignedCompanies={assignedCompanies}
                  overrides={memberOverrides}
                  onToggleOverrides={handleToggleOverrides}
                  onEditOverride={handleEditOverride}
                  modules={modules}
                />
              ) : null}
            </div>
          )}

        </div>
      </AppShell>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title={`Delete "${deleteTarget.name}"?`}>
          <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 16 }}>
            This will permanently delete the group, its module and field permissions, and all member
            assignments{(groupMembersMap[deleteTarget.id]?.length || 0) > 0
              ? ` (${groupMembersMap[deleteTarget.id].length} member${groupMembersMap[deleteTarget.id].length === 1 ? '' : 's'})`
              : ''}. This cannot be undone.
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
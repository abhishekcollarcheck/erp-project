/**
 * Canonical RBAC seed data — the permission catalog, the system permission
 * groups, and the per-template module grants used to bootstrap a company's
 * system roles.
 *
 * Run via seedRbac.ts (standalone or from the main seeder) or through
 * POST /api/permission-groups/seed.
 */

// ─── Module keys ─────────────────────────────────────────────────────────────
// The permission "module" segment. Mix of the form-builder module keys
// (permKeyForModule) and the fixed product areas the route `authorize()` calls
// and the frontend's canView()/canEdit() helpers reference.
export const PERMISSION_MODULE_KEYS = [
  'employees', 'candidates', 'recruitment', 'aptitude',
  'attendance', 'leave', 'leaves', 'payroll',
  'departments', 'designations', 'reports',
  'companies', 'settings',
] as const;

// view/create/edit/delete/download for every module, plus a few extra actions
// that specific routes gate on.
export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'download'] as const;

export const EXTRA_PERMISSIONS: { module: string; action: string }[] = [
  { module: 'leaves', action: 'approve' },
  { module: 'attendance', action: 'approve' },
  { module: 'payroll', action: 'approve' },
];

export function buildPermissionCatalog(): { module: string; action: string; slug: string }[] {
  const rows: { module: string; action: string; slug: string }[] = [];
  for (const module of PERMISSION_MODULE_KEYS) {
    for (const action of PERMISSION_ACTIONS) {
      rows.push({ module, action, slug: `${module}:${action}` });
    }
  }
  for (const e of EXTRA_PERMISSIONS) rows.push({ ...e, slug: `${e.module}:${e.action}` });
  return rows;
}

// ─── System permission groups ────────────────────────────────────────────────
export interface SystemGroupDef {
  name: string;
  slug: string;
  description: string;
  color: string;
  slug_grants: string[];
}

const crud = (m: string) => [`${m}:view`, `${m}:create`, `${m}:edit`, `${m}:delete`, `${m}:download`];

export const SYSTEM_GROUPS: SystemGroupDef[] = [
  {
    name: 'Administrators',
    slug: 'administrators',
    description: 'Full access to every module and to settings',
    color: '#cc2a2a',
    slug_grants: [
      ...crud('employees'), ...crud('candidates'), ...crud('recruitment'), ...crud('aptitude'),
      ...crud('attendance'), ...crud('leave'), ...crud('leaves'), ...crud('payroll'),
      ...crud('departments'), ...crud('designations'), ...crud('reports'),
      ...crud('companies'), ...crud('settings'),
      'leaves:approve', 'attendance:approve', 'payroll:approve',
    ],
  },
  {
    name: 'HR Team',
    slug: 'hr_team',
    description: 'Employee lifecycle, attendance and leave operations',
    color: '#1e56d9',
    slug_grants: [
      ...crud('employees'), ...crud('candidates'), ...crud('recruitment'),
      ...crud('attendance'), ...crud('leave'), ...crud('leaves'),
      ...crud('departments'), ...crud('designations'), ...crud('reports'),
      'leaves:approve', 'attendance:approve',
    ],
  },
  {
    name: 'Recruiters',
    slug: 'recruiters',
    description: 'End-to-end recruitment and ATS management',
    color: '#c96f00',
    slug_grants: [...crud('recruitment'), ...crud('candidates'), ...crud('aptitude')],
  },
  {
    name: 'Managers',
    slug: 'managers',
    description: 'View team data, approve leave and attendance',
    color: '#0d9669',
    slug_grants: [
      'employees:view', 'departments:view', 'designations:view',
      'attendance:view', 'attendance:edit', 'attendance:approve',
      'leave:view', 'leaves:view', 'leaves:approve', 'reports:view',
    ],
  },
  {
    name: 'Employee Self-Service',
    slug: 'employee_self_service',
    description: 'View own profile, apply for leave',
    color: '#94a3b8',
    slug_grants: ['employees:view', 'attendance:view', 'leave:view', 'leaves:view', 'leaves:create'],
  },
];

// ─── Role-template module grants ─────────────────────────────────────────────
// role_module_permissions only has view/edit/delete/download columns.
export interface TemplatePerm { module: string; can_view: boolean; can_edit: boolean; can_delete: boolean; can_download: boolean; }

const tperm = (module: string, v = true, e = false, d = false, dl = false): TemplatePerm => ({
  module, can_view: v, can_edit: e, can_delete: d, can_download: dl,
});

export const ROLE_TEMPLATE_PERMS: Record<string, TemplatePerm[]> = {
  super_admin: PERMISSION_MODULE_KEYS.map(m => tperm(m, true, true, true, true)),
  hr_manager: [
    tperm('employees', true, true, true, true),
    tperm('candidates', true, true, true, true),
    tperm('recruitment', true, true, true, true),
    tperm('attendance', true, true, false, true),
    tperm('leave', true, true, false, true),
    tperm('leaves', true, true, false, true),
    tperm('departments', true, true, false, false),
    tperm('designations', true, true, false, false),
    tperm('reports', true, false, false, true),
  ],
  manager: [
    tperm('employees', true, false, false, false),
    tperm('attendance', true, true, false, false),
    tperm('leave', true, true, false, false),
    tperm('leaves', true, true, false, false),
    tperm('reports', true, false, false, false),
  ],
  employee: [
    tperm('employees', true, false, false, false),
    tperm('attendance', true, false, false, false),
    tperm('leave', true, false, false, false),
    tperm('leaves', true, false, false, false),
  ],
};

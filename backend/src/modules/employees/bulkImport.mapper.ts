/**
 * bulkImport.mapper.ts
 * Turns one raw spreadsheet row into the 12 wizard step payloads, resolving
 * master data by name and coercing every cell to the type the step validators
 * and routeStep() expect. Also runs the SAME express-validator chains the
 * wizard uses (STEP_VALIDATORS) so business rules stay backend-driven and in
 * one place.
 */

import { validationResult } from 'express-validator';

import { Department } from '../../database/models/Department';
import { Designation, SubDesignation } from '../../database/models/Designation';
import { Company } from '../../database/models/Company';
import { SubDepartment } from '../../database/models/Subdepartment';
// import { SubDesignation } from '../../database/models/SubDesignation';
import { Shift } from '../../database/models/Shift';
import { Employee } from '../../database/models/Employee';

import { STEP_VALIDATORS } from './employee.validation';
import { EMPLOYEE_STATUS, EMPLOYMENT_TYPE, type StepKey } from './employee.constants';
import {
  FIELD_DEFS, REPEATABLE_GROUPS, BULK_STEP_ORDER, allTemplateColumns,
  type FieldDef, type FieldType,
} from './bulkImport.fields';
import { resolveMasterOption } from './employee.masterOptions';

export interface RowError { column: string; message: string }

// SubDesignation

export interface MappedRow {
  ok: boolean;
  errors: RowError[];
  base: {
    company_id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    status: string;
    employment_type: string;
    department_id: number;
    designation_id: number;
    sub_department_id: number | null;
    sub_designation_id: number | null;
    email: string;
    phone: string;
    employee_code: string | null;
    reference_code: string | null;
    avatar_url: string | null;
    avatar: string | null;            // raw source (URL / data URI / /uploads path) to localise post-import
    reporting_manager_id: number | null;
  } | null;
  steps: Partial<Record<StepKey, any>>;
  /** Lower-cased normalised identifiers for cross-row dedupe. */
  identity: { email: string; phone: string; aadhaar: string | null; employee_code: string | null; reference_code: string | null };
}

// ─── Master-data resolvers (built once per import) ────────────────────────────

export interface Resolvers {
  company:       (v: string) => number | null | undefined;
  department:    (v: string) => number | null | undefined;
  designation:   (v: string) => number | null | undefined;
  subDepartment: (v: string) => number | null | undefined;
  subDesignation:(v: string) => number | null | undefined;
  shift:         (v: string) => number | null | undefined;
  manager:       (v: string) => number | null | undefined;   // any company, by employee_code or email
  defaultCompanyId: number;
  /** id → name, for back-filling identity cells of an existing (update) row. */
  names: {
    company:       (id: number | null | undefined) => string | undefined;
    department:    (id: number | null | undefined) => string | undefined;
    designation:   (id: number | null | undefined) => string | undefined;
    subDepartment: (id: number | null | undefined) => string | undefined;
    subDesignation:(id: number | null | undefined) => string | undefined;
  };
}

const norm = (s: string) => s.trim().toLowerCase();

export async function buildResolvers(companyId: number): Promise<Resolvers> {
  const [depts, desigs, comps, subDepts, subDesigs, shifts, mgrs] = await Promise.all([
    Department.findAll({ attributes: ['id', 'department_name'], raw: true }),
    Designation.findAll({ attributes: ['id', 'name'], raw: true }),
    Company.findAll({ attributes: ['id', 'name'], raw: true }),
    SubDepartment.findAll({ attributes: ['id', 'name'], raw: true }),
    SubDesignation.findAll({ attributes: ['id', 'name'], raw: true }),
    Shift.findAll({ attributes: ['id', 'label'], raw: true }),
    // Managers are resolved across ALL companies — a reporting manager may be
    // "remote" (in a different company). employee_code / email are globally
    // unique, so the lookup stays unambiguous.
    Employee.findAll({ attributes: ['id', 'employee_code', 'email'], raw: true }),
  ]);

  const map = (rows: any[], nameKey: string) => {
    const m = new Map<string, number>();
    for (const r of rows) if (r[nameKey]) m.set(norm(String(r[nameKey])), r.id);
    return m;
  };
  const deptMap    = map(depts, 'department_name');
  const desigMap   = map(desigs, 'name');
  const compMap    = map(comps, 'name');
  const subDeptMap = map(subDepts, 'name');
  const subDesigMap= map(subDesigs, 'name');
  const shiftMap   = map(shifts, 'label');
  const shiftById  = new Set<number>(shifts.map((s: any) => s.id));

  const mgrMap = new Map<string, number>();
  for (const m of mgrs as any[]) {
    if (m.employee_code) mgrMap.set(norm(String(m.employee_code)), m.id);
    if (m.email)         mgrMap.set(norm(String(m.email)), m.id);
  }

  const lookup = (m: Map<string, number>) => (v: string) => {
    const raw = String(v ?? '').trim();
    if (!raw) return undefined;
    return m.get(norm(raw)) ?? null;
  };

  const byId = (rows: any[], nameKey: string) => {
    const m = new Map<number, string>();
    for (const r of rows) if (r[nameKey] != null) m.set(r.id, String(r[nameKey]));
    return m;
  };
  const deptById    = byId(depts, 'department_name');
  const desigById   = byId(desigs, 'name');
  const compById    = byId(comps, 'name');
  const subDeptById = byId(subDepts, 'name');
  const subDesigById= byId(subDesigs, 'name');
  const nameOf = (m: Map<number, string>) => (id: number | null | undefined) =>
    id == null ? undefined : m.get(id);

  return {
    defaultCompanyId: companyId,
    company:       lookup(compMap),
    department:    lookup(deptMap),
    designation:   lookup(desigMap),
    subDepartment: lookup(subDeptMap),
    subDesignation:lookup(subDesigMap),
    manager:       lookup(mgrMap),
    names: {
      company:       nameOf(compById),
      department:    nameOf(deptById),
      designation:   nameOf(desigById),
      subDepartment: nameOf(subDeptById),
      subDesignation:nameOf(subDesigById),
    },
    shift: (v: string) => {
      const raw = String(v ?? '').trim();
      if (!raw) return undefined;
      const asNum = Number(raw);
      if (Number.isInteger(asNum) && shiftById.has(asNum)) return asNum;
      return shiftMap.get(norm(raw)) ?? null;
    },
  };
}

// ─── Cell coercion ───────────────────────────────────────────────────────────

const BLANK = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

function toStr(v: unknown): string | undefined {
  if (BLANK(v)) return undefined;
  return String(v).trim();
}
function toBool(v: unknown): boolean | null | undefined {
  if (BLANK(v)) return undefined;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(s)) return true;
  if (['false', 'no', 'n', '0'].includes(s)) return false;
  return null;
}
function toInt(v: unknown): number | null | undefined {
  if (BLANK(v)) return undefined;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}
function toNum(v: unknown): number | null | undefined {
  if (BLANK(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function toDate(v: unknown): string | null | undefined {
  if (BLANK(v)) return undefined;
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);   // dd-mm-yyyy / dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return null;
}

/** Coerce one cell by its declared type. Returns `null` when the value is
 *  present but invalid (caller records a row error). */
function coerce(type: FieldType, v: unknown, enumValues?: readonly string[]): any {
  switch (type) {
    case 'str':  return toStr(v);
    case 'bool': return toBool(v);
    case 'int':  return toInt(v);
    case 'num':  return toNum(v);
    case 'date': return toDate(v);
    case 'enum': {
      const s = toStr(v);
      if (s === undefined) return undefined;
      const hit = (enumValues ?? []).find(e => e.toLowerCase() === s.toLowerCase());
      return hit ?? null;
    }
    default: return toStr(v);
  }
}

// ─── Header / row-key resolution ─────────────────────────────────────────────
// Templates now ship human-readable column headers ("Salary Mode"), but older
// files (and the failed-rows export) use the raw field keys ("salary_mode").
// Resolve either form — plus loose case/spacing/punctuation — back to the
// canonical column key the mapper expects.

/** loose-normalise any header/key: lower-case, non-alphanumerics → single `_`. */
const canon = (s: string) =>
  String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const HEADER_TO_COL: Map<string, string> = (() => {
  const m = new Map<string, string>();
  const all = allTemplateColumns();
  for (const c of all) m.set(canon(c.col), c.col);                 // exact keys win
  for (const c of all) { const k = canon(c.label); if (!m.has(k)) m.set(k, c.col); }
  // legacy header spellings (older downloaded templates)
  for (const [from, to] of [
    ['reporting_manager', 'reporting_manager_code'],
    ['reporting_manager_employee_code', 'reporting_manager_code'],
    ['l1_manager', 'l1_manager_code'],
    ['l1_manager_employee_code', 'l1_manager_code'],
    ['l2_manager', 'l2_manager_code'],
    ['l2_manager_employee_code', 'l2_manager_code'],
    ['avatar_image', 'avatar'],
    ['profile_photo', 'avatar'],
  ] as const) if (!m.has(from)) m.set(from, to);
  return m;
})();

/** Resolve one spreadsheet header to its canonical column key. */
export function resolveHeader(header: string): string {
  const k = canon(header);
  return HEADER_TO_COL.get(k) ?? k;
}

/** canonical column key → readable label (for error messages). */
const COL_TO_LABEL: Map<string, string> = new Map(
  allTemplateColumns().map(c => [c.col, c.label]),
);

export function normaliseKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[resolveHeader(k)] = v;
  return out;
}

// ─── The mapper ──────────────────────────────────────────────────────────────

const DEFS_BY_STEP = new Map<string, FieldDef[]>();
for (const d of FIELD_DEFS) {
  const arr = DEFS_BY_STEP.get(d.step) ?? [];
  arr.push(d);
  DEFS_BY_STEP.set(d.step, arr);
}
const COL_BY_KEY = new Map<string, string>();
for (const d of FIELD_DEFS) COL_BY_KEY.set(`${d.step}.${d.key}`, d.col);

function friendlyCol(step: string, key: string): string {
  return COL_BY_KEY.get(`${step}.${key}`) ?? key;
}

/** Run one step's express-validator chain against a plain payload object. */
async function runStepValidators(step: StepKey, payload: Record<string, any>): Promise<RowError[]> {
  const chains = STEP_VALIDATORS[step] ?? [];
  if (!chains.length) return [];
  const req: any = { body: { ...payload }, query: {}, params: {}, headers: {}, cookies: {} };
  await Promise.all(chains.map(c => c.run(req)));
  const result = validationResult(req);
  if (result.isEmpty()) return [];
  return result.array().map(e => {
    const key = (e as any).path || 'general';
    return { column: friendlyCol(step, key), message: e.msg as string };
  });
}

function buildRepeatables(row: Record<string, unknown>, step: StepKey, errors: RowError[]): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  for (const g of REPEATABLE_GROUPS) {
    if (g.step !== step) continue;
    const list: any[] = [];
    for (let i = 1; i <= g.max; i++) {
      const entry: Record<string, any> = {};
      let anyValue = false;
      for (const gf of g.fields) {
        const col = `${g.prefix}_${i}_${gf.sub}`;
        const val = coerce(gf.type, row[col], gf.enumValues);
        if (val === null) errors.push({ column: col, message: 'Invalid value' });
        if (val !== undefined && val !== null) { entry[gf.key] = val; anyValue = true; }
      }
      if (!anyValue) continue;
      const missing = g.requiredSubKeys.filter(k => entry[k] === undefined || entry[k] === '');
      if (missing.length) {
        errors.push({ column: `${g.prefix}_${i}_*`, message: `Missing ${missing.join(', ')}` });
        continue;
      }
      list.push(entry);
    }
    if (list.length) out[g.arrayKey] = list;
  }
  return out;
}

export async function mapRow(rawRow: Record<string, unknown>, resolvers: Resolvers): Promise<MappedRow> {
  const row = normaliseKeys(rawRow);
  const errors: RowError[] = [];
  const steps: Partial<Record<StepKey, any>> = {};

  // ── Base row (Role & Identity) ─────────────────────────────────────────────
  const first_name = toStr(row['first_name']);
  const last_name  = toStr(row['last_name']);
  const email      = toStr(row['email']);
  const phone      = toStr(row['phone']);

  let companyId: number = resolvers.defaultCompanyId;
  if (!BLANK(row['company'])) {
    const c = resolvers.company(String(row['company']));
    if (c == null) errors.push({ column: 'company', message: `Company "${row['company']}" not found — pick a value from the template's Company dropdown` });
    else companyId = c;
  }

  const departmentId    = BLANK(row['department'])      ? null : resolvers.department(String(row['department']));
  const designationId   = BLANK(row['designation'])     ? null : resolvers.designation(String(row['designation']));
  const subDepartmentId = BLANK(row['sub_department'])  ? undefined : resolvers.subDepartment(String(row['sub_department']));
  const subDesignationId= BLANK(row['sub_designation']) ? undefined : resolvers.subDesignation(String(row['sub_designation']));

  if (departmentId === null && !BLANK(row['department']))       errors.push({ column: 'department', message: `Department "${row['department']}" not found` });
  if (designationId === null && !BLANK(row['designation']))     errors.push({ column: 'designation', message: `Designation "${row['designation']}" not found` });
  if (subDepartmentId === null)                                 errors.push({ column: 'sub_department', message: `Sub-department "${row['sub_department']}" not found` });
  if (subDesignationId === null)                                errors.push({ column: 'sub_designation', message: `Sub-designation "${row['sub_designation']}" not found` });

  const statusVal = coerce('enum', row['status'], EMPLOYEE_STATUS);
  const empTypeVal = coerce('enum', row['employment_type'], EMPLOYMENT_TYPE);
  if (statusVal === null)  errors.push({ column: 'status', message: 'Invalid status' });
  if (empTypeVal === null) errors.push({ column: 'employment_type', message: 'Invalid employment type' });

  const employeeCode  = toStr(row['employee_code']) ?? null;
  const referenceCode = toStr(row['reference_code']) ?? null;
  const avatarUrl     = toStr(row['avatar_url']) ?? null;
  const avatarSrc     = toStr(row['avatar']) ?? null;
  if (employeeCode && employeeCode.length > 30)  errors.push({ column: 'employee_code', message: 'Employee code cannot exceed 30 characters' });
  if (referenceCode && referenceCode.length > 50) errors.push({ column: 'reference_code', message: 'Reference code cannot exceed 50 characters' });
  if (avatarSrc && !/^(https?:\/\/|data:image\/|\/uploads\/)/i.test(avatarSrc))
    errors.push({ column: 'avatar', message: 'Avatar must be an http(s) URL, a data:image/… URI, or an existing /uploads/… path' });

  let reportingManagerId: number | null = null;
  if (!BLANK(row['reporting_manager_code'])) {
    const rm = resolvers.manager(String(row['reporting_manager_code']));
    if (rm == null) errors.push({ column: 'reporting_manager_code', message: `Reporting manager "${row['reporting_manager_code']}" not found` });
    else reportingManagerId = rm;
  }

  const roleErrors = await runStepValidators('role_identity', {
    company_id: companyId,
    first_name, last_name,
    middle_name: toStr(row['middle_name']),
    status: statusVal || 'Active',
    employment_type: empTypeVal || 'Permanent',
    department_id: departmentId ?? undefined,
    designation_id: designationId ?? undefined,
    sub_department_id: subDepartmentId ?? undefined,
    sub_designation_id: subDesignationId ?? undefined,
    email, phone,
  });
  errors.push(...roleErrors);

  const base = (first_name && last_name && email && phone && departmentId && designationId)
    ? {
        company_id: companyId,
        first_name, last_name,
        middle_name: toStr(row['middle_name']) ?? null,
        status: (statusVal as string) || 'Active',
        employment_type: (empTypeVal as string) || 'Permanent',
        department_id: departmentId,
        designation_id: designationId,
        sub_department_id: (subDepartmentId as number | undefined) ?? null,
        sub_designation_id: (subDesignationId as number | undefined) ?? null,
        email: email.toLowerCase(),
        phone,
        employee_code: employeeCode,
        reference_code: referenceCode,
        avatar_url: avatarUrl,
        avatar: avatarSrc,
        reporting_manager_id: reportingManagerId,
      }
    : null;

  // ── Each subsequent step ──────────────────────────────────────────────────
  for (const step of BULK_STEP_ORDER) {
    const defs = DEFS_BY_STEP.get(step) ?? [];
    const payload: Record<string, any> = {};
    let anyValue = false;
    const stepErrors: RowError[] = [];

    for (const d of defs) {
      const rawVal = row[d.col];
      let val: any;
      if (d.type === 'dbmaster') {
        if (BLANK(rawVal)) { val = undefined; }
        else {
          const fn = d.dbMaster === 'shift' ? resolvers.shift
            : d.dbMaster === 'manager' ? resolvers.manager
            : d.dbMaster === 'company' ? resolvers.company
            : d.dbMaster === 'sub_department' ? resolvers.subDepartment
            : d.dbMaster === 'sub_designation' ? resolvers.subDesignation
            : d.dbMaster === 'designation' ? resolvers.designation
            : resolvers.department;
          const r = fn(String(rawVal));
          if (r == null) { stepErrors.push({ column: d.col, message: `"${rawVal}" not found` }); val = undefined; }
          else val = r;
        }
      } else if (d.type === 'master' && d.master) {
        const r = resolveMasterOption(d.master, rawVal);
        if (r === null) { stepErrors.push({ column: d.col, message: `"${rawVal}" not a valid ${d.master.replace(/_/g, ' ')}` }); val = undefined; }
        else val = r;
      } else {
        val = coerce(d.type, rawVal, d.enumValues);
        if (val === null) stepErrors.push({ column: d.col, message: 'Invalid value' });
      }

      if (val !== undefined && val !== null) { payload[d.key] = val; anyValue = true; }
    }

    const repeatables = buildRepeatables(row, step, stepErrors);
    Object.assign(payload, repeatables);
    if (Object.keys(repeatables).length) anyValue = true;

    if (!anyValue) { errors.push(...stepErrors); continue; }   // step not touched (bad cells still surface)

    // requiredWithStep — hard-required once the block is in play
    for (const d of defs) {
      if (d.requiredWithStep && (payload[d.key] === undefined || payload[d.key] === '')) {
        stepErrors.push({ column: d.col, message: `${d.label} is required` });
      }
    }

    // employee_location_attendance.shift_category is NOT NULL with no DB default;
    // the wizard's dropdown always sends it. Default it here the same way the UI
    // implies: a fixed shift ⇒ 'Shift', otherwise 'Duration'.
    if (step === 'location_attendance' && payload.actual_doj && !payload.shift_category) {
      payload.shift_category = payload.shift_id ? 'Shift' : 'Duration';
    }

    stepErrors.push(...await runStepValidators(step, payload));
    errors.push(...stepErrors);
    steps[step] = payload;
  }

  // ── Cross-field sanity ────────────────────────────────────────────────────
  const dob = steps.personal_profile?.date_of_birth;
  const doj = steps.location_attendance?.actual_doj;
  if (dob && doj && dob >= doj) errors.push({ column: 'date_of_birth', message: 'Date of birth must be before date of joining' });
  const pIssue = steps.ids_bank?.passport_issue_date, pExp = steps.ids_bank?.passport_expiry;
  if (pIssue && pExp && pIssue >= pExp) errors.push({ column: 'passport_expiry', message: 'Passport expiry must be after issue date' });
  const dlIssue = steps.ids_bank?.driving_license_issue_date, dlExp = steps.ids_bank?.driving_license_expiry;
  if (dlIssue && dlExp && dlIssue >= dlExp) errors.push({ column: 'driving_license_expiry', message: 'Licence expiry must be after issue date' });

  // collapse exact-duplicate messages, and when a column has a specific
  // "not found / not a valid" resolver error, drop its generic follow-ups
  // ("is required", "Invalid value") that the validator chain then adds.
  const seenErr = new Set<string>();
  const specificCols = new Set(
    errors.filter(e => /not found|not a valid/i.test(e.message)).map(e => e.column),
  );
  const isGeneric = (m: string) => /^(invalid value|.* is required|invalid \w+)$/i.test(m.trim());
  const dedupErrors = errors.filter(e => {
    const k = `${e.column}|${e.message}`;
    if (seenErr.has(k)) return false;
    seenErr.add(k);
    if (specificCols.has(e.column) && !/not found|not a valid/i.test(e.message) && isGeneric(e.message)) return false;
    return true;
  // surface the readable header name in the error, matching the template
  }).map(e => ({ ...e, column: COL_TO_LABEL.get(e.column) ?? e.column }));

  return {
    ok: dedupErrors.length === 0 && base !== null,
    errors: dedupErrors,
    base,
    steps,
    identity: {
      email: (email ?? '').toLowerCase(),
      phone: phone ?? '',
      aadhaar: steps.ids_bank?.aadhaar_number ?? null,
      employee_code: employeeCode,
      reference_code: referenceCode,
    },
  };
}

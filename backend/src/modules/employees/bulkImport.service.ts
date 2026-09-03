/**
 * bulkImport.service.ts
 * Orchestrates the full-field employee bulk import:
 *   parse  → per-row map + backend validation + master resolve + dedupe
 *          → per-row transactional create (reuses EmployeeService.bulkCreateEmployee)
 *   result → summary + failed rows with their original values + clear errors,
 *            so the caller can hand back a re-uploadable file.
 *
 * Every valid row is committed independently — 40 bad rows never block the
 * other 60.
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

import { AppError } from '../../middleware/errorHandler.middleware';
import { employeeService } from './employee.service';
import { employeeRepository as repo } from './employee.repo';
import { Employee, EmployeeStatutory } from '../../database/models/Employee';
import { normalizePhone } from '../../utils/normalizeNumber';
import { buildResolvers, mapRow, normaliseKeys, resolveHeader, type RowError, type Resolvers } from './bulkImport.mapper';
import { allTemplateColumns } from './bulkImport.fields';

/** Marker our generated templates put at the start of the instruction/help row. */
export const TEMPLATE_INSTRUCTION_MARKER = '# INSTRUCTIONS';

/**
 * The row directly under the header in our template is human-readable guidance
 * ("REQUIRED", "one of: …", "YYYY-MM-DD" …), not an employee. Users routinely
 * leave it in place. Detect and skip it so it never becomes a failed row.
 *  1. explicit marker in the first populated cell (our own templates), or
 *  2. fingerprint: guidance text with no valid email anywhere in the row.
 */
function isInstructionRow(values: string[]): boolean {
  const filled = values.map(v => v.trim()).filter(Boolean);
  if (!filled.length) return false;

  const head = filled.slice(0, 3).join(' ').toLowerCase();
  if (/^(#|>>>|\[instruction|instruction|instructions|do not (edit|delete|remove)|example row|sample row|help row)/.test(head)) {
    return true;
  }

  const joined = filled.join(' | ').toLowerCase();
  const hasEmail = /[^\s@|]+@[^\s@|]+\.[^\s@|]+/.test(joined);
  if (hasEmail) return false;
  const tokens = ['required', 'one of:', 'yyyy-mm-dd', 'auto-generate', 'globally unique', 'leave blank', 'optional', 'default:'];
  const hits = tokens.filter(t => joined.includes(t)).length;
  return hits >= 3;
}

export const BULK_IMPORT_MAX_ROWS = 2000;
const REQUIRED_HEADERS = ['first_name', 'last_name', 'email', 'phone', 'department', 'designation'];

// ─── Avatar localisation ─────────────────────────────────────────────────────
// The Avatar column can hold a URL / data-URI; localise it into the same
// `uploads/employee-avatars/<id>/` folder the profile-photo endpoint uses.

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

/** Reject obviously-internal hosts so the URL fetch isn't an SSRF vector. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (/^(0\.|127\.|10\.|169\.254\.|192\.168\.)/.test(h)) return true;
  const m = h.match(/^172\.(\d+)\./);
  if (m && +m[1] >= 16 && +m[1] <= 31) return true;
  if (h === '::1' || h === '::' || h.startsWith('fd') || h.startsWith('fe80')) return true;
  return false;
}

async function localiseAvatar(source: string, employeeId: number): Promise<string> {
  const s = source.trim();
  if (s.startsWith('/uploads/')) return s;               // already a stored path

  const dir = path.join(process.cwd(), 'uploads', 'employee-avatars', String(employeeId));
  const write = (buf: Buffer, ext: string): string => {
    if (buf.length > AVATAR_MAX_BYTES) throw new AppError('Avatar image exceeds 2 MB', 400);
    if (!buf.length) throw new AppError('Avatar image is empty', 400);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `avatar-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buf);
    return `/uploads/employee-avatars/${employeeId}/${filename}`;
  };

  const dataUri = s.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/is);
  if (dataUri) {
    return write(Buffer.from(dataUri[2], 'base64'), AVATAR_EXT_BY_MIME[dataUri[1].toLowerCase()] ?? 'jpg');
  }

  let url: URL;
  try { url = new URL(s); } catch { throw new AppError('Avatar is not a valid URL', 400); }
  if (!/^https?:$/.test(url.protocol)) throw new AppError('Avatar URL must be http or https', 400);
  if (isBlockedHost(url.hostname)) throw new AppError('Avatar URL host is not allowed', 400);
  if (typeof fetch !== 'function') throw new AppError('Avatar-from-URL needs Node 18+; use a data: URI or /uploads path', 400);

  const resp = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new AppError(`Avatar download failed (HTTP ${resp.status})`, 400);
  const mime = (resp.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  let ext = AVATAR_EXT_BY_MIME[mime];
  if (!ext) {
    const m = url.pathname.toLowerCase().match(/\.(jpe?g|png|webp)(?:$|\?)/);
    ext = m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : '';
  }
  if (!ext) throw new AppError('Avatar URL is not a JPG / PNG / WebP image', 400);
  return write(Buffer.from(await resp.arrayBuffer()), ext);
}

export interface BulkImportRowFailure {
  row:    number;
  name:   string;
  reason: string;                          // "; "-joined, for back-compat display
  errors: RowError[];                      // structured, column-anchored
  data:   Record<string, unknown>;         // original row values (for re-upload)
}

export interface BulkImportResult {
  total:    number;
  imported: number;          // successful rows = created + updated
  createdCount: number;
  updated:  number;
  failed:   number;
  created:  Array<{ row: number; employeeId: number; employeeCode: string | null; completionPct: number; action: 'created' | 'updated' }>;
  errors:   BulkImportRowFailure[];
  warnings: Array<{ row: number; message: string }>;
  // legacy-compatible aliases (old frontend reads these)
  success:  number;
}

interface ParsedRow { rowNumber: number; raw: Record<string, unknown> }

// ─── Parse ───────────────────────────────────────────────────────────────────

export function parseWorkbook(buf: Buffer): { headers: string[]; rows: ParsedRow[] } {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  } catch {
    throw new AppError('Could not read the file — upload a valid .xlsx, .xls or .csv', 400);
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new AppError('The file has no sheets', 400);

  const aoa: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1, raw: true, blankrows: false,
  });
  if (aoa.length < 2) throw new AppError('The file needs a header row and at least one data row', 400);

  // Accept both readable labels ("Salary Mode") and raw field keys ("salary_mode").
  const headers = (aoa[0] || []).map(h => resolveHeader(String(h ?? '')));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const arr = aoa[i] || [];
    if (arr.every(c => c === null || c === undefined || String(c).trim() === '')) continue;
    // Skip the template's instruction/help row — never treat it as an employee.
    if (isInstructionRow(arr.map(c => String(c ?? '')))) continue;
    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => { if (h) raw[h] = arr[idx] ?? null; });
    rows.push({ rowNumber: i + 1, raw });
  }
  return { headers, rows };
}

const COL_TO_STEP = new Map(allTemplateColumns().map(c => [c.col, c.step] as const));

/** Is any column belonging to `step` filled in this row? */
function stepTouched(raw: Record<string, unknown>, step: string): boolean {
  for (const [col, s] of COL_TO_STEP) {
    if (s !== step) continue;
    const v = raw[col];
    if (v != null && String(v).trim() !== '') return true;
  }
  return false;
}

/**
 * For an UPDATE row (Employee Code matched an existing employee) the admin may
 * fill only the columns they want to change. Back-fill the still-required cells
 * from the current record so the row validates without forcing them to re-type
 * name / email / department every time — and, for a step the row DOES touch,
 * that step's required anchors (Date of Joining, Aadhaar, personal bank) so a
 * partial edit doesn't fail on them. Only blank cells are touched; anything the
 * sheet provides always wins. Anchors for untouched steps are left alone so
 * those sections are never rewritten.
 */
function backfillRequiredCells(
  raw: Record<string, unknown>,
  existing: Employee,
  detail: any,
  resolvers: Resolvers,
): void {
  const fill = (key: string, value: unknown) => {
    if (value == null || value === '') return;
    const cur = raw[key];
    if (cur == null || String(cur).trim() === '') raw[key] = value;
  };

  // identity / role — always required for every row
  fill('first_name', existing.first_name);
  fill('middle_name', existing.middle_name);
  fill('last_name', existing.last_name);
  fill('email', existing.email);
  fill('phone', existing.phone);
  fill('status', existing.status);
  fill('employment_type', existing.employment_type);
  fill('company', resolvers.names.company(existing.company_id));
  fill('department', resolvers.names.department(existing.department_id));
  fill('designation', resolvers.names.designation(existing.designation_id));
  fill('sub_department', resolvers.names.subDepartment(existing.sub_department_id));
  fill('sub_designation', resolvers.names.subDesignation(existing.sub_designation_id));

  const d = detail && typeof detail.toJSON === 'function' ? detail.toJSON() : (detail ?? {});

  if (stepTouched(raw, 'location_attendance')) {
    fill('date_of_joining', d.locationAttendance?.actual_doj);
  }
  if (stepTouched(raw, 'ids_bank')) {
    fill('aadhaar_number', d.statutory?.aadhaar_number);
    fill('aadhaar_name', d.statutory?.aadhaar_name);
    fill('aadhaar_dob', d.statutory?.aadhaar_dob);
    fill('aadhaar_address', d.statutory?.aadhaar_address);
    const pb = (d.bankDetails ?? []).find((b: any) => b.bank_type === 'personal');
    fill('personal_bank_name', pb?.bank_name);
    fill('personal_bank_account', pb?.account_number);
    fill('personal_ifsc', pb?.ifsc_code);
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export async function runBulkImport(buf: Buffer, companyId: number, actorId: number): Promise<BulkImportResult> {
  const { headers, rows } = parseWorkbook(buf);

  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missing.length) throw new AppError(`Missing required columns: ${missing.join(', ')}`, 400);
  if (rows.length > BULK_IMPORT_MAX_ROWS) throw new AppError(`Maximum ${BULK_IMPORT_MAX_ROWS} rows per upload`, 400);

  const resolvers = await buildResolvers(companyId);

  const result: BulkImportResult = {
    total: rows.length, imported: 0, createdCount: 0, updated: 0, failed: 0, success: 0,
    created: [], errors: [], warnings: [],
  };

  // within-file dedupe
  const seenEmail = new Set<string>();
  const seenPhone = new Set<string>();
  const seenAadhaar = new Set<string>();
  const seenCode = new Set<string>();
  const seenRef = new Set<string>();

  for (const { rowNumber, raw } of rows) {
    const name = `${raw['first_name'] ?? ''} ${raw['last_name'] ?? ''}`.trim();
    const fail = (errors: RowError[]) => {
      result.failed++;
      result.errors.push({
        row: rowNumber, name,
        reason: errors.map(e => `${e.column}: ${e.message}`).join('; '),
        errors,
        data: raw,
      });
    };

    try {
      // ── Existing employee? (Employee Code supplied and already on file) ──
      // If so, this row UPDATES that employee; otherwise it CREATES a new one.
      const rawCode = String(raw['employee_code'] ?? '').trim();
      const existing = rawCode ? await repo.findByCode(rawCode) : null;
      if (existing) {
        const detail = await repo.findById(existing.id, existing.company_id, true);
        backfillRequiredCells(raw, existing, detail, resolvers);
      }
      const excludeId = existing?.id;

      const mapped = await mapRow(raw, resolvers);
      const errors = [...mapped.errors];

      // ── Duplicate checks (skip the matched employee itself on updates) ──
      const email = mapped.identity.email;
      const phoneNorm = mapped.identity.phone ? normalizePhone(mapped.identity.phone) : '';
      const aadhaar = mapped.identity.aadhaar;
      const empCode = mapped.identity.employee_code;
      const refCode = mapped.identity.reference_code;

      if (email) {
        if (seenEmail.has(email)) errors.push({ column: 'email', message: 'Duplicate email — appears earlier in this file' });
        else if (await repo.findByEmail(email, excludeId)) errors.push({ column: 'email', message: 'Email already registered to another employee' });
      }
      if (phoneNorm) {
        if (seenPhone.has(phoneNorm)) errors.push({ column: 'phone', message: 'Duplicate phone — appears earlier in this file' });
        else if (await repo.findByMobile(phoneNorm, excludeId)) errors.push({ column: 'phone', message: 'Phone already registered to another employee' });
      }
      if (aadhaar) {
        if (seenAadhaar.has(aadhaar)) errors.push({ column: 'aadhaar_number', message: 'Duplicate Aadhaar — appears earlier in this file' });
        else if (await EmployeeStatutory.findOne({
          where: { aadhaar_number: aadhaar, ...(excludeId ? { employee_id: { [Op.ne]: excludeId } } : {}) },
          attributes: ['employee_id'],
        }))
          errors.push({ column: 'aadhaar_number', message: 'Aadhaar already registered to another employee' });
      }
      if (empCode) {
        if (seenCode.has(empCode.toLowerCase())) errors.push({ column: 'employee_code', message: 'Duplicate employee code — appears earlier in this file' });
        else if (!existing && await Employee.findOne({ where: { employee_code: empCode }, attributes: ['id'] }))
          errors.push({ column: 'employee_code', message: `Employee code "${empCode}" is already in use` });
      }
      if (refCode) {
        if (seenRef.has(refCode.toLowerCase())) errors.push({ column: 'reference_code', message: 'Duplicate reference code — appears earlier in this file' });
        else if (await Employee.findOne({
          where: { reference_code: refCode, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) },
          attributes: ['id'],
        }))
          errors.push({ column: 'reference_code', message: `Reference code "${refCode}" is already in use` });
      }

      if (errors.length || !mapped.base) {
        if (!mapped.base && !errors.length) errors.push({ column: 'general', message: 'Row is missing required identity fields' });
        fail(errors);
        continue;
      }

      // ── Import / update (own transaction) ──────────────────────────────
      const res = existing
        ? await employeeService.bulkUpdateEmployee(existing.id, existing.company_id, mapped.base, mapped.steps, actorId)
        : await employeeService.bulkCreateEmployee(mapped.base, mapped.steps, actorId);

      // ── Avatar — download / decode the source into the employee upload
      // folder (same storage the profile-photo endpoint uses) and store the
      // path. A bad avatar is a warning, never a failed row.
      if (mapped.base.avatar) {
        try {
          const stored = await localiseAvatar(mapped.base.avatar, res.employeeId);
          await Employee.update(
            { avatar_url: stored, updated_by: actorId },
            { where: { id: res.employeeId } },
          );
        } catch (e: any) {
          result.warnings.push({ row: rowNumber, message: `avatar not saved — ${e?.message ?? e}` });
        }
      }

      seenEmail.add(email);
      if (phoneNorm) seenPhone.add(phoneNorm);
      if (aadhaar) seenAadhaar.add(aadhaar);
      if (empCode) seenCode.add(empCode.toLowerCase());
      if (refCode) seenRef.add(refCode.toLowerCase());

      result.imported++;
      result.success++;
      if (existing) result.updated++; else result.createdCount++;
      result.created.push({
        row: rowNumber, employeeId: res.employeeId,
        employeeCode: res.employeeCode, completionPct: res.completionPct,
        action: existing ? 'updated' : 'created',
      });
      for (const w of res.warnings) result.warnings.push({ row: rowNumber, message: w });
    } catch (err: any) {
      const msg = err instanceof AppError ? err.message : (err?.parent?.sqlMessage || err?.message || 'Unexpected error');
      fail([{ column: 'general', message: msg }]);
    }
  }

  return result;
}

// ─── Template + failed-rows workbook (server-side, no dropdowns) ──────────────

export function buildTemplateWorkbook(): Buffer {
  const cols = allTemplateColumns();
  const header = cols.map(c => c.label);          // readable headers ("Salary Mode")
  const helpRow = cols.map((c, i) => {
    const bits: string[] = [];
    if (c.required) bits.push('REQUIRED');
    if (c.enumValues?.length) bits.push(`one of: ${c.enumValues.join(' | ')}`);
    if (c.help) bits.push(c.help);
    const text = bits.join('  •  ');
    // marker on the first cell so the importer skips this guidance row even if
    // the admin leaves it in the file
    return i === 0 ? `${TEMPLATE_INSTRUCTION_MARKER} — delete this row before importing.  ${text}`.trim() : text;
  });

  const ws = XLSX.utils.aoa_to_sheet([header, helpRow]);
  ws['!cols'] = header.map(h => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const legend = cols.map(c => ({
    header: c.label, field_key: c.col, step: c.step,
    required: c.required ? 'yes' : '', allowed_values: c.enumValues?.join(' | ') ?? '', note: c.help ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(legend), 'Field guide');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function buildErrorWorkbook(failures: BulkImportRowFailure[]): Buffer {
  const cols = allTemplateColumns();                       // readable headers, re-uploadable
  const rows = failures.map(fx => {
    const norm = normaliseKeys(fx.data);
    const out: Record<string, unknown> = {};
    for (const c of cols) out[c.label] = norm[c.col] ?? '';
    out['_row'] = fx.row;
    out['_errors'] = fx.errors.map(e => `${e.column}: ${e.message}`).join('\n');
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...cols.map(c => c.label), '_row', '_errors'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed rows');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

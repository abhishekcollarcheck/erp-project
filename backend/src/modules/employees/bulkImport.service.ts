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

import { AppError } from '../../middleware/errorHandler.middleware';
import { employeeService } from './employee.service';
import { employeeRepository as repo } from './employee.repo';
import { Employee, EmployeeStatutory } from '../../database/models/Employee';
import { normalizePhone } from '../../utils/normalizeNumber';
import { buildResolvers, mapRow, normaliseKeys, type RowError } from './bulkImport.mapper';
import { allTemplateColumns } from './bulkImport.fields';

export const BULK_IMPORT_MAX_ROWS = 2000;
const REQUIRED_HEADERS = ['first_name', 'last_name', 'email', 'phone', 'department', 'designation'];

export interface BulkImportRowFailure {
  row:    number;
  name:   string;
  reason: string;                          // "; "-joined, for back-compat display
  errors: RowError[];                      // structured, column-anchored
  data:   Record<string, unknown>;         // original row values (for re-upload)
}

export interface BulkImportResult {
  total:    number;
  imported: number;
  failed:   number;
  created:  Array<{ row: number; employeeId: number; employeeCode: string | null; completionPct: number }>;
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

  const headers = (aoa[0] || []).map(h => String(h ?? '').trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const arr = aoa[i] || [];
    if (arr.every(c => c === null || c === undefined || String(c).trim() === '')) continue;
    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => { if (h) raw[h] = arr[idx] ?? null; });
    rows.push({ rowNumber: i + 1, raw });
  }
  return { headers, rows };
}

// ─── Run ─────────────────────────────────────────────────────────────────────

export async function runBulkImport(buf: Buffer, companyId: number, actorId: number): Promise<BulkImportResult> {
  const { headers, rows } = parseWorkbook(buf);

  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missing.length) throw new AppError(`Missing required columns: ${missing.join(', ')}`, 400);
  if (rows.length > BULK_IMPORT_MAX_ROWS) throw new AppError(`Maximum ${BULK_IMPORT_MAX_ROWS} rows per upload`, 400);

  const resolvers = await buildResolvers(companyId);

  const result: BulkImportResult = {
    total: rows.length, imported: 0, failed: 0, success: 0,
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
      const mapped = await mapRow(raw, resolvers);
      const errors = [...mapped.errors];

      // ── Duplicate checks ────────────────────────────────────────────────
      const email = mapped.identity.email;
      const phoneNorm = mapped.identity.phone ? normalizePhone(mapped.identity.phone) : '';
      const aadhaar = mapped.identity.aadhaar;
      const empCode = mapped.identity.employee_code;
      const refCode = mapped.identity.reference_code;

      if (email) {
        if (seenEmail.has(email)) errors.push({ column: 'email', message: 'Duplicate email — appears earlier in this file' });
        else if (await repo.findByEmail(email)) errors.push({ column: 'email', message: 'Email already registered to another employee' });
      }
      if (phoneNorm) {
        if (seenPhone.has(phoneNorm)) errors.push({ column: 'phone', message: 'Duplicate phone — appears earlier in this file' });
        else if (await repo.findByMobile(phoneNorm)) errors.push({ column: 'phone', message: 'Phone already registered to another employee' });
      }
      if (aadhaar) {
        if (seenAadhaar.has(aadhaar)) errors.push({ column: 'aadhaar_number', message: 'Duplicate Aadhaar — appears earlier in this file' });
        else if (await EmployeeStatutory.findOne({ where: { aadhaar_number: aadhaar }, attributes: ['employee_id'] }))
          errors.push({ column: 'aadhaar_number', message: 'Aadhaar already registered to another employee' });
      }
      if (empCode) {
        if (seenCode.has(empCode.toLowerCase())) errors.push({ column: 'employee_code', message: 'Duplicate employee code — appears earlier in this file' });
        else if (await Employee.findOne({ where: { employee_code: empCode }, attributes: ['id'] }))
          errors.push({ column: 'employee_code', message: `Employee code "${empCode}" is already in use` });
      }
      if (refCode) {
        if (seenRef.has(refCode.toLowerCase())) errors.push({ column: 'reference_code', message: 'Duplicate reference code — appears earlier in this file' });
        else if (await Employee.findOne({ where: { reference_code: refCode }, attributes: ['id'] }))
          errors.push({ column: 'reference_code', message: `Reference code "${refCode}" is already in use` });
      }

      if (errors.length || !mapped.base) {
        if (!mapped.base && !errors.length) errors.push({ column: 'general', message: 'Row is missing required identity fields' });
        fail(errors);
        continue;
      }

      // ── Import (own transaction) ────────────────────────────────────────
      const res = await employeeService.bulkCreateEmployee(mapped.base, mapped.steps, actorId);

      seenEmail.add(email);
      if (phoneNorm) seenPhone.add(phoneNorm);
      if (aadhaar) seenAadhaar.add(aadhaar);
      if (empCode) seenCode.add(empCode.toLowerCase());
      if (refCode) seenRef.add(refCode.toLowerCase());

      result.imported++;
      result.success++;
      result.created.push({
        row: rowNumber, employeeId: res.employeeId,
        employeeCode: res.employeeCode, completionPct: res.completionPct,
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
  const header = cols.map(c => c.col);
  const helpRow = cols.map(c => {
    const bits: string[] = [];
    if (c.required) bits.push('REQUIRED');
    if (c.enumValues?.length) bits.push(`one of: ${c.enumValues.join(' | ')}`);
    if (c.help) bits.push(c.help);
    return bits.join('  •  ');
  });

  const ws = XLSX.utils.aoa_to_sheet([header, helpRow]);
  ws['!cols'] = header.map(h => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const legend = cols.map(c => ({
    column: c.col, label: c.label, step: c.step,
    required: c.required ? 'yes' : '', allowed_values: c.enumValues?.join(' | ') ?? '', note: c.help ?? '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(legend), 'Field guide');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function buildErrorWorkbook(failures: BulkImportRowFailure[]): Buffer {
  const cols = allTemplateColumns().map(c => c.col);
  const rows = failures.map(fx => {
    const norm = normaliseKeys(fx.data);
    const out: Record<string, unknown> = {};
    for (const c of cols) out[c] = norm[c] ?? '';
    out['_row'] = fx.row;
    out['_errors'] = fx.errors.map(e => `${e.column}: ${e.message}`).join('\n');
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows, { header: [...cols, '_row', '_errors'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Failed rows');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

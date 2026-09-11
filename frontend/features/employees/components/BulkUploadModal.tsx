'use client';

import React, { CSSProperties, useMemo, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { Modal } from '../../../components/ui/Modal';
import { useBulkImport } from '../hooks/useEmployees';
import { employeeService } from '../../../services/api/employee.service';
import type { BulkImportResult } from '../types/employee.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['csv', 'xlsx', 'xls'];

const DROPZONE_BASE_STYLE: CSSProperties = {
  borderRadius: 'var(--r2)',
  padding: '32px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all .15s',
  marginBottom: 16,
};

interface TemplateColumn {
  col: string;
  label: string;
  step: string;
  stepLabel?: string;
  required: boolean;
  help?: string;
  enumValues?: string[];
  optionSource?: string;
  strictOptions?: boolean;
}

const VALIDATION_ROWS = 500;
// Excel caps an inline data-validation list ("a,b,c") near 255 chars; longer
// lists (or any value containing a comma) go through a hidden helper sheet.
const INLINE_LIST_MAX = 250;

// One distinct header colour per Employee-form step, so the template's column
// groups are visually separable at a glance. Keyed by step key; falls back to
// a neutral slate for anything unmapped. All dark enough for white header text.
const STEP_HEADER_COLORS: Record<string, string> = {
  role_identity:         'FF2563EB',
  location_attendance:   'FF0891B2',
  managers_work_contact: 'FF7C3AED',
  commitment_probation:  'FFDB2777',
  statutory_schemes:     'FFEA580C',
  compensation:          'FFCA8A04',
  hr_joining_checklist:  'FF65A30D',
  personal_profile:      'FF059669',
  address:               'FF0D9488',
  family_emergency:      'FF4F46E5',
  ids_bank:              'FFBE123C',
  experience_education:  'FF475569',
};
const STEP_HEADER_FALLBACK = 'FF64748B';

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function BulkUploadModal({ open, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const bulkMutation = useBulkImport();
  const isUploading = bulkMutation.isPending;

  const formattedFileSize = useMemo(() => (file ? `${(file.size / 1024).toFixed(1)} KB` : ''), [file]);

  const resetState = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setDragOver(false);
  };

  const handleClose = () => { resetState(); onClose(); };

  const validateFile = (f: File): string | null => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) return 'Please upload a CSV, XLSX or XLS file';
    if (f.size > MAX_FILE_SIZE) return 'Maximum file size is 10 MB';
    return null;
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError(null);
    setResult(null);
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    try {
      setError(null);
      const res: any = await bulkMutation.mutateAsync(file);
      setResult(res.data as BulkImportResult);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Import failed');
    }
  };

  // The template is built client-side with ExcelJS so the Company column can be
  // a real Excel dropdown populated from the company master (SheetJS on the
  // backend cannot write data validations). Columns + companies both come from
  // the API — nothing is hard-coded here.
  const downloadTemplate = async () => {
    try {
      setTemplateLoading(true);
      setError(null);

      const resp: any = await employeeService.bulkImportFields();
      const columns: TemplateColumn[] = resp?.data?.columns ?? [];
      // options[col] = live dropdown values (enum constants + master/catalogue
      // lists), served by the API so nothing is hardcoded here.
      const options: Record<string, string[]> = resp?.data?.options ?? {};
      const companies: Array<{ id: number; name: string }> = resp?.data?.companies ?? [];
      if (!columns.length) throw new Error('no columns');
      // Back-compat: older API builds only sent `companies`.
      if (!options['company'] && companies.length) options['company'] = companies.map((c) => c.name);

      const wb = new ExcelJS.Workbook();
      wb.creator = 'HR';
      wb.created = new Date();

      const sheet = wb.addWorksheet('Employees');
      const header = columns.map((c) => c.label);   // readable headers ("Salary Mode")
      const optsOf = (c: TemplateColumn) => options[c.col] ?? (c.enumValues ?? []);
      const helpRow = columns.map((c, i) => {
        const bits: string[] = [];
        if (c.required) bits.push('REQUIRED');
        const list = optsOf(c);
        if (list.length) {
          const shown = list.length > 12 ? `${list.slice(0, 12).join(' | ')} | …` : list.join(' | ');
          bits.push(c.strictOptions ? `one of: ${shown}` : `pick from list (others allowed): ${shown}`);
        }
        if (c.help) bits.push(c.help);
        const text = bits.join('  •  ');
        // Marker on the first cell — the importer skips this guidance row even
        // if it's left in the uploaded file.
        return i === 0 ? `# INSTRUCTIONS — delete this row before importing.  ${text}`.trim() : text;
      });
      sheet.addRow(header);
      sheet.addRow(helpRow);

      const headerRow = sheet.getRow(1);
      headerRow.height = 22;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.alignment = { vertical: 'middle' };
      // Per-step header colour — each Employee-form step gets its own hue, and a
      // thin white divider on the first column of every new group.
      let prevStep = '';
      columns.forEach((c, i) => {
        const cell = sheet.getCell(1, i + 1);
        cell.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: STEP_HEADER_COLORS[c.step] ?? STEP_HEADER_FALLBACK },
        };
        if (c.step !== prevStep) {
          cell.border = { left: { style: 'medium', color: { argb: 'FFFFFFFF' } } };
          prevStep = c.step;
        }
      });
      sheet.getRow(2).font = { italic: true, size: 9, color: { argb: 'FF94A3B8' } };

      header.forEach((h, i) => { sheet.getColumn(i + 1).width = Math.max(h.length + 2, 16); });
      sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 2 }];

      // Colour legend so the header hues are self-explanatory.
      const seenSteps = new Set<string>();
      const legendSheet = wb.addWorksheet('Step colours');
      legendSheet.addRow(['Employee form step', 'Columns']).font = { bold: true };
      columns.forEach((c) => {
        if (seenSteps.has(c.step)) return;
        seenSteps.add(c.step);
        const count = columns.filter((x) => x.step === c.step).length;
        const row = legendSheet.addRow([c.stepLabel ?? c.step, count]);
        row.getCell(1).fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: STEP_HEADER_COLORS[c.step] ?? STEP_HEADER_FALLBACK },
        };
        row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      });
      legendSheet.getColumn(1).width = 28;
      legendSheet.getColumn(2).width = 10;

      // ── Dropdowns — one per column that has a value list ──────────────────
      // Short comma-free lists go inline; anything longer or with a comma in a
      // value goes through a hidden helper sheet (Excel needs a range there).
      const helperSheet = wb.addWorksheet('_lists', { state: 'veryHidden' });
      let helperCol = 0;
      columns.forEach((c, i) => {
        const list = (optsOf(c) as string[]).filter(Boolean);
        if (!list.length) return;

        const colLetter = sheet.getColumn(i + 1).letter;
        const joined = list.join(',');
        const inline = joined.length <= INLINE_LIST_MAX && !list.some((v) => v.includes(','));

        let formula: string;
        if (inline) {
          formula = `"${joined}"`;
        } else {
          helperCol += 1;
          const hLetter = helperSheet.getColumn(helperCol).letter;
          list.forEach((v, r) => { helperSheet.getCell(`${hLetter}${r + 1}`).value = v; });
          formula = `_lists!$${hLetter}$1:$${hLetter}$${list.length}`;
        }

        for (let r = 3; r <= VALIDATION_ROWS; r++) {
          sheet.getCell(`${colLetter}${r}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [formula],
            showErrorMessage: true,
            // strict (enum / true master FK) → block unknown values;
            // catalogue picklists → warn only, free text still allowed.
            errorStyle: c.strictOptions ? 'error' : 'warning',
            errorTitle: c.strictOptions ? 'Invalid value' : 'Check value',
            error: `${c.label}: pick a value from the list${c.strictOptions ? '' : ' (or type your own)'}.`,
          };
        }
      });
      if (helperCol === 0) wb.removeWorksheet(helperSheet.id);

      // "Field guide" sheet — every column, its step, whether required, the full
      // dropdown list (if any) and the hint.
      const guide = wb.addWorksheet('Field guide');
      guide.addRow(['step', 'header', 'field_key', 'required', 'dropdown', 'allowed_values', 'hint']);
      guide.getRow(1).font = { bold: true };
      columns.forEach((c) => {
        const list = optsOf(c) as string[];
        guide.addRow([
          c.stepLabel ?? c.step, c.label, c.col, c.required ? 'yes' : '',
          list.length ? (c.strictOptions ? 'yes (strict)' : 'yes (suggested)') : '',
          list.join(' | '), c.help ?? '',
        ]);
      });
      [24, 26, 24, 10, 14, 40, 48].forEach((w, i) => { guide.getColumn(i + 1).width = w; });

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), 'employee_bulk_import_template.xlsx');
    } catch {
      setError('Could not download the template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const downloadFailedRows = () => {
    if (!result?.errorFileBase64) return;
    const blob = base64ToBlob(
      result.errorFileBase64,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    saveAs(blob, 'employee_import_failed_rows.xlsx');
  };

  const dropzoneStyle: CSSProperties = {
    ...DROPZONE_BASE_STYLE,
    border: `2px dashed ${dragOver ? 'var(--blue)' : file ? 'var(--green)' : 'var(--border2)'}`,
    background: dragOver ? 'var(--blue-lt)' : file ? 'var(--green-lt)' : 'var(--surface2)',
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Import Employees"
      subtitle="Import employees with all fields — validated per row, valid rows import even if others fail"
      width={640}
      footer={
        result ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
            <div>
              {result.errors.length > 0 && (
                <button className="btn btn-sec btn-sm" onClick={downloadFailedRows}>
                  ↓ Download failed rows (.xlsx)
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {result.errors.length > 0 && (
                <button className="btn btn-sec" onClick={resetState}>Upload corrected file</button>
              )}
              <button className="btn btn-pri" onClick={handleClose}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <button className="btn btn-sec" onClick={handleClose} disabled={isUploading}>Cancel</button>
            <button
              className="btn btn-pri"
              onClick={handleUpload}
              disabled={!file || isUploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isUploading && (
                <span
                  style={{
                    width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)',
                    borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                    animation: 'spin .7s linear infinite',
                  }}
                />
              )}
              {isUploading ? 'Importing…' : '↑ Import File'}
            </button>
          </>
        )
      }
    >
      {!result ? (
        <>
          <div
            style={{
              background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r)',
              padding: '12px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 2 }}>Download template</div>
              <div style={{ fontSize: 11, color: 'var(--ink4)' }}>
                All supported columns + a “Field guide” sheet listing required fields and allowed values
              </div>
            </div>
            <button className="btn btn-sec btn-sm" onClick={downloadTemplate} disabled={templateLoading}>
              {templateLoading ? '…' : '↓ Template'}
            </button>
          </div>

          {error && (
            <div
              style={{
                background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)',
                padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--red)',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)',
              padding: '10px 14px', marginBottom: 16, fontSize: 11, color: 'var(--amber)', lineHeight: 1.7,
            }}
          >
            <strong>How it works</strong>
            <br />• One row per employee. Required: First Name, Last Name, Personal Email, Personal Mobile, Department, Designation
            <br />• Column headers are readable labels (e.g. “Salary Mode”) — old key-style headers still work
            <br />• <strong>New employee</strong> → leave Employee Code blank. <strong>Existing employee</strong> → fill Employee Code; only that row&apos;s filled columns are updated
            <br />• The grey instruction row is auto-detected and skipped — you can leave it in the file
            <br />• When updating, re-enter all columns for any section you change (blank cells in that section are cleared)
            <br />• Company is a dropdown; Department / Designation / Shift use real names
            <br />• Avatar accepts an image URL / data-URI — it&apos;s downloaded into the employee upload folder and linked automatically
            <br />• Personal Email &amp; Mobile must be globally unique; dates are YYYY-MM-DD
            <br />• Each row is validated and imported independently — bad rows come back in a downloadable file to fix &amp; re-upload
            <br />• Employee Code and all salary / probation / RD figures are auto-calculated
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
            onClick={() => fileRef.current?.click()}
            style={dropzoneStyle}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? '✅' : '📄'}</div>
            {file ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{formattedFileSize} · Click to replace</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Drop CSV or Excel file here</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>CSV / XLSX / XLS · Max 10 MB</div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total rows', value: result.total, color: 'var(--blue)' },
              { label: 'Imported', value: result.imported, color: 'var(--green)' },
              { label: 'Failed', value: result.failed, color: result.failed > 0 ? 'var(--red)' : 'var(--ink4)' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 8px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: item.color, marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {result.imported > 0 && (
            <div
              style={{
                background: 'var(--green-lt)', border: '1px solid var(--green-bd)', borderRadius: 'var(--r)',
                padding: '10px 14px', fontSize: 12, color: 'var(--green)', marginBottom: 12,
              }}
            >
              ✓ {result.imported} employee{result.imported !== 1 ? 's' : ''} imported
              {(result.createdCount ?? 0) + (result.updated ?? 0) > 0 && (
                <> — {result.createdCount ?? 0} created, {result.updated ?? 0} updated</>
              )}
            </div>
          )}

          {result.created?.length > 0 && (
            <details style={{ marginBottom: 12 }}>
              <summary style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, cursor: 'pointer', userSelect: 'none', marginBottom: 8 }}>
                View imported employees &amp; codes ↓
              </summary>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 50 }}>Row</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 80 }}>Action</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Employee Code</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 90 }}>Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((c, i) => (
                      <tr key={`${c.row}-${i}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', color: 'var(--ink4)' }}>#{c.row}</td>
                        <td style={{ padding: '6px 10px', color: c.action === 'updated' ? 'var(--blue)' : 'var(--green)' }}>
                          {c.action === 'updated' ? 'Updated' : 'Created'}
                        </td>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                          {c.employeeCode ?? <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>pending — profile incomplete</span>}
                        </td>
                        <td style={{ padding: '6px 10px', color: c.completionPct === 100 ? 'var(--green)' : 'var(--ink4)' }}>{c.completionPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {result.warnings?.length > 0 && (
            <div
              style={{
                background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)',
                padding: '10px 14px', fontSize: 11, color: 'var(--amber)', marginBottom: 12, lineHeight: 1.6,
              }}
            >
              {result.warnings.map((w, i) => (
                <div key={i}>Row {w.row}: {w.message}</div>
              ))}
            </div>
          )}

          {result.errors.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>Failed rows ({result.errors.length})</div>
                <button className="btn btn-sec btn-sm" onClick={downloadFailedRows}>↓ Download .xlsx</button>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 50 }}>Row</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', width: 120 }}>Name</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, borderBottom: '1px solid var(--border)', color: 'var(--red)' }}>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, index) => (
                      <tr key={`${e.row}-${index}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--mono)', color: 'var(--ink4)' }}>#{e.row}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{e.name || '—'}</td>
                        <td style={{ padding: '6px 10px', color: 'var(--red)' }}>
                          {e.errors?.length
                            ? e.errors.map((fe, i) => (
                                <div key={i}><strong>{fe.column}</strong>: {fe.message}</div>
                              ))
                            : e.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 8 }}>
                Download the failed rows, fix the flagged cells, and re-upload — only those rows will be re-processed.
              </div>
            </>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}

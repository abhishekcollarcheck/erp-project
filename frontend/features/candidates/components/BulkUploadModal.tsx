'use client';

import React, {
  CSSProperties,
  useMemo,
  useRef,
  useState,
} from 'react';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { Modal } from '../../../components/ui/Modal';
import { useBulkUpload } from '../hooks/useCandidates';
import type { BulkUploadResult } from '../types/candidate.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = ['csv', 'xlsx', 'xls'];

const HEADERS = [
  'first_name',
  'middle_name',
  'last_name',
  'email',
  'phone_number',
  'gender',
  'date_of_birth',
  'current_state_id',
  'current_city_id',
  'ready_to_relocate',
  'perm_address_same_as_present',
  'perm_state_id',
  'perm_city_id',
  'current_company_name',
  'current_company_designation',
  'qualification',
  'course',
  'institute',
  'edu_mode',
  'edu_start_date',
  'edu_end_date',
  'edu_currently_pursuing',
  'fresher',
  'location',
  'total_experience',
  'relevant_experience',
  'employment_1_company',
  'employment_1_designation',
  'employment_1_joining_date',
  'employment_1_leaving_date',
  'employment_1_currently_working',
  'employment_2_company',
  'employment_2_designation',
  'employment_2_joining_date',
  'employment_2_leaving_date',
  'employment_2_currently_working',
  'employment_3_company',
  'employment_3_designation',
  'employment_3_joining_date',
  'employment_3_leaving_date',
  'employment_3_currently_working',
  'apply_department',
  'apply_designation',
  'current_salary',
  'expected_salary',
  'currently_working',
  'notice_period',
  'serving_notice_period',
  'last_working_day',
  'immediate_joiner',
  'expected_joining_date',
  'own_vehicle',
  'vehicle_types',
  'source',
  'is_internal_referral',
  'referred_by_employee_id',
  'reference_source',
  'remarks',
];

// Excel date-format columns, resolved to letters at template build time — see colLetter().
const DATE_FIELDS = [
  'date_of_birth', 'edu_start_date', 'edu_end_date',
  'employment_1_joining_date', 'employment_1_leaving_date',
  'employment_2_joining_date', 'employment_2_leaving_date',
  'employment_3_joining_date', 'employment_3_leaving_date',
  'last_working_day', 'expected_joining_date',
];

const SAMPLE_ROW = [
  'Priya',
  '',
  'Sharma',
  'priya@gmail.com',
  '+919876543210',
  'Female',
  '1995-05-15',
  '',
  '',
  'true',
  'true',
  '',
  '',
  'Infosys',
  'Senior Engineer',
  "Bachelor's",
  'B.E. Computer Science',
  'ABC Engineering College',
  'Regular',
  '2013-06-01',
  '2017-05-31',
  'false',
  'false',
  'Bengaluru',
  5,
  4,
  'Infosys',
  'Senior Engineer',
  '2019-06-01',
  '',
  'true',
  'TCS',
  'Associate Engineer',
  '2017-06-01',
  '2019-05-31',
  'false',
  '',
  '',
  '',
  '',
  '',
  'IT',
  'Sr. Software Engineer',
  75000,
  90000,
  'true',
  30,
  'true',
  '',
  'false',
  '2026-07-01',
  'true',
  'Car,Bike',
  'Naukri',
  'false',
  '',
  '',
  'Strong profile',
];

const VALID_SOURCES = [
  'Naukri',
  'LinkedIn',
  'CollarCheck',
  'Referral',
  'Walk-in',
  'Indeed',
  'Direct',
  'Other',
];

const VALID_GENDERS = [
  'Male',
  'Female',
  'Other',
  'Prefer not to say',
];

const VALID_EDU_MODES = ['Regular', 'Non Regular', 'Not Applicable'];

const BOOLEAN_OPTIONS = ['true', 'false'];

// Converts a 0-based column index to an Excel column letter (0 -> 'A', 26 -> 'AA', …)
const colLetter = (index: number): string => {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

const HEADER_COL: Record<string, string> = Object.fromEntries(
  HEADERS.map((h, i) => [h, colLetter(i)]),
);

const DROPZONE_BASE_STYLE: CSSProperties = {
  borderRadius: 'var(--r2)',
  padding: '32px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all .15s',
  marginBottom: 16,
};

export function BulkUploadModal({
  open,
  onClose,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] =
    useState<BulkUploadResult | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkMutation = useBulkUpload();

  const isUploading = bulkMutation.isPending;

  const formattedFileSize = useMemo(() => {
    if (!file) return '';

    return `${(file.size / 1024).toFixed(1)} KB`;
  }, [file]);

  const resetState = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setDragOver(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (selectedFile: File): string | null => {
    const extension = selectedFile.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !ACCEPTED_EXTENSIONS.includes(extension)
    ) {
      return 'Please upload CSV, XLSX, or XLS file';
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'Maximum file size is 10 MB';
    }

    return null;
  };

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError(null);
    setResult(null);
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    try {
      setError(null);

      const res = await bulkMutation.mutateAsync(file);

      setResult(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Upload failed',
      );
    }
  };

  const applyDropdownValidation = (
    sheet: ExcelJS.Worksheet,
    column: string,
    values: string[],
  ) => {
    for (let row = 2; row <= 500; row++) {
      sheet.getCell(`${column}${row}`).dataValidation =
        {
          type: 'list',
          allowBlank: true,
          formulae: [
            `"${values.join(',')}"`,
          ],
          showErrorMessage: true,
          errorStyle: 'error',
          errorTitle: 'Invalid value',
          error:
            'Please select a value from the dropdown',
        };
    }
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'NexHR';
      workbook.created = new Date();

      const sheet =
        workbook.addWorksheet('Candidates');

      sheet.addRow(HEADERS);
      sheet.addRow(SAMPLE_ROW);

      // Header Row Styling
      const headerRow = sheet.getRow(1);

      headerRow.height = 24;

      headerRow.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
      };

      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' },
      };

      headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      // Column Widths
      HEADERS.forEach((header, index) => {
        sheet.getColumn(index + 1).width =
          Math.max(header.length + 6, 22);
      });

      // Date Formats
      DATE_FIELDS.forEach(field => {
        const col = HEADERS.indexOf(field) + 1;
        if (col > 0) sheet.getColumn(col).numFmt = 'yyyy-mm-dd';
      });

      // Freeze Header
      sheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];

      // Filters
      sheet.autoFilter = {
        from: 'A1',
        to: `${colLetter(HEADERS.length - 1)}${sheet.rowCount}`,
      };

      // Dropdowns
      applyDropdownValidation(sheet, HEADER_COL['gender'], VALID_GENDERS);
      applyDropdownValidation(sheet, HEADER_COL['edu_mode'], VALID_EDU_MODES);
      applyDropdownValidation(sheet, HEADER_COL['source'], VALID_SOURCES);

      [
        'ready_to_relocate', 'perm_address_same_as_present',
        'edu_currently_pursuing', 'fresher',
        'employment_1_currently_working', 'employment_2_currently_working', 'employment_3_currently_working',
        'currently_working', 'serving_notice_period', 'immediate_joiner', 'own_vehicle',
        'is_internal_referral',
      ].forEach(field => applyDropdownValidation(sheet, HEADER_COL[field], BOOLEAN_OPTIONS));

      // Alternate Row Styling
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.eachCell(cell => {
          cell.border = {
            top: {
              style: 'thin',
              color: { argb: 'E5E7EB' },
            },
            left: {
              style: 'thin',
              color: { argb: 'E5E7EB' },
            },
            bottom: {
              style: 'thin',
              color: { argb: 'E5E7EB' },
            },
            right: {
              style: 'thin',
              color: { argb: 'E5E7EB' },
            },
          };
        });
      });

      const buffer =
        await workbook.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer]),
        'nexhr_candidates_template.xlsx',
      );
    } catch (err) {
      console.error(err);

      setError(
        'Failed to generate template file',
      );
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errors?.length) return;

    const csvRows = [
      'Row,Candidate Name,Error Reason',
      ...result.errors.map(
        error =>
          `${error.row},"${error.name}","${error.reason}"`,
      ),
    ];

    const blob = new Blob(
      [csvRows.join('\n')],
      {
        type: 'text/csv;charset=utf-8;',
      },
    );

    const url =
      window.URL.createObjectURL(blob);

    const anchor =
      document.createElement('a');

    anchor.href = url;
    anchor.download =
      'bulk_upload_errors.csv';

    anchor.click();

    window.URL.revokeObjectURL(url);
  };

  const dropzoneStyle: CSSProperties = {
    ...DROPZONE_BASE_STYLE,
    border: `2px dashed ${
      dragOver
        ? 'var(--blue)'
        : file
          ? 'var(--green)'
          : 'var(--border2)'
    }`,
    background: dragOver
      ? 'var(--blue-lt)'
      : file
        ? 'var(--green-lt)'
        : 'var(--surface2)',
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Upload Candidates"
      subtitle="Import multiple candidates using CSV or Excel files"
      width={600}
      footer={
        result ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              width: '100%',
            }}
          >
            {result.errors.length > 0 && (
              <button
                className="btn btn-sec btn-sm"
                onClick={
                  downloadErrorReport
                }
              >
                ↓ Download Error Report
              </button>
            )}

            <button
              className="btn btn-pri"
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <button
              className="btn btn-sec"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              className="btn btn-pri"
              onClick={handleUpload}
              disabled={
                !file || isUploading
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isUploading && (
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border:
                      '2px solid rgba(255,255,255,.4)',
                    borderTopColor:
                      '#fff',
                    borderRadius: '50%',
                    display:
                      'inline-block',
                    animation:
                      'spin .7s linear infinite',
                  }}
                />
              )}

              {isUploading
                ? 'Uploading...'
                : '↑ Upload File'}
            </button>
          </>
        )
      }
    >
      {!result ? (
        <>
          {/* Template Download */}
          <div
            style={{
              background:
                'var(--blue-lt)',
              border:
                '1px solid var(--blue-md)',
              borderRadius:
                'var(--r)',
              padding: '12px 14px',
              marginBottom: 16,
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color:
                    'var(--blue)',
                  marginBottom: 2,
                }}
              >
                Download template
              </div>

              <div
                style={{
                  fontSize: 11,
                  color:
                    'var(--ink4)',
                }}
              >
                {HEADERS.length} columns with
                dropdowns, filters,
                and sample data. Employment history
                supports up to 3 rows per candidate
                (employment_1_…, employment_2_…, employment_3_…).
              </div>
            </div>

            <button
              className="btn btn-sec btn-sm"
              onClick={
                downloadTemplate
              }
            >
              ↓ Template
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background:
                  'var(--red-lt)',
                border:
                  '1px solid var(--red-bd)',
                borderRadius:
                  'var(--r)',
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 12,
                color: 'var(--red)',
              }}
            >
              {error}
            </div>
          )}

          {/* Rules */}
          <div
            style={{
              background:
                'var(--amber-lt)',
              border:
                '1px solid var(--amber-bd)',
              borderRadius:
                'var(--r)',
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 11,
              color:
                'var(--amber)',
              lineHeight: 1.7,
            }}
          >
            <strong>
              Validation rules:
            </strong>

            <br />

            • first_name and last_name are required
            (or a single candidate_name with a space)

            <br />

            • email and phone_number must be
            unique per company

            <br />

            • Dates use YYYY-MM-DD · booleans use
            true / false

            <br />

            • vehicle_types: comma-separated —
            Car, Bike, Scooty

            <br />

            • referred_by_employee_id: numeric
            employee ID (only when is_internal_referral = true)

            <br />

            • expected_joining_date must be
            future or today

            <br />

            • CSV / XLSX / XLS · max 10 MB · up to 5,000 rows
          </div>

          {/* Dropzone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() =>
              setDragOver(false)
            }
            onDrop={e => {
              e.preventDefault();

              setDragOver(false);

              handleFile(
                e.dataTransfer
                  .files?.[0] ??
                  null,
              );
            }}
            onClick={() =>
              fileRef.current?.click()
            }
            style={dropzoneStyle}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{
                display: 'none',
              }}
              onChange={e =>
                handleFile(
                  e.target.files?.[0] ??
                    null,
                )
              }
            />

            <div
              style={{
                fontSize: 32,
                marginBottom: 10,
              }}
            >
              {file ? '✅' : '📄'}
            </div>

            {file ? (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color:
                      'var(--green)',
                    marginBottom: 4,
                  }}
                >
                  {file.name}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color:
                      'var(--ink4)',
                  }}
                >
                  {formattedFileSize} ·
                  Click to replace
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      'var(--ink)',
                    marginBottom: 4,
                  }}
                >
                  Drop CSV or Excel
                  file here
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color:
                      'var(--ink4)',
                  }}
                >
                  CSV / XLSX / XLS ·
                  Max 10 MB
                </div>
              </>
            )}
          </div>

          {/* Headers */}
          <details>
            <summary
              style={{
                fontSize: 11,
                color:
                  'var(--blue)',
                fontWeight: 600,
                userSelect: 'none',
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              View expected column
              headers ↓
            </summary>

            <div
              style={{
                background:
                  'var(--surface2)',
                borderRadius:
                  'var(--r)',
                padding: '10px 12px',
                fontSize: 10,
                fontFamily:
                  'var(--mono)',
                color:
                  'var(--ink3)',
                lineHeight: 1.9,
                wordBreak:
                  'break-all',
              }}
            >
              {HEADERS.map(header => (
                <span
                  key={header}
                  style={{
                    background:
                      'var(--border)',
                    borderRadius: 3,
                    padding:
                      '1px 5px',
                    marginRight: 4,
                    marginBottom: 3,
                    display:
                      'inline-block',
                  }}
                >
                  {header}
                </span>
              ))}
            </div>
          </details>
        </>
      ) : (
        <>
          {/* Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr 1fr',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              {
                label: 'Total rows',
                value: result.total,
                color:
                  'var(--blue)',
              },
              {
                label: 'Imported',
                value:
                  result.success,
                color:
                  'var(--green)',
              },
              {
                label: 'Failed',
                value:
                  result.failed,
                color:
                  result.failed > 0
                    ? 'var(--red)'
                    : 'var(--ink4)',
              },
            ].map(item => (
              <div
                key={item.label}
                style={{
                  textAlign:
                    'center',
                  background:
                    'var(--surface2)',
                  borderRadius:
                    'var(--r)',
                  padding:
                    '12px 8px',
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily:
                      'var(--mono)',
                    color:
                      item.color,
                    marginBottom: 4,
                  }}
                >
                  {item.value}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color:
                      'var(--ink4)',
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {result.success > 0 && (
            <div
              style={{
                background:
                  'var(--green-lt)',
                border:
                  '1px solid var(--green-bd)',
                borderRadius:
                  'var(--r)',
                padding: '10px 14px',
                fontSize: 12,
                color:
                  'var(--green)',
                marginBottom: 12,
              }}
            >
              ✓ {result.success}{' '}
              candidate
              {result.success !== 1
                ? 's'
                : ''}{' '}
              imported successfully
            </div>
          )}

          {result.errors.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      'var(--red)',
                  }}
                >
                  Failed rows (
                  {
                    result.errors
                      .length
                  }
                  )
                </div>

                <button
                  className="btn btn-sec btn-sm"
                  onClick={
                    downloadErrorReport
                  }
                >
                  ↓ Download CSV
                </button>
              </div>

              <div
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                  border:
                    '1px solid var(--border)',
                  borderRadius:
                    'var(--r)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                    fontSize: 11,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          'var(--surface2)',
                      }}
                    >
                      <th
                        style={{
                          padding:
                            '6px 10px',
                          textAlign:
                            'left',
                          fontWeight: 700,
                          borderBottom:
                            '1px solid var(--border)',
                          width: 60,
                        }}
                      >
                        Row
                      </th>

                      <th
                        style={{
                          padding:
                            '6px 10px',
                          textAlign:
                            'left',
                          fontWeight: 700,
                          borderBottom:
                            '1px solid var(--border)',
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          padding:
                            '6px 10px',
                          textAlign:
                            'left',
                          fontWeight: 700,
                          borderBottom:
                            '1px solid var(--border)',
                          color:
                            'var(--red)',
                        }}
                      >
                        Error
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.errors.map(
                      (
                        error,
                        index,
                      ) => (
                        <tr
                          key={`${error.row}-${index}`}
                          style={{
                            borderBottom:
                              '1px solid var(--border)',
                          }}
                        >
                          <td
                            style={{
                              padding:
                                '6px 10px',
                              fontFamily:
                                'var(--mono)',
                              color:
                                'var(--ink4)',
                            }}
                          >
                            #
                            {
                              error.row
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                '6px 10px',
                              fontWeight: 600,
                            }}
                          >
                            {
                              error.name
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                '6px 10px',
                              color:
                                'var(--red)',
                            }}
                          >
                            {
                              error.reason
                            }
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Modal>
  );
}
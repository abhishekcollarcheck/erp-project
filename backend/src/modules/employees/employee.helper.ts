/**
 * employees.helper.ts
 * Business calculations sourced directly from spreadsheet formulas.
 * Salary calculator (rows 3-10), duration computations (rows 43-45),
 * RD maturity (rows 85-87), asset deduction last installment (rows 213-215).
 */

import { AMDB_PERCENTAGE, HR_STEP_WEIGHTS, CANDIDATE_STEP_WEIGHTS, WIZARD_STEPS } from './employee.constants';
import type { StepKey } from './employee.constants';
import { Employee } from '../../database/models/Employee';
import { Company } from '../../database/models/Company';

// ─── Salary computations (spreadsheet salary calculator) ─────────────────────

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  allowance1: number;
  gross_salary_pm: number;
  amdb_pm: number;
  total_earning_pm: number;
}

const COMPANY_RANGES = {
  1: { start: 1, end: 99 },
  2: { start: 100, end: 999 },
  3: { start: 2000, end: 2999 },
  4: { start: 3000, end: 3999 },
} as const;

/**
 * Computes gross and total as spreadsheet does:
 *   Gross = Basic + HRA + Allowance1
 *   AMDB  = Gross * AMDB_PERCENTAGE (0.30)   — if amdb not provided
 *   Total = Gross + AMDB
 */
export function computeSalary(
  basic: number,
  hra: number,
  allowance1: number,
  amdb?: number,
): SalaryBreakdown {
  const b = Number(basic) || 0;
  const h = Number(hra) || 0;
  const a = Number(allowance1) || 0;
  const gross = b + h + a;
  const amdb_pm = amdb !== undefined ? Number(amdb) : Math.round(gross * AMDB_PERCENTAGE);
  return {
    basic: b,
    hra: h,
    allowance1: a,
    gross_salary_pm: gross,
    amdb_pm,
    total_earning_pm: gross + amdb_pm,
  };
}

// ─── Duration computation (spreadsheet rows 43-45) ───────────────────────────

export function computeWorkingDuration(doj: Date | string): string {
  const start = new Date(doj);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const totalDays = Math.floor(diffMs / 86400000);
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Mo${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' ') : '0 Days';
}

// ─── Commitment end date ──────────────────────────────────────────────────────

export function computeCommitmentEndDate(enteredOn: string, termStr: string): Date | null {
  if (!enteredOn || termStr === 'N/A') return null;
  const months = parseInt(termStr); // '36 Months' → 36
  if (isNaN(months)) return null;
  const d = new Date(enteredOn);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Probation end date ───────────────────────────────────────────────────────

export function computeProbationEndDate(doj: string, periodStr: string): Date | null {
  if (!doj || !periodStr) return null;
  const months = parseInt(periodStr);
  if (isNaN(months)) return null;
  const d = new Date(doj);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── RD maturity (rows 85-87) ─────────────────────────────────────────────────

export function computeRdMaturity(
  openingDate: string,
  termStr: string,
  monthlyEmp: number,
  monthlyEmpContrib: number,
): { maturityDate: Date | null; maturityAmount: number } {
  if (!openingDate || termStr === 'N/A') return { maturityDate: null, maturityAmount: 0 };
  const months = parseInt(termStr);
  if (isNaN(months)) return { maturityDate: null, maturityAmount: 0 };

  const d = new Date(openingDate);
  d.setMonth(d.getMonth() + months);

  const totalMonthly = (Number(monthlyEmp) || 0) + (Number(monthlyEmpContrib) || 0);
  const maturityAmount = totalMonthly * months; // simple accumulation (no interest in sheet)
  return { maturityDate: d, maturityAmount };
}

// ─── Asset deduction calculations (rows 213-215) ──────────────────────────────

export function computeAssetDeduction(
  securityAmount: number,
  deductionMonthsStr: string,
  monthlyDeduction?: number,
): { monthlyDeduction: number; lastInstallment: number } {
  if (!securityAmount || deductionMonthsStr === 'N/A') {
    return { monthlyDeduction: 0, lastInstallment: 0 };
  }
  const months = parseInt(deductionMonthsStr);
  if (isNaN(months) || months <= 0) return { monthlyDeduction: 0, lastInstallment: 0 };

  const md = monthlyDeduction ?? Math.floor(securityAmount / months);
  const totalWithoutLast = md * (months - 1);
  const last = securityAmount - totalWithoutLast;
  return { monthlyDeduction: md, lastInstallment: last };
}

// ─── ESIC / PF contribution computations ─────────────────────────────────────

export function computePfContributions(basicSalary: number, pctOfBasic: number) {
  const empContrib = Math.round(basicSalary * (pctOfBasic / 100));
  const employerContrib1 = empContrib; // typically matched
  const employerContrib2 = 0;         // EPS / admin charges (simplified)
  return { empContrib, employerContrib1, employerContrib2 };
}

export function computeEsicContributions(grossSalary: number) {
  const ESIC_THRESHOLD = 21000;
  if (grossSalary > ESIC_THRESHOLD) {
    return { empContrib: 0, employerContrib: 0 };
  }
  const empContrib = Math.round(grossSalary * 0.0075);
  const employerContrib = Math.round(grossSalary * 0.0325);
  return { empContrib, employerContrib };
}

// ─── Employee code generation ─────────────────────────────────────────────────

// export async function generateEmployeeCode(): Promise<string> {
//   const last = await Employee.findOne({
//     order: [['id', 'DESC']],
//     attributes: ['employee_code'],
//   });
//   if (!last) return 'EMP-0001';
//   const match = last.employee_code.match(/(\d+)$/);
//   const num = match ? parseInt(match[1], 10) + 1 : 1;
//   return `EMP-${String(num).padStart(4, '0')}`;
// }

export async function generateEmployeeCode(
  companyId: number
): Promise<string> {

  const company = await Company.findByPk(companyId, {
    attributes: [
      'employee_code_start',
      'employee_code_end',
      'employee_code_skip',
    ],
  });

  if (!company) {
    throw new Error(`Company not found (${companyId})`);
  }

  // NOTE: Number(null) === 0 (not NaN), so checking Number.isNaN() AFTER
  // coercion never catches a genuinely-unconfigured range — it would let
  // startCode/endCode both silently become 0 and hand out employee_code
  // '0' to the very first employee onboarded for this company. Check for
  // null/undefined on the raw DB values first.
  if (
    company.employee_code_start === null || company.employee_code_start === undefined ||
    company.employee_code_end === null || company.employee_code_end === undefined
  ) {
    throw new Error(
      `Employee code range not configured for company ${companyId}`
    );
  }

  const startCode = Number(company.employee_code_start);
  const endCode = Number(company.employee_code_end);

  if (
    Number.isNaN(startCode) ||
    Number.isNaN(endCode)
  ) {
    throw new Error(
      `Employee code range not configured for company ${companyId}`
    );
  }

  let skipCodes: number[] = [];

  try {
    skipCodes = company.employee_code_skip
      ? JSON.parse(company.employee_code_skip)
      : [];
  } catch {
    skipCodes = [];
  }

  const employees = await Employee.findAll({
    attributes: ['employee_code'],
    raw: true,
  });

  const blockedCodes = new Set<number>(skipCodes);

  for (const emp of employees) {
    const code = Number(emp.employee_code);

    if (!Number.isNaN(code)) {
      blockedCodes.add(code);
    }
  }

  for (let code = startCode; code <= endCode; code++) {
    if (!blockedCodes.has(code)) {
      return String(code);
    }
  }

  throw new Error(
    `Employee code range exhausted (${startCode}-${endCode})`
  );
}


// ─── Form completion percentage ───────────────────────────────────────────────

export interface CompletionBreakdown {
  hrPct:        number;  // 0-100, HR's 7 steps
  candidatePct: number;  // 0-100, Candidate's 5 steps
  overallPct:   number;  // 0-100, combined — this is what gets stored in form_completion_pct
  hrDone:       number;  // count of HR steps complete, e.g. for "HR 4/7"
  hrTotal:      number;
  candidateDone: number;
  candidateTotal: number;
  /** Per wizard-step completion (the 12 data steps). The wizard's Edit-mode
   *  progress reads this so it shows the exact same number as the list. */
  steps:        Record<string, boolean>;
}

export function computeCompletionPct(employee: any): CompletionBreakdown {
  // A step counts as complete when its REQUIRED fields (the ones the UI marks
  // with a *) are filled. Steps that carry no required field only need to have
  // been saved once — an empty save creates the child row, so `<assoc> != null`
  // is the "was this step visited" signal. Optional field VALUES never gate
  // completion (and therefore never gate employee_code generation).
  //
  // Called with the raw model JSON (child rows nested under their association
  // name); `loc` also tolerates the flattened shape as a fallback.
  const loc = employee.locationAttendance ?? employee;
  const salaries = employee.salaries ?? [];
  const addresses = employee.addresses ?? [];
  const bankDetails = employee.bankDetails ?? [];

  const checks: Record<string, () => boolean> = {
    // ── HR part ──────────────────────────────────────────────────────────────
    // required: first/last name, employment type, department, designation, email, phone
    role_identity:         () => !!(employee.first_name && employee.last_name && employee.employment_type
                                    && employee.department_id && employee.designation_id
                                    && employee.email && employee.phone),
    // required: Date of Joining only
    location_attendance:   () => !!(loc.actual_doj),
    // no required fields — complete once saved
    managers_work_contact: () => employee.managersWorkContact != null
                                  || employee.l1_manager_id != null || employee.official_email != null,
    commitment_probation:  () => employee.commitmentProbation != null,
    statutory_schemes:     () => employee.schemes != null,
    compensation:          () => salaries.some((s: any) => s.salary_type === 'current'),
    hr_joining_checklist:  () => employee.onboardingDocs != null,
    // ── Candidate part ───────────────────────────────────────────────────────
    // no required fields — complete once saved
    personal_profile:      () => employee.personal != null,
    address:               () => addresses.some((a: any) => a.address_type === 'present'),
    family_emergency:      () => employee.family != null,
    // required: Aadhaar (number/name/dob/address) + personal bank (name/account/ifsc)
    ids_bank:              () => !!(employee.statutory?.aadhaar_number && employee.statutory?.aadhaar_name
                                    && employee.statutory?.aadhaar_dob && employee.statutory?.aadhaar_address
                                    && bankDetails.some((b: any) => b.bank_type === 'personal'
                                       && b.bank_name && b.account_number && b.ifsc_code)),
    // no required fields — complete once saved (setExperienceFlag always runs)
    experience_education:  () => employee.experienceFlag != null,
  };

  const hrKeys        = Object.keys(HR_STEP_WEIGHTS);
  const candidateKeys  = Object.keys(CANDIDATE_STEP_WEIGHTS);

  // Evaluate every step once — reused for scoring AND the per-step map.
  const steps: Record<string, boolean> = {};
  for (const key of Object.keys(checks)) steps[key] = !!checks[key]();

  let hrScore = 0, hrDone = 0;
  for (const key of hrKeys) {
    if (steps[key]) { hrScore += HR_STEP_WEIGHTS[key]; hrDone++; }
  }

  let candidateScore = 0, candidateDone = 0;
  for (const key of candidateKeys) {
    if (steps[key]) { candidateScore += CANDIDATE_STEP_WEIGHTS[key]; candidateDone++; }
  }

  const hrPct        = Math.min(100, Math.round(hrScore));
  const candidatePct = Math.min(100, Math.round(candidateScore));
  // Overall = average of the two parts (both must reach 100 for overall to reach 100,
  // which is what gates employee_code generation per the confirmed "all 12 steps" rule)
  const overallPct   = Math.round((hrPct + candidatePct) / 2);

  return {
    hrPct, candidatePct, overallPct,
    hrDone, hrTotal: hrKeys.length,
    candidateDone, candidateTotal: candidateKeys.length,
    steps,
  };
}

// ─── Date format conversion: DD-MM-YYYY → YYYY-MM-DD ─────────────────────────
// Spreadsheet uses DD-MM-YYYY (cell B43 has custom date validation for this)

export function parseDdMmYyyy(val: string): Date | null {
  if (!val) return null;
  // Handle both DD-MM-YYYY and YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val);
  const parts = val.split(/[-\/]/);
  if (parts.length === 3 && parts[0].length === 2) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(val);
}
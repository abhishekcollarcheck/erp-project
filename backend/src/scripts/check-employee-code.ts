/**
 * check-employee-code.ts
 * Diagnostic for the auto-generated employee_code.
 *
 * The code is generated on a step/draft save the moment BOTH the HR part and
 * the Candidate part of the wizard reach 100% completion (see
 * computeCompletionPct + generateEmployeeCode in employee.helper.ts).
 *
 * This script shows, for a given employee, which of the 12 completion gates
 * still fail and whether the company's code range is configured — the two
 * reasons a code fails to appear.
 *
 * Run:  npx ts-node -r tsconfig-paths/register src/scripts/check-employee-code.ts <employeeId> [companyId]
 *       (add --generate to actually mint the code if the employee is at 100%)
 */

import { sequelize } from '../config/database';
import { Company } from '../database/models/Company';
import { employeeRepository as repo } from '../modules/employees/employee.repo';
import { computeCompletionPct, generateEmployeeCode } from '../modules/employees/employee.helper';
import { HR_STEP_WEIGHTS, CANDIDATE_STEP_WEIGHTS } from '../modules/employees/employee.constants';

// Same predicates as computeCompletionPct — duplicated only to print per-gate
// pass/fail. Steps with no required field are complete once saved (row exists).
const CHECKS: Record<string, (e: any) => boolean> = {
  role_identity:         e => !!(e.first_name && e.last_name && e.employment_type && e.department_id && e.designation_id && e.email && e.phone),
  location_attendance:   e => !!(e.locationAttendance?.actual_doj),
  managers_work_contact: e => e.managersWorkContact != null,
  commitment_probation:  e => e.commitmentProbation != null,
  statutory_schemes:     e => e.schemes != null,
  compensation:          e => !!(e.salaries ?? []).find((s: any) => s.salary_type === 'current'),
  hr_joining_checklist:  e => e.onboardingDocs != null,
  personal_profile:      e => e.personal != null,
  address:               e => !!(e.addresses ?? []).find((a: any) => a.address_type === 'present'),
  family_emergency:      e => e.family != null,
  ids_bank:              e => !!(e.statutory?.aadhaar_number && e.statutory?.aadhaar_name && e.statutory?.aadhaar_dob && e.statutory?.aadhaar_address && (e.bankDetails ?? []).find((b: any) => b.bank_type === 'personal' && b.bank_name && b.account_number && b.ifsc_code)),
  experience_education:  e => e.experienceFlag != null,
};

async function main() {
  const [idArg, companyArg] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const doGenerate = process.argv.includes('--generate');
  const employeeId = Number(idArg);
  if (!employeeId) {
    console.error('Usage: ts-node src/scripts/check-employee-code.ts <employeeId> [companyId] [--generate]');
    process.exit(1);
  }

  const emp = await repo.findById(employeeId, companyArg ? Number(companyArg) : undefined as any, true);
  if (!emp) { console.error(`Employee ${employeeId} not found`); process.exit(1); }

  const json = emp.toJSON() as any;
  const companyId = json.company_id;

  console.log(`\nEmployee #${employeeId}  "${json.first_name} ${json.last_name}"  company=${companyId}`);
  console.log(`current employee_code: ${json.employee_code ?? '(none)'}   record_status: ${json.record_status}\n`);

  const hrKeys = Object.keys(HR_STEP_WEIGHTS);
  const candKeys = Object.keys(CANDIDATE_STEP_WEIGHTS);
  const row = (k: string) => console.log(`  ${CHECKS[k](json) ? '✅' : '❌'}  ${k}`);
  console.log('HR part:');        hrKeys.forEach(row);
  console.log('Candidate part:'); candKeys.forEach(row);

  const b = computeCompletionPct(json);
  console.log(`\nHR ${b.hrPct}%   Candidate ${b.candidatePct}%   Overall ${b.overallPct}%`);

  // Company code range
  const company = await Company.findByPk(companyId, {
    attributes: ['employee_code_start', 'employee_code_end', 'employee_code_skip'],
  });
  console.log(`\nCompany code range: start=${company?.employee_code_start ?? 'NULL'} end=${company?.employee_code_end ?? 'NULL'} skip=${company?.employee_code_skip || '[]'}`);
  if (company?.employee_code_start == null || company?.employee_code_end == null) {
    console.log('⚠️  Range not configured — generation will throw "Employee code range not configured".');
  }

  const wouldGenerate = b.overallPct === 100 && !json.employee_code;
  console.log(`\n=> code would ${wouldGenerate ? '' : 'NOT '}be generated on the next step save.`);

  if (doGenerate && wouldGenerate) {
    const code = await generateEmployeeCode(companyId);
    console.log(`\n--generate: next free code is "${code}" (not written — call the step endpoint to persist).`);
  }

  await sequelize.close();
}

main().catch(err => { console.error(err); process.exit(1); });

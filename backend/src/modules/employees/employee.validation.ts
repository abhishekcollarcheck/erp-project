/**
 * employees.validation.ts
 * express-validator chains for every wizard step.
 * Required/optional matches the actual UI exactly: only fields carrying
 * a visible `*` in the HTML are required.
 */

import { body, query, param, ValidationChain } from 'express-validator';
import {
  EMPLOYEE_STATUS, EMPLOYMENT_TYPE, COMMITMENT_TERM, PROBATION_STATUS,
  PF_EMPLOYER_FROM, MEDICLAIM_STATUS, RD_TERM, HOUSE_TYPE, PERM_ADDRESS_TYPE,
  FATHER_SALUTATION, MOTHER_SALUTATION, SALARY_MODE, DEDUCTION_FROM,
  DEDUCTION_MONTHS, GENDER, BLOOD_GROUP, MARITAL_STATUS, YES_NO, SHIFT_CATEGORY,
} from './employee.constants';

const opt = (c: ValidationChain) => c.optional({ nullable: true, checkFalsy: false });
// like opt() but also skips empty strings — for format checks (regex/email/date)
// on repeatable-row fields the UI may submit blank
const optCF = (c: ValidationChain) => c.optional({ nullable: true, checkFalsy: true });
const optDate = (field: string) => opt(body(field).isISO8601().withMessage(`${field}: invalid date`));

// ─── List query params ────────────────────────────────────────────────────────
export const listValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(EMPLOYEE_STATUS),
  query('employment_type').optional().isIn(EMPLOYMENT_TYPE),
  query('sort').optional().isIn(['created_at', 'first_name', 'last_name', 'employee_code', 'actual_doj']),
  query('order').optional().isIn(['ASC', 'DESC']),
];

export const idValidation: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('Invalid employee ID'),
];

// ─── Inter-company transfer ──────────────────────────────────────────────────
export const transferValidation: ValidationChain[] = [
  body('new_employee_code').trim().notEmpty().withMessage('New employee code is required').isLength({ max: 30 }),
  body('new_company_id').toInt().isInt({ min: 1 }).withMessage('Destination company is required'),
  body('transfer_date')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Transfer date must be in YYYY-MM-DD format')
    .isISO8601({ strict: true }).withMessage('Invalid transfer date'),
  opt(body('new_department_id').toInt().isInt({ min: 1 })),
  opt(body('new_sub_department_id').toInt().isInt({ min: 1 })),
  opt(body('new_designation_id').toInt().isInt({ min: 1 })),
  opt(body('new_working_site').toInt().isInt({ min: 1 })),
];

// ─── Step 1 (HR): Role & Identity ─────────────────────────────────────────────
// employee_code removed entirely — it's never client-supplied, generated
// automatically once HR + Candidate parts both reach 100% completion.
export const roleIdentityValidation: ValidationChain[] = [
  body('company_id').isInt({ min: 1 }).withMessage('Company is required'),
  body('first_name').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
  opt(body('middle_name').trim().isLength({ max: 100 })),
  body('last_name').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
  body('status').isIn(EMPLOYEE_STATUS).withMessage('Invalid status'),
  body('employment_type').isIn(EMPLOYMENT_TYPE).withMessage('Invalid employment type'),
  body('department_id').isInt({ min: 1 }).withMessage('Department is required'),
  opt(body('sub_department_id').isInt({ min: 1 }).withMessage('Sub-department is required')),
  body('designation_id').isInt({ min: 1 }).withMessage('Designation is required'),
  opt(body('sub_designation_id').isInt({ min: 1 }).withMessage('Sub-designation is required')),
  body('email').isEmail().withMessage('Invalid email format').isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
  body('phone')
  .trim()
  .notEmpty()
  .withMessage('Personal mobile number is required')
  .matches(/^[+\d\s\-()]{7,20}$/)
  .withMessage('Invalid phone number'),
];

// ─── Step 2 (HR): Location & Attendance ───────────────────────────────────────
export const locationAttendanceValidation: ValidationChain[] = [
  opt(body('working_state_country').isInt({ min: 1 })),
  opt(body('working_city').isInt({ min: 1 })),
  opt(body('working_site').isInt({ min: 1 })),
  opt(body('pay_register_location').isInt({ min: 1 })),
  body('actual_doj').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date of Joining must be in YYYY-MM-DD format').isISO8601({ strict: true }).withMessage('Invalid Date of Joining'),
  opt(body('weekly_off').isInt({ min: 1 })),
  opt(body('shift_category').isIn(SHIFT_CATEGORY)),
  opt(body('shift_id').isInt({ min: 1 })),
  opt(body('grace_minutes').isInt({ min: 1 })),
];

// ─── Step 3 (HR): Managers & Work Contact ─────────────────────────────────────
export const managersWorkContactValidation: ValidationChain[] = [
  opt(body('l1_manager_id').isInt({ min: 1 })),
  opt(body('l2_manager_id').isInt({ min: 1 })),
  opt(body('official_email').isEmail()),
  opt(body('official_mobile').matches(/^[+\d\s\-()]{7,20}$/)),
];

// ─── Step 4 (HR): Commitment & Probation ──────────────────────────────────────
export const commitmentProbationValidation: ValidationChain[] = [
  opt(body('commitment').isBoolean().withMessage('Invalid commitment value')),

  opt(body('commitment_term').isIn(COMMITMENT_TERM).withMessage('Invalid commitment term')),

  opt(body('commitment_entered_on')),

  opt(body('commitment_end_date')),

  opt(body('on_probation').isBoolean().withMessage('Invalid probation value')),

  opt(body('probation_period')
    .trim()
    .isLength({ max: 30 })
    .withMessage('Probation period cannot exceed 30 characters')),

  opt(body('probation_end_date')),

  opt(body('probation_status').isIn(PROBATION_STATUS).withMessage('Invalid probation status')),
];

// ─── Step 5 (HR): Statutory Schemes ────────────────────────────────────────────
export const statutorySchemesValidation: ValidationChain[] = [
  opt(body('pf_status').isBoolean()),
  opt(body('uan_number').trim().matches(/^\d{12}$/).withMessage('UAN must be 12 digits')),
  opt(body('epfo_member_id').trim().isLength({ max: 30 })),
  opt(body('pf_contribution_pct').isFloat({ min: 0, max: 100 })),
  opt(body('pf_employer_from').trim().isLength({ max: 100 })),
  opt(body('pf_employee_12').isFloat({ min: 0 })),
  opt(body('eps_employer_833').isFloat({ min: 0 })),
  opt(body('epf_eps_diff_367').isFloat({ min: 0 })),
  opt(body('esic_status').isBoolean()),
  opt(body('esic_number').trim().isLength({ max: 30 })),
  opt(body('esi_employee_pct').isFloat({ min: 0, max: 100 })),
  opt(body('esi_employer_pct').isFloat({ min: 0, max: 100 })),
  opt(body('mediclaim_status').isIn(MEDICLAIM_STATUS)),
  opt(body('mediclaim_number').trim().isLength({ max: 50 })),
  opt(body('mediclaim_amount').isIn(['150000', '250000', '400000', '500000', 'Not Applicable'])),
  opt(body('rd_scheme').isBoolean()),
  opt(body('rd_term').isIn(RD_TERM)),
  optDate('rd_opening_date'),
  opt(body('rd_account_number').trim().isLength({ max: 50 })),
  opt(body('rd_deduction_from').isIn(DEDUCTION_FROM)),
  opt(body('rd_amount_employee').isFloat({ min: 0 })),
  opt(body('rd_amount_employer').isFloat({ min: 0 })),
  opt(body('ttl_m_contribution').isFloat({ min: 0 })),
  optDate('rd_maturity_date'),
  opt(body('rd_maturity_amount').isFloat({ min: 0 })),
  opt(body('rd_status').isIn(['Yes', 'No', 'Not Applicable'])),
];

// ─── Step 6 (HR): Compensation ────────────────────────────────────────────────
// Nothing carries a * in the UI. deduction_months is now a plain number (was
// a "12 Months"-style dropdown label); deduction_from is now a date — "the
// date deductions start from" — not a Salary/AMDB choice like it used to.
export const compensationValidation: ValidationChain[] = [
  opt(body('salary_mode').isIn(SALARY_MODE)),
  opt(body('current_basic').isFloat({ min: 0 })),
  opt(body('current_hra').isFloat({ min: 0 })),
  opt(body('current_allowance1').isFloat({ min: 0 })),
  opt(body('current_amdb').isFloat({ min: 0 })),
  opt(body('joining_basic').isFloat({ min: 0 })),
  opt(body('joining_hra').isFloat({ min: 0 })),
  opt(body('joining_allowance1').isFloat({ min: 0 })),
  opt(body('joining_amdb').isFloat({ min: 0 })),
  opt(body('asset_deduction_applicable').isBoolean()),
  opt(body('security_amount').isFloat({ min: 0 })),
  opt(body('deduction_months').isInt({ min: 0 })),
  optDate('deduction_from'),
  opt(body('monthly_deduction').isFloat({ min: 0 })),
  opt(body('final_monthly_deduction').isFloat({ min: 0 })),
];

// ─── Step 7 (HR): HR Joining Checklist ────────────────────────────────────────
// Nothing carries a * in the UI. remarks is new.
export const hrJoiningChecklistValidation: ValidationChain[] = [
  opt(body('offer_letter').isBoolean()),
  opt(body('address_verification').isBoolean()),
  opt(body('service_agreement').isBoolean()),
  opt(body('indemnity_bond').isBoolean()),
  opt(body('asset_deduction_letter').isBoolean()),
  opt(body('account_opening_letter').isBoolean()),
  opt(body('nda').isBoolean()),
  opt(body('remarks').trim().isLength({ max: 2000 })),
];

// ─── Step 8 (Candidate): Personal Profile ─────────────────────────────────────
// Nothing carries a * in the UI. personal_email/personal_mobile removed —
// those are now employees.email/phone, validated on Role & Identity instead.
// marital_status/marriage_date/spouse/children moved to Family & Emergency
// (Step 10) — they're all shown on that screen in the UI.
export const personalProfileValidation: ValidationChain[] = [
  optDate('date_of_birth'),
  opt(body('gender').isIn(GENDER)),
  opt(body('shirt_size').trim().isLength({ max: 20 })),
  opt(body('tshirt_size').trim().isLength({ max: 20 })),
  opt(body('nationality').trim().isLength({ max: 100 })),
  opt(body('religion').trim().isLength({ max: 100 })),
  opt(body('blood_group').isIn(BLOOD_GROUP)),
];

// ─── Step 9 (Candidate): Address ──────────────────────────────────────────────
// Nothing carries a * in the UI.
export const addressValidation: ValidationChain[] = [
  // Present Address
  opt(
    body('present_house_type')
      .isIn(HOUSE_TYPE)
      .withMessage('Invalid present house type')
  ),

  opt(
    body('present_house_no')
      .trim()
      .isLength({ max: 50 })
      .withMessage('Present house number cannot exceed 50 characters')
  ),

  opt(
    body('present_area')
      .trim()
      .isLength({ max: 300 })
      .withMessage('Present area cannot exceed 300 characters')
  ),

  opt(
    body('present_district')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Present district cannot exceed 100 characters')
  ),

  opt(
    body('present_city')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Present city cannot exceed 100 characters')
  ),

  opt(
    body('present_state')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Present state cannot exceed 100 characters')
  ),

  opt(
    body('present_country')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Present country cannot exceed 100 characters')
  ),

  opt(
    body('present_pincode')
      .matches(/^\d{4,10}$/)
      .withMessage('Present pincode must contain 4-10 digits')
  ),

  // Permanent Address
  opt(
    body('perm_address_type')
      .isIn(PERM_ADDRESS_TYPE)
      .withMessage('Invalid permanent address type')
  ),

  opt(
    body('perm_house_type')
      .isIn(HOUSE_TYPE)
      .withMessage('Invalid permanent house type')
  ),

  opt(
    body('perm_house_no')
      .trim()
      .isLength({ max: 50 })
      .withMessage('Permanent house number cannot exceed 50 characters')
  ),

  opt(
    body('perm_area')
      .trim()
      .isLength({ max: 300 })
      .withMessage('Permanent area cannot exceed 300 characters')
  ),

  opt(
    body('perm_district')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Permanent district cannot exceed 100 characters')
  ),

  opt(
    body('perm_city')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Permanent city cannot exceed 100 characters')
  ),

  opt(
    body('perm_state')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Permanent state cannot exceed 100 characters')
  ),

  opt(
    body('perm_country')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Permanent country cannot exceed 100 characters')
  ),

  opt(
    body('perm_pincode')
      .matches(/^\d{4,10}$/)
      .withMessage('Permanent pincode must contain 4-10 digits')
  ),
];

// ─── Step 10 (Candidate): Family & Emergency ───────────────────────────────────
// Merged step, also carrying marital_status + spouse + children (moved here
// from Personal Profile — they're all shown on this screen in the UI).
// Nothing carries a * in the UI. father_status dropped, mother_occupation is
// free text now. Emergency contact is a single static entry, no repeatable
// list, no email field.
export const familyEmergencyValidation: ValidationChain[] = [
  opt(body('marital_status').isIn(MARITAL_STATUS)),
  optDate('marriage_date'),
  opt(body('spouse_name').trim().isLength({ max: 200 })),
  optDate('spouse_dob'),
  opt(body('child1_name').trim().isLength({ max: 200 })),
  opt(body('child1_gender').isIn(GENDER)),
  optDate('child1_dob'),
  opt(body('child2_name').trim().isLength({ max: 200 })),
  opt(body('child2_gender').isIn(GENDER)),
  optDate('child2_dob'),
  opt(body('child3_name').trim().isLength({ max: 200 })),
  opt(body('child3_gender').isIn(GENDER)),
  optDate('child3_dob'),
  opt(body('father_salutation').isIn(FATHER_SALUTATION)),
  opt(body('father_name').trim().isLength({ max: 200 })),
  optDate('father_dob'),
  opt(body('father_occupation').trim().isLength({ max: 100 })),
  opt(body('mother_salutation').isIn(MOTHER_SALUTATION)),
  opt(body('mother_name').trim().isLength({ max: 200 })),
  optDate('mother_dob'),
  opt(body('mother_occupation').trim().isLength({ max: 100 })),
  opt(body('family_members').isArray()),
  opt(body('family_members.*.name').trim().isLength({ max: 200 })),
  opt(body('family_members.*.relationship').trim().isLength({ max: 100 })),
  opt(body('family_members.*.relationship_other').trim().isLength({ max: 100 })),
  opt(body('family_members.*.salutation').trim().isLength({ max: 10 })),
  optCF(body('family_members.*.dob').isISO8601()),
  opt(body('emergency_contacts').isArray()),
  opt(body('emergency_contacts.*.contact_name').trim().isLength({ max: 200 })),
  optCF(body('emergency_contacts.*.contact_number').matches(/^[+\d\s\-()]{7,20}$/)),
  optCF(body('emergency_contacts.*.email').isEmail()),
  opt(body('emergency_contacts.*.relationship').trim().isLength({ max: 100 })),
  opt(body('emergency_contacts.*.relationship_other').trim().isLength({ max: 100 })),
];

// ─── Step 11 (Candidate): IDs & Bank ──────────────────────────────────────────
// Merged step (statutory + bank + vaccinations + documents). Aadhaar (4
// fields) and personal bank (3 of 4 fields) are the ONLY required fields in
// this entire wizard outside of Role & Identity and Date of Joining —
// matches the UI's "0/2 required · Aadhaar & bank" indicator exactly.
// PAN, Passport, and Driving Licence are all fully optional.
export const idsBankValidation: ValidationChain[] = [
  // Aadhaar — required
  body('aadhaar_number').notEmpty().matches(/^\d{12}$/).withMessage('Aadhaar must be 12 digits'),
  body('aadhaar_name').trim().notEmpty().withMessage('Name as on Aadhaar is required').isLength({ max: 200 }),
  body('aadhaar_dob').notEmpty().withMessage('Date of birth (Aadhaar) is required'),
  body('aadhaar_address').trim().notEmpty().withMessage('Address as on Aadhaar is required'),
  opt(body('aadhaar_scan_url').isString()),
  // PAN — optional
  opt(body('pan_number').trim().toUpperCase().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format (ABCDE1234F)')),
  opt(body('pan_full_name').trim().isLength({ max: 200 })),
  optDate('pan_dob'),
  opt(body('pan_parent_spouse_name').trim().isLength({ max: 200 })),
  opt(body('pan_scan_url').isString()),
  // Passport — optional
  opt(body('passport_number').trim().isLength({ max: 30 })),
  opt(body('passport_full_name').trim().isLength({ max: 200 })),
  opt(body('passport_nationality').trim().isLength({ max: 100 })),
  optDate('passport_issue_date'),
  optDate('passport_expiry'),
  opt(body('passport_place_of_issue').trim().isLength({ max: 200 })),
  opt(body('passport_scan_url').isString()),
  // Driving licence — optional
  opt(body('driving_license_number').trim().isLength({ max: 30 })),
  opt(body('driving_license_name').trim().isLength({ max: 200 })),
  optDate('driving_license_issue_date'),
  optDate('driving_license_expiry'),
  opt(body('driving_license_authority').trim().isLength({ max: 200 })),
  opt(body('driving_license_scan_url').isString()),
  // Vaccinations — repeatable, optional
  opt(body('vaccinations').isArray()),
  opt(body('vaccinations.*.vaccine_name').trim().isLength({ max: 100 })),
  optCF(body('vaccinations.*.date').isISO8601()),
  // Additional documents — repeatable, optional
  opt(body('documents').isArray()),
  opt(body('documents.*.doc_type').trim().isLength({ max: 100 })),
  opt(body('documents.*.file_url').isString()),
  // Personal bank — required (3 of 4 fields; branch is optional)
  body('personal_bank_name').notEmpty().withMessage('Bank name is required').isLength({ max: 200 }),
  body('personal_bank_account').notEmpty().withMessage('Account number is required')
    .matches(/^\d{9,18}$/).withMessage('Account number must be 9-18 digits'),
  body('personal_ifsc').notEmpty().withMessage('IFSC is required')
    .toUpperCase().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC format'),
  opt(body('personal_bank_branch').trim().isLength({ max: 200 })),
];

// ─── Step 12 (Candidate): Experience & Education ──────────────────────────────
// Nothing carries a * in the UI. Both now arrays (repeatable).
export const experienceEducationValidation: ValidationChain[] = [
  opt(body('is_experienced').isBoolean()),
  opt(body('experience').isArray()),
  opt(body('experience.*.last_company_name').trim().isLength({ max: 300 })),
  opt(body('experience.*.last_designation').trim().isLength({ max: 200 })),
  optCF(body('experience.*.last_working_day').isISO8601()),
  opt(body('experience.*.exp_contact_name').trim().isLength({ max: 200 })),
  optCF(body('experience.*.exp_contact_number').matches(/^[+\d\s\-()]{7,20}$/)),
  optCF(body('experience.*.last_inhand_salary').isFloat({ min: 0 })),
  opt(body('education').isArray()),
  opt(body('education.*.highest_education').trim().isLength({ max: 100 })),
  opt(body('education.*.education_stream').trim().isLength({ max: 100 })),
  opt(body('education.*.education_mode').trim().isLength({ max: 50 })),
  opt(body('education.*.institute_name').trim().isLength({ max: 300 })),
  opt(body('education.*.education_marks').trim().isLength({ max: 20 })),
  optCF(body('education.*.education_start_year').isInt({ min: 1950, max: new Date().getFullYear() + 1 })),
  optCF(body('education.*.education_end_year').isInt({ min: 1950, max: new Date().getFullYear() + 10 })),
  opt(body('education.*.is_pursuing').isBoolean()),
];

// Step validation map for dynamic routing — keys match employee.constants.ts WIZARD_STEPS
export const STEP_VALIDATORS: Record<string, ValidationChain[]> = {
  role_identity:          roleIdentityValidation,
  location_attendance:    locationAttendanceValidation,
  managers_work_contact:  managersWorkContactValidation,
  commitment_probation:   commitmentProbationValidation,
  statutory_schemes:      statutorySchemesValidation,
  compensation:            compensationValidation,
  hr_joining_checklist:   hrJoiningChecklistValidation,
  personal_profile:       personalProfileValidation,
  address:                 addressValidation,
  family_emergency:       familyEmergencyValidation,
  ids_bank:                idsBankValidation,
  experience_education:   experienceEducationValidation,
  review:                  [],
};
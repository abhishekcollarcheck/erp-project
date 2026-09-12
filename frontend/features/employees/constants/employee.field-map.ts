/**
 * Employee detail view — row-label → dynamic_fields.field_key map.
 *
 * `EmployeeDetailView` renders ~150 `[label, value]` rows across ~30
 * `InfoCard`s. This map lets `InfoCard` look up the field_key for a row from
 * its label (scoped by card `title` to disambiguate labels that repeat with a
 * different meaning — "Basic" in Current vs Joining salary, "DOB" in Aadhaar vs
 * PAN, "House Type" in Present vs Permanent address, etc.) and then apply the
 * resolved field permission (hide / mask / block-copy).
 *
 * Labels not covered here have no field_key → shown as-is (matches the backend
 * "un-configured field ⇒ visible" rule).
 */

/** Labels whose meaning is the same in every card they appear in. */
const COMMON: Record<string, string> = {
  'Employee Code': 'employee_code',
  'Reference Code': 'reference_code',
  'Status': 'status',
  'Record': 'record_status',
  'Employment Type': 'employment_type',
  'Company': 'company_id',
  'Department': 'department_id',
  'Sub Department': 'sub_department_id',
  'Designation': 'designation_id',
  'Sub Designation': 'sub_designation_id',
  'Date of Joining': 'actual_doj',
  'Current Joining Date': 'current_doj',
  'Personal Email': 'email',
  'Personal Mobile': 'phone',
  'Official Email': 'official_email',
  'Official Mobile': 'official_mobile',
  'L1 Manager': 'l1_manager_id',
  'L2 Manager': 'l2_manager_id',

  // Commitment & Probation (identical rows appear in Overview "Probation" + Work "Commitment & Probation")
  'Commitment': 'commitment',
  'Commitment Term': 'commitment_term',
  'Commitment Entered On': 'commitment_entered_on',
  'Commitment End Date': 'commitment_end_date',
  'On Probation': 'on_probation',
  'Probation Period': 'probation_period',
  'Probation End Date': 'probation_end_date',
  'Probation Status': 'probation_status',

  // Location & Attendance
  'State / Country': 'working_state_country',
  'Working City': 'working_city',
  'Working Site': 'working_site',
  'Pay Register Location': 'pay_register_location',
  'Weekly Off': 'weekly_off',
  'Shift Category': 'shift_category',
  'Working Shift': 'shift_id',
  'Grace Minutes': 'grace_minutes',

  // Statutory Schemes
  'PF Applicable': 'pf_status',
  'UAN': 'uan_number',
  'EPFO Member ID': 'epfo_member_id',
  'PF Contribution %': 'pf_contribution_pct',
  'PF Employee (12%)': 'pf_employee_12',
  'EPS Employer (8.33%)': 'eps_employer_833',
  'EPF/EPS Diff (3.67%)': 'epf_eps_diff_367',
  'ESI Applicable': 'esic_status',
  'ESI Number': 'esic_number',
  'ESI Employee %': 'esi_employee_pct',
  'ESI Employer %': 'esi_employer_pct',
  'Mediclaim Status': 'mediclaim_status',
  'Mediclaim Number': 'mediclaim_number',
  'Mediclaim Amount': 'mediclaim_amount',
  'RD Scheme': 'rd_scheme',
  'RD Term': 'rd_term',
  'RD Account Number': 'rd_account_number',
  'RD Opening Date': 'rd_opening_date',
  'RD Amount (Employee)': 'rd_amount_employee',
  'RD Amount (Employer)': 'rd_amount_employer',
  'RD Maturity Date': 'rd_maturity_date',
  'RD Maturity Amount': 'rd_maturity_amount',

  // Personal Profile
  'Date of Birth': 'date_of_birth',
  'Gender': 'gender',
  'Blood Group': 'blood_group',
  'Shirt Size': 'shirt_size',
  'T-shirt Size': 'tshirt_size',
  'Religion': 'religion',

  // Marital & Children / Parents
  'Marital Status': 'marital_status',
  'Marriage Date': 'marriage_date',
  'Spouse Name': 'spouse_name',
  'Spouse DOB': 'spouse_dob',
  'Child 1': 'child1_name',
  'Child 2': 'child2_name',
  'Child 3': 'child3_name',
  'Father': 'father_name',
  'Father DOB': 'father_dob',
  'Father Occupation': 'father_occupation',
  'Mother': 'mother_name',
  'Mother DOB': 'mother_dob',
  'Mother Occupation': 'mother_occupation',

  // Travel / Vaccination
  'Yellow Fever': 'yellow_fever',
  'Yellow Fever Date': 'yellow_fever_date',

  // Personal Bank
  'Bank Name': 'personal_bank_name',
  'Account Number': 'personal_bank_account',
  'IFSC': 'personal_ifsc',
  'Branch': 'personal_bank_branch',

  // Experience & Education
  'Is Experienced': 'is_experienced',

  // HR Joining Checklist
  'Offer Letter': 'offer_letter',
  'Address Verification': 'address_verification',
  'Service Agreement': 'service_agreement',
  'Indemnity Bond': 'indemnity_bond',
  'Asset Deduction Letter': 'asset_deduction_letter',
  'Account Opening Letter': 'account_opening_letter',
  'NDA': 'nda',
  'Remarks': 'checklist_remarks',

  // Asset Deduction card (rows built by assetDeductionRows)
  'Applicable': 'asset_deduction_applicable',
  'Security Amount': 'security_amount',
  'Deduction Months': 'deduction_months',
  'Deduction From': 'deduction_from',
  'Monthly Deduction': 'monthly_deduction',
  'Final Monthly Deduction': 'final_monthly_deduction',
};

/** Card-title-scoped overrides — labels that mean different fields per card. */
const BY_CARD: Record<string, Record<string, string>> = {
  'Current Salary': {
    'Salary Mode': 'salary_mode', 'Basic': 'current_basic', 'HRA': 'current_hra',
    'Allowance 1': 'current_allowance1', 'AMDB (PM)': 'current_amdb',
  },
  'Joining Salary': {
    'Basic': 'joining_basic', 'HRA': 'joining_hra',
    'Allowance 1': 'joining_allowance1', 'AMDB (PM)': 'joining_amdb',
  },
  'Present Address': {
    'House Type': 'present_house_type', 'House No': 'present_house_no', 'Area': 'present_area',
    'District': 'present_district', 'City': 'present_city', 'State': 'present_state',
    'Country': 'present_country', 'Pincode': 'present_pincode',
  },
  'Permanent Address': {
    'Type': 'perm_address_type', 'House Type': 'perm_house_type', 'House No': 'perm_house_no',
    'Area': 'perm_area', 'District': 'perm_district', 'City': 'perm_city', 'State': 'perm_state',
    'Country': 'perm_country', 'Pincode': 'perm_pincode',
  },
  'Aadhaar': {
    'Aadhaar Number': 'aadhaar_number', 'Name as on Aadhaar': 'aadhaar_name',
    'DOB': 'aadhaar_dob', 'Address': 'aadhaar_address', 'Scan': 'aadhaar_scan_url',
  },
  'PAN': {
    'PAN Number': 'pan_number', 'Full Name': 'pan_full_name', 'DOB': 'pan_dob',
    'Parent / Spouse Name': 'pan_parent_spouse_name', 'Scan': 'pan_scan_url',
  },
  'Passport': {
    'Passport Number': 'passport_number', 'Full Name': 'passport_full_name',
    'Nationality': 'passport_nationality', 'Issue Date': 'passport_issue_date',
    'Expiry': 'passport_expiry', 'Place of Issue': 'passport_place_of_issue',
    'Scan': 'passport_scan_url',
  },
  'Driving Licence': {
    'Number': 'driving_license_number', 'Name': 'driving_license_name',
    'Issue Date': 'driving_license_issue_date', 'Expiry': 'driving_license_expiry',
    'Authority': 'driving_license_authority', 'Scan': 'driving_license_scan_url',
  },
  'ID Scans': {
    'Aadhaar': 'aadhaar_scan_url', 'PAN': 'pan_scan_url',
    'Passport': 'passport_scan_url', 'Driving Licence': 'driving_license_scan_url',
  },
  'Personal Profile': { 'Nationality': 'nationality' },

  // Personal vs Official bank — same labels, different field_keys
  'Personal Bank': {
    'Bank Name': 'personal_bank_name', 'Account Number': 'personal_bank_account',
    'IFSC': 'personal_ifsc', 'Branch': 'personal_bank_branch',
  },
  'Official Bank': {
    'Bank Name': 'bank_name', 'Account Number': 'bank_account_number',
    'IFSC': 'ifsc_code', 'Branch': 'bank_branch_name',
  },
};

/** Resolve the field_key for a detail row, given its card title + label. */
export function detailFieldKey(cardTitle: string | undefined, label: string): string | undefined {
  return (cardTitle && BY_CARD[cardTitle]?.[label]) ?? COMMON[label];
}

import { QueryInterface } from 'sequelize';

const FORM_ID = 1;
const SORT_ORDER_START = 1; // continues after the 30 core-field rows (sort_order 0-29)
 
interface FieldSeed {
  field_type: 'text' | 'select' | 'date' | 'checkbox' | 'number';
  label: string;
  field_key: string;
  section: string;
}

const FIELDS: FieldSeed[] = [
  // ── Role & Identity ──────────────────────────────────────────────
  { field_type: 'text',     label: 'Avatar',              field_key: 'avatar_url',            section: 'Basic Info' },
  { field_type: 'text',     label: 'Employee Code',       field_key: 'employee_code',         section: 'Basic Info' },
  { field_type: 'text',     label: 'Reference Code',      field_key: 'reference_code',        section: 'Basic Info' },
  { field_type: 'select',   label: 'Status',              field_key: 'status',                section: 'Basic Info' },
  { field_type: 'text',     label: 'First Name',          field_key: 'first_name',            section: 'Basic Info' },
  { field_type: 'text',     label: 'Middle Name',         field_key: 'middle_name',           section: 'Basic Info' },
  { field_type: 'text',     label: 'Last Name',           field_key: 'last_name',             section: 'Basic Info' },
  { field_type: 'select',   label: 'Company',             field_key: 'company_id',            section: 'Basic Info' },
  { field_type: 'select',   label: 'Employment Type',     field_key: 'employment_type',       section: 'Basic Info' },
  { field_type: 'select',   label: 'Department',          field_key: 'department_id',         section: 'Basic Info' },
  { field_type: 'select',   label: 'Sub Department',      field_key: 'sub_department_id',     section: 'Basic Info' },
  { field_type: 'select',   label: 'Designation',         field_key: 'designation_id',        section: 'Basic Info' },
  { field_type: 'select',   label: 'Sub Designation',     field_key: 'sub_designation_id',    section: 'Basic Info' },

  // ── Portal Invite Contact ────────────────────────────────────────
  { field_type: 'text',     label: 'Personal Email',      field_key: 'email',                 section: 'Basic Info' },
  { field_type: 'text',     label: 'Personal Mobile',     field_key: 'phone',                 section: 'Basic Info' },

  // ── Location & Attendance ────────────────────────────────────────
  { field_type: 'text',     label: 'Working State/Country', field_key: 'working_state_country', section: 'Employment Details' },
  { field_type: 'text',     label: 'Working City',         field_key: 'working_city',          section: 'Employment Details' },
  { field_type: 'text',     label: 'Working Site',         field_key: 'working_site',          section: 'Employment Details' },
  { field_type: 'text',     label: 'Pay Register Location', field_key: 'pay_register_location', section: 'Employment Details' },
  { field_type: 'date',     label: 'Actual Date of Joining', field_key: 'actual_doj',          section: 'Employment Details' },
  { field_type: 'date',     label: 'Current Date of Joining', field_key: 'current_doj',        section: 'Employment Details' },
  { field_type: 'select',   label: 'Weekly Off',           field_key: 'weekly_off',            section: 'Employment Details' },
  { field_type: 'select',   label: 'Shift Category',       field_key: 'shift_category',        section: 'Employment Details' },
  { field_type: 'select',   label: 'Shift',                field_key: 'shift_id',              section: 'Employment Details' },
  { field_type: 'select',   label: 'Grace Minutes',        field_key: 'grace_minutes',         section: 'Employment Details' },

  // ── Managers & Work Contact ──────────────────────────────────────
  { field_type: 'select',   label: 'L1 Manager',           field_key: 'l1_manager_id',         section: 'Reporting & Contact' },
  { field_type: 'select',   label: 'L2 Manager',           field_key: 'l2_manager_id',         section: 'Reporting & Contact' },
  { field_type: 'text',     label: 'Work Email',           field_key: 'official_email',        section: 'Reporting & Contact' },
  { field_type: 'text',     label: 'Work Mobile',          field_key: 'official_mobile',       section: 'Reporting & Contact' },

  // ── Access ────────────────────────────────────────────────────────
  { field_type: 'number',   label: 'Form Completion %',    field_key: 'form_completion_pct',   section: 'Access' },
  { field_type: 'checkbox', label: 'Portal Access',        field_key: 'portal_access',         section: 'Access' },
  { field_type: 'checkbox', label: 'Super Admin',          field_key: 'is_super_admin',        section: 'Access' },
  { field_type: 'checkbox', label: 'Must Change Password', field_key: 'must_change_password',  section: 'Access' },
  // ── Commitment & Probation (EmployeeCommitmentProbation) ─────────
  { field_type: 'checkbox', label: 'Commitment',                  field_key: 'commitment',                  section: 'Commitment & Probation' },
  { field_type: 'select',   label: 'Commitment Term',             field_key: 'commitment_term',             section: 'Commitment & Probation' },
  { field_type: 'date',     label: 'Commitment Entered On',       field_key: 'commitment_entered_on',       section: 'Commitment & Probation' },
  { field_type: 'date',     label: 'Commitment End Date',         field_key: 'commitment_end_date',         section: 'Commitment & Probation' },
  { field_type: 'text',     label: 'Commitment Status',           field_key: 'commitment_status',           section: 'Commitment & Probation' },
  { field_type: 'checkbox', label: 'On Probation',                field_key: 'on_probation',                section: 'Commitment & Probation' },
  { field_type: 'text',     label: 'Probation Period',            field_key: 'probation_period',            section: 'Commitment & Probation' },
  { field_type: 'date',     label: 'Probation End Date',          field_key: 'probation_end_date',          section: 'Commitment & Probation' },
  { field_type: 'text',     label: 'Probation Status',            field_key: 'probation_status',            section: 'Commitment & Probation' },
  { field_type: 'text',     label: 'Probation Extended Period',   field_key: 'probation_extended_period',   section: 'Commitment & Probation' },
  { field_type: 'text',     label: 'Probation Final Status',      field_key: 'probation_final_status',      section: 'Commitment & Probation' },
  { field_type: 'select',   label: 'Confirmation Status',         field_key: 'confirmation_status',         section: 'Commitment & Probation' },
  { field_type: 'date',     label: 'Confirmed On',                field_key: 'confirmed_on',                section: 'Commitment & Probation' },

  // ── Schemes: PF / ESIC / Mediclaim / RD (EmployeeSchemes) ────────
  { field_type: 'checkbox', label: 'PF Status',                   field_key: 'pf_status',                   section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'text',     label: 'UAN Number',                  field_key: 'uan_number',                  section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'text',     label: 'EPFO Member ID',              field_key: 'epfo_member_id',              section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'PF Contribution %',           field_key: 'pf_contribution_pct',         section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'PF Employer From',            field_key: 'pf_employer_from',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'PF Employee 12%',             field_key: 'pf_employee_12',              section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'EPS Employer 8.33%',          field_key: 'eps_employer_833',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'EPF/EPS Diff 3.67%',          field_key: 'epf_eps_diff_367',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'checkbox', label: 'ESIC Status',                 field_key: 'esic_status',                 section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'text',     label: 'ESIC Number',                 field_key: 'esic_number',                 section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'ESI Employee %',               field_key: 'esi_employee_pct',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'ESI Employer %',               field_key: 'esi_employer_pct',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'Mediclaim Status',            field_key: 'mediclaim_status',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'text',     label: 'Mediclaim Number',            field_key: 'mediclaim_number',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'Mediclaim Amount',            field_key: 'mediclaim_amount',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'checkbox', label: 'RD Scheme',                   field_key: 'rd_scheme',                   section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'RD Term',                     field_key: 'rd_term',                     section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'date',     label: 'RD Opening Date',             field_key: 'rd_opening_date',             section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'text',     label: 'RD Account Number',           field_key: 'rd_account_number',           section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'RD Deduction From',           field_key: 'rd_deduction_from',           section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'RD Amount (Employee)',        field_key: 'rd_amount_employee',          section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'RD Amount (Employer)',        field_key: 'rd_amount_employer',          section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'Total Monthly Contribution',  field_key: 'ttl_m_contribution',          section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'date',     label: 'RD Maturity Date',            field_key: 'rd_maturity_date',            section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'number',   label: 'RD Maturity Amount',          field_key: 'rd_maturity_amount',          section: 'Schemes (PF/ESIC/Mediclaim/RD)' },
  { field_type: 'select',   label: 'RD Status',                   field_key: 'rd_status',                   section: 'Schemes (PF/ESIC/Mediclaim/RD)' },

  // ── Personal Profile (EmployeePersonal) ───────────────────────────
  { field_type: 'date',     label: 'Date of Birth',               field_key: 'date_of_birth',               section: 'Personal' },
  { field_type: 'select',   label: 'Gender',                      field_key: 'gender',                      section: 'Personal' },
  { field_type: 'select',   label: 'Shirt Size',                  field_key: 'shirt_size',                  section: 'Personal' },
  { field_type: 'select',   label: 'T-Shirt Size',                field_key: 'tshirt_size',                 section: 'Personal' },
  { field_type: 'text',     label: 'Nationality',                 field_key: 'nationality',                 section: 'Personal' },
  { field_type: 'text',     label: 'Religion',                    field_key: 'religion',                    section: 'Personal' },
  { field_type: 'select',   label: 'Blood Group',                 field_key: 'blood_group',                 section: 'Personal' },
  { field_type: 'select',   label: 'Marital Status',               field_key: 'marital_status',              section: 'Personal' },
  { field_type: 'date',     label: 'Marriage Date',                field_key: 'marriage_date',               section: 'Personal' },
  { field_type: 'text',     label: 'Spouse Name',                  field_key: 'spouse_name',                 section: 'Personal' },
  { field_type: 'date',     label: 'Spouse DOB',                   field_key: 'spouse_dob',                  section: 'Personal' },
  { field_type: 'text',     label: 'Child 1 Name',                 field_key: 'child1_name',                 section: 'Personal' },
  { field_type: 'date',     label: 'Child 1 DOB',                  field_key: 'child1_dob',                  section: 'Personal' },
  { field_type: 'text',     label: 'Child 2 Name',                 field_key: 'child2_name',                 section: 'Personal' },
  { field_type: 'date',     label: 'Child 2 DOB',                  field_key: 'child2_dob',                  section: 'Personal' },
  { field_type: 'text',     label: 'Child 3 Name',                 field_key: 'child3_name',                 section: 'Personal' },
  { field_type: 'date',     label: 'Child 3 DOB',                  field_key: 'child3_dob',                  section: 'Personal' },

  // ── Family (EmployeeFamily) ───────────────────────────────────────
  { field_type: 'select',   label: 'Father Salutation',            field_key: 'father_salutation',           section: 'Family' },
  { field_type: 'text',     label: 'Father Name',                  field_key: 'father_name',                 section: 'Family' },
  { field_type: 'date',     label: 'Father DOB',                   field_key: 'father_dob',                  section: 'Family' },
  { field_type: 'text',     label: 'Father Occupation',            field_key: 'father_occupation',           section: 'Family' },
  { field_type: 'select',   label: 'Mother Salutation',            field_key: 'mother_salutation',           section: 'Family' },
  { field_type: 'text',     label: 'Mother Name',                  field_key: 'mother_name',                 section: 'Family' },
  { field_type: 'date',     label: 'Mother DOB',                   field_key: 'mother_dob',                  section: 'Family' },
  { field_type: 'text',     label: 'Mother Occupation',            field_key: 'mother_occupation',           section: 'Family' },

  // ── Other Family Members — repeatable (EmployeeFamilyMember) ─────
  // "family_members" is the whole-block key StepFamilyEmergency.tsx
  // actually checks (fieldPerm={f('family_members')} on every field in the
  // repeater) — the granular family_member_* rows below are seeded too but
  // nothing currently reads them; without this row the section is DENY_ALL
  // by default and renders as nothing for every user.
  { field_type: 'text',     label: 'Other Family Members (Section)', field_key: 'family_members',               section: 'Other Family Members' },
  { field_type: 'text',     label: 'Name',                         field_key: 'family_member_name',          section: 'Other Family Members' },
  { field_type: 'text',     label: 'Relationship',                 field_key: 'family_member_relationship',  section: 'Other Family Members' },
  { field_type: 'date',     label: 'Date of Birth',                field_key: 'family_member_dob',           section: 'Other Family Members' },
  { field_type: 'text',     label: 'Occupation',                   field_key: 'family_member_occupation',    section: 'Other Family Members' },

  // ── Address (EmployeeAddress) — single shared field set, ─────────
  // distinguished by address_type, NOT duplicated present_*/perm_* keys
  { field_type: 'select', label: 'House Type',   field_key: 'present_house_type',   section: 'Address', },
  { field_type: 'text',   label: 'House No',   field_key: 'present_house_no',   section: 'Address', },
  { field_type: 'text',   label: 'Area',   field_key: 'present_area',   section: 'Address', },
  { field_type: 'text',   label: 'District',   field_key: 'present_district',   section: 'Address', },
  { field_type: 'select',   label: 'City',   field_key: 'present_city',   section: 'Address', },
  { field_type: 'select',   label: 'State',   field_key: 'present_state',   section: 'Address', },
  { field_type: 'select',   label: 'Country',   field_key: 'present_country',   section: 'Address', },
  { field_type: 'text',   label: 'Pincode',   field_key: 'present_pincode',   section: 'Address', },

  // Permanent Address
  { field_type: 'select',   label: 'Address Type',   field_key: 'perm_address_type',   section: 'Address',},
  { field_type: 'select',   label: 'House Type',   field_key: 'perm_house_type',   section: 'Address', },
  { field_type: 'text',   label: 'House No',   field_key: 'perm_house_no',   section: 'Address', },
  { field_type: 'text',   label: 'Area',   field_key: 'perm_area',   section: 'Address', },
  { field_type: 'text',   label: 'District',   field_key: 'perm_district',   section: 'Address', },
  { field_type: 'text',   label: 'City',   field_key: 'perm_city',   section: 'Address', },
  { field_type: 'text',   label: 'State',   field_key: 'perm_state',   section: 'Address', },
  { field_type: 'text',   label: 'Country',   field_key: 'perm_country',   section: 'Address', },
  { field_type: 'text',   label: 'Pincode',   field_key: 'perm_pincode',   section: 'Address', },
  { field_type: 'checkbox',   label: 'Same as Present Address',   field_key: 'is_same_as_present',   section: 'Address', },

  // ── Emergency Contact (EmployeeEmergencyContact) ──────────────────
  // "emergency_contacts" is the whole-block key StepFamilyEmergency.tsx
  // actually checks — same missing-key pattern as family_members above.
  { field_type: 'text',     label: 'Emergency Contacts (Section)', field_key: 'emergency_contacts',          section: 'Emergency Contacts' },
  { field_type: 'text',     label: 'Contact Name',                 field_key: 'emergency_contact_name',      section: 'Emergency Contacts' },
  { field_type: 'text',     label: 'Contact Number',                field_key: 'emergency_contact_number',   section: 'Emergency Contacts' },
  { field_type: 'text',     label: 'Email',                         field_key: 'emergency_contact_email',    section: 'Emergency Contacts' },
  { field_type: 'text',     label: 'Relationship',                  field_key: 'emergency_relationship',      section: 'Emergency Contacts' },
  { field_type: 'checkbox', label: 'Is Primary',                    field_key: 'emergency_is_primary',        section: 'Emergency Contacts' },

  // ── Statutory / IDs (EmployeeStatutory) ───────────────────────────
  { field_type: 'text',     label: 'Aadhaar Number',                field_key: 'aadhaar_number',              section: 'Statutory' },
  { field_type: 'text',     label: 'Aadhaar Name',                  field_key: 'aadhaar_name',                section: 'Statutory' },
  { field_type: 'date',     label: 'Aadhaar DOB',                   field_key: 'aadhaar_dob',                 section: 'Statutory' },
  { field_type: 'text',     label: 'Aadhaar Address',               field_key: 'aadhaar_address',             section: 'Statutory' },
  { field_type: 'text',     label: 'Aadhaar Scan',                  field_key: 'aadhaar_scan_url',            section: 'Statutory' },
  { field_type: 'text',     label: 'PAN Number',                    field_key: 'pan_number',                  section: 'Statutory' },
  { field_type: 'text',     label: 'PAN Full Name',                 field_key: 'pan_full_name',               section: 'Statutory' },
  { field_type: 'date',     label: 'PAN DOB',                       field_key: 'pan_dob',                     section: 'Statutory' },
  { field_type: 'text',     label: 'PAN Parent/Spouse Name',        field_key: 'pan_parent_spouse_name',      section: 'Statutory' },
  { field_type: 'text',     label: 'PAN Scan',                      field_key: 'pan_scan_url',                section: 'Statutory' },
  { field_type: 'text',     label: 'Passport Number',               field_key: 'passport_number',             section: 'Statutory' },
  { field_type: 'text',     label: 'Passport Full Name',            field_key: 'passport_full_name',          section: 'Statutory' },
  { field_type: 'text',     label: 'Passport Nationality',          field_key: 'passport_nationality',        section: 'Statutory' },
  { field_type: 'date',     label: 'Passport Issue Date',           field_key: 'passport_issue_date',         section: 'Statutory' },
  { field_type: 'date',     label: 'Passport Expiry',               field_key: 'passport_expiry',             section: 'Statutory' },
  { field_type: 'text',     label: 'Passport Place of Issue',       field_key: 'passport_place_of_issue',     section: 'Statutory' },
  { field_type: 'text',     label: 'Passport Scan',                 field_key: 'passport_scan_url',           section: 'Statutory' },
  { field_type: 'text',     label: 'Driving License Number',        field_key: 'driving_license_number',      section: 'Statutory' },
  { field_type: 'text',     label: 'Driving License Name',          field_key: 'driving_license_name',        section: 'Statutory' },
  { field_type: 'date',     label: 'Driving License Issue Date',    field_key: 'driving_license_issue_date',  section: 'Statutory' },
  { field_type: 'date',     label: 'Driving License Expiry',        field_key: 'driving_license_expiry',      section: 'Statutory' },
  { field_type: 'text',     label: 'Driving License Authority',     field_key: 'driving_license_authority',   section: 'Statutory' },
  { field_type: 'text',     label: 'Driving License Scan',          field_key: 'driving_license_scan_url',    section: 'Statutory' },
  { field_type: 'checkbox', label: 'Yellow Fever',                  field_key: 'yellow_fever',                section: 'Statutory' },
  { field_type: 'date',     label: 'Yellow Fever Date',             field_key: 'yellow_fever_date',           section: 'Statutory' },

  // ── Vaccinations — repeatable (EmployeeVaccination) ───────────────
  // "vaccinations" is the whole-block key StepIdsBank.tsx actually checks.
  { field_type: 'text',     label: 'Vaccinations (Section)',        field_key: 'vaccinations',                section: 'Vaccinations' },
  { field_type: 'text',     label: 'Vaccine Name',                  field_key: 'vaccine_name',                section: 'Vaccinations' },
  { field_type: 'date',     label: 'Date',                          field_key: 'vaccination_date',            section: 'Vaccinations' },
  { field_type: 'text',     label: 'Notes',                         field_key: 'vaccination_notes',           section: 'Vaccinations' },

  // ── Additional Documents — repeatable (EmployeeDocument) ──────────
  // "documents" is the whole-block key StepIdsBank.tsx actually checks.
  { field_type: 'text',     label: 'Additional Documents (Section)', field_key: 'documents',                   section: 'Additional Documents' },
  { field_type: 'select',   label: 'Document Type',                 field_key: 'doc_type',                    section: 'Additional Documents' },
  { field_type: 'text',     label: 'Document Type (Other)',         field_key: 'doc_type_other',              section: 'Additional Documents' },
  { field_type: 'text',     label: 'File',                          field_key: 'doc_file_url',                section: 'Additional Documents' },

  // ── Personal Bank Details (EmployeeBankDetail, bank_type='personal') ──
  // StepIdsBank.tsx uses personal_bank_* keys — distinct from the generic
  // bank_* keys below, which cover a different/official bank-details
  // consumer. Without these, the whole Personal Bank card is invisible.
  { field_type: 'select',   label: 'Personal Bank Name',            field_key: 'personal_bank_name',          section: 'Personal Bank Details' },
  { field_type: 'text',     label: 'Personal Bank Account Number',  field_key: 'personal_bank_account',       section: 'Personal Bank Details' },
  { field_type: 'text',     label: 'Personal IFSC Code',            field_key: 'personal_ifsc',               section: 'Personal Bank Details' },
  { field_type: 'text',     label: 'Personal Bank Branch',          field_key: 'personal_bank_branch',        section: 'Personal Bank Details' },

  // ── Bank Details (EmployeeBankDetail) ─────────────────────────────
  { field_type: 'select',   label: 'Bank Account Type',             field_key: 'bank_type',                   section: 'Bank Details' },
  { field_type: 'text',     label: 'Bank Name',                     field_key: 'bank_name',                   section: 'Bank Details' },
  { field_type: 'text',     label: 'Account Number',                field_key: 'bank_account_number',         section: 'Bank Details' },
  { field_type: 'text',     label: 'IFSC Code',                     field_key: 'ifsc_code',                   section: 'Bank Details' },
  { field_type: 'text',     label: 'Branch Name',                   field_key: 'bank_branch_name',            section: 'Bank Details' },

  // ── Compensation (EmployeeSalary) ─────────────────────────────────
  { field_type: 'select',   label: 'Salary Type',                   field_key: 'salary_type',                 section: 'Salary' },
  { field_type: 'select',   label: 'Salary Mode',                   field_key: 'salary_mode',                 section: 'Salary' },
  { field_type: 'number',   label: 'Basic',                         field_key: 'basic',                       section: 'Salary' },
  { field_type: 'number',   label: 'HRA',                           field_key: 'hra',                         section: 'Salary' },
  { field_type: 'number',   label: 'Allowance 1',                   field_key: 'allowance1',                  section: 'Salary' },
  { field_type: 'number',   label: 'Gross Salary (PM)',             field_key: 'gross_salary_pm',             section: 'Salary' },
  // StepCompensation.tsx checks fieldPerm={f('amdb')} for both the current and
  // joining AMDB inputs; `amdb_pm` is only the read-side column name.
  { field_type: 'number',   label: 'AMDB',                          field_key: 'amdb',                        section: 'Salary' },
  { field_type: 'number',   label: 'AMDB (PM)',                     field_key: 'amdb_pm',                     section: 'Salary' },
  { field_type: 'number',   label: 'Total Earning (PM)',            field_key: 'total_earning_pm',            section: 'Salary' },
  { field_type: 'date',     label: 'Effective From',                field_key: 'salary_effective_from',       section: 'Salary' },

  // ── Asset Deduction (EmployeeAssetDeduction) ──────────────────────
  { field_type: 'checkbox', label: 'Applicable',                    field_key: 'asset_deduction_applicable',  section: 'Asset Deduction' },
  { field_type: 'number',   label: 'Security Amount',               field_key: 'security_amount',             section: 'Asset Deduction' },
  { field_type: 'text',     label: 'Deduction Months',              field_key: 'deduction_months',            section: 'Asset Deduction' },
  { field_type: 'select',   label: 'Deduction From',                field_key: 'deduction_from',              section: 'Asset Deduction' },
  { field_type: 'number',   label: 'Monthly Deduction',             field_key: 'monthly_deduction',           section: 'Asset Deduction' },
  { field_type: 'number',   label: 'Final Monthly Deduction',       field_key: 'final_monthly_deduction',     section: 'Asset Deduction' },
  { field_type: 'number',   label: 'Last Installment',              field_key: 'last_installment',            section: 'Asset Deduction' },

  // ── Experience (EmployeeExperience + EmployeeExperienceFlag) ─────
  // "experience" is the whole-block key StepExperienceEducation.tsx
  // actually checks (every repeated-role field shares this one fieldPerm).
  { field_type: 'text',     label: 'Work Experience (Section)',     field_key: 'experience',                  section: 'Experience' },
  { field_type: 'checkbox', label: 'Is Experienced',                field_key: 'is_experienced',              section: 'Experience' },
  { field_type: 'text',     label: 'Last Company Name',             field_key: 'last_company_name',           section: 'Experience' },
  { field_type: 'text',     label: 'Last Designation',              field_key: 'last_designation',            section: 'Experience' },
  { field_type: 'date',     label: 'Last Working Day',              field_key: 'exp_last_working_day',        section: 'Experience' },
  { field_type: 'text',     label: 'Contact Name',                  field_key: 'exp_contact_name',            section: 'Experience' },
  { field_type: 'text',     label: 'Contact Number',                field_key: 'exp_contact_number',          section: 'Experience' },
  { field_type: 'text',     label: 'Contact Designation',           field_key: 'exp_contact_designation',     section: 'Experience' },
  { field_type: 'number',   label: 'Last In-hand Salary',           field_key: 'last_inhand_salary',          section: 'Experience' },

  // ── Education (EmployeeEducation) ─────────────────────────────────
  // "education" is the whole-block key StepExperienceEducation.tsx
  // actually checks.
  { field_type: 'text',     label: 'Education (Section)',           field_key: 'education',                   section: 'Education' },
  { field_type: 'text',     label: 'Highest Education',             field_key: 'highest_education',           section: 'Education' },
  { field_type: 'text',     label: 'Education Stream',              field_key: 'education_stream',            section: 'Education' },
  { field_type: 'select',   label: 'Education Mode',                field_key: 'education_mode',              section: 'Education' },
  { field_type: 'text',     label: 'Institute Name',                field_key: 'institute_name',              section: 'Education' },
  { field_type: 'text',     label: 'Education Marks',               field_key: 'education_marks',             section: 'Education' },
  { field_type: 'number',   label: 'Start Year',                    field_key: 'education_start_year',        section: 'Education' },
  { field_type: 'number',   label: 'End Year',                      field_key: 'education_end_year',          section: 'Education' },
  { field_type: 'checkbox', label: 'Currently Pursuing',            field_key: 'is_pursuing',                 section: 'Education' },

  // ── HR Joining Checklist (EmployeeOnboardingDocs) ─────────────────
  { field_type: 'checkbox', label: 'Offer Letter',                  field_key: 'offer_letter',                section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'Address Verification',          field_key: 'address_verification',        section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'Service Agreement',             field_key: 'service_agreement',           section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'Indemnity Bond',                field_key: 'indemnity_bond',              section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'Asset Deduction Letter',        field_key: 'asset_deduction_letter',      section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'Account Opening Letter',        field_key: 'account_opening_letter',      section: 'Onboarding Docs' },
  { field_type: 'checkbox', label: 'NDA',                           field_key: 'nda',                         section: 'Onboarding Docs' },
  { field_type: 'text',     label: 'Remarks',                       field_key: 'onboarding_remarks',          section: 'Onboarding Docs' },

  // ── Transfers (EmployeeTransfer) ──────────────────────────────────
  { field_type: 'number',   label: 'Transfer Order',                field_key: 'transfer_order',              section: 'Transfers' },
  { field_type: 'date',     label: 'Transferred On',                field_key: 'transferred_on',              section: 'Transfers' },
  { field_type: 'text',     label: 'New Company',                   field_key: 'new_company',                 section: 'Transfers' },
  { field_type: 'date',     label: 'New Joining Date',              field_key: 'new_joining_date',            section: 'Transfers' },
  { field_type: 'text',     label: 'New Location',                  field_key: 'new_location',                section: 'Transfers' },
  { field_type: 'text',     label: 'New Department',                field_key: 'new_department',              section: 'Transfers' },
  { field_type: 'text',     label: 'New Job Title',                 field_key: 'new_job_title',               section: 'Transfers' },
  { field_type: 'text',     label: 'Old Company',                   field_key: 'old_company',                 section: 'Transfers' },
  { field_type: 'date',     label: 'Exit Date',                     field_key: 'transfer_exit_date',          section: 'Transfers' },
  { field_type: 'text',     label: 'Old Location',                  field_key: 'old_location',                section: 'Transfers' },
  { field_type: 'text',     label: 'Old Department',                field_key: 'old_department',              section: 'Transfers' },
  { field_type: 'text',     label: 'Old Job Title',                 field_key: 'old_job_title',               section: 'Transfers' },
  { field_type: 'text',     label: 'Old Employee Code',             field_key: 'old_emp_code',                section: 'Transfers' },

  // ── Exit (EmployeeExit) ───────────────────────────────────────────
  { field_type: 'checkbox', label: 'Resignation Submitted',         field_key: 'resignation_submitted',       section: 'Exit' },
  { field_type: 'date',     label: 'Resignation Date',              field_key: 'resignation_date',            section: 'Exit' },
  { field_type: 'text',     label: 'Notice Period',                 field_key: 'notice_period',               section: 'Exit' },
  { field_type: 'date',     label: 'Last Working Day',              field_key: 'exit_last_working_day',       section: 'Exit' },
  { field_type: 'checkbox', label: 'Exit Formalities Done',         field_key: 'exit_formalities_done',       section: 'Exit' },
  { field_type: 'text',     label: 'Exit Status',                   field_key: 'exit_status',                 section: 'Exit' },
  { field_type: 'text',     label: 'Exit Remarks',                  field_key: 'exit_remarks',                section: 'Exit' },
  { field_type: 'checkbox', label: 'Verified',                      field_key: 'exit_verified',                section: 'Exit' },
  { field_type: 'text',     label: 'Verified By',                   field_key: 'exit_verified_by',            section: 'Exit' },
  { field_type: 'text',     label: 'Verification Remarks',          field_key: 'exit_verification_remarks',   section: 'Exit' },
];

export async function up(queryInterface: QueryInterface): Promise<void> {
  const now = new Date();

  // This dev DB's hr_modules/form_definitions were never seeded (they're
  // normally created via the Form Builder UI), so form_id=1 doesn't exist yet
  // and the dynamic_fields insert below would fail its FK. Create the
  // "Employee" module + "Employee Onboarding" form (as id=1) if missing.
  const [existingForm] = (await queryInterface.sequelize.query(
    'SELECT id FROM form_definitions WHERE id = :id',
    { replacements: { id: FORM_ID } },
  )) as unknown as [{ id: number }[], unknown];

  if (existingForm.length === 0) {
    const [existingModule] = (await queryInterface.sequelize.query(
      "SELECT id FROM hr_modules WHERE slug = 'employee'",
    )) as unknown as [{ id: number }[], unknown];

    let moduleId: number;
    if (existingModule.length > 0) {
      moduleId = existingModule[0].id;
    } else {
      await queryInterface.bulkInsert('hr_modules', [{
        name: 'Employee',
        slug: 'employee',
        icon: '👤',
        description: 'Employee records and profile management',
        sort_order: 1,
        is_active: true,
        is_system: true,
        created_at: now,
        updated_at: now,
      }] as any);
      const [[{ id }]] = (await queryInterface.sequelize.query(
        'SELECT LAST_INSERT_ID() as id',
      )) as unknown as [{ id: number }[], unknown];
      moduleId = id;
    }

    await queryInterface.bulkInsert('form_definitions', [{
      id: FORM_ID,
      company_id: null,
      module_id: moduleId,
      name: 'Employee Onboarding',
      slug: 'employee_onboarding',
      description: 'Full employee onboarding wizard',
      sort_order: 1,
      is_active: true,
      is_system: true,
      created_at: now,
      updated_at: now,
    }] as any);
  }

  const rows = FIELDS.map((f, i) => ({
    company_id: null,
    form_id: FORM_ID,
    field_type: f.field_type,
    label: f.label,
    field_key: f.field_key,
    section: f.section,
    sort_order: SORT_ORDER_START + i,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));

  await queryInterface.bulkInsert('dynamic_fields', rows, {
  updateOnDuplicate: [
    'label',
    'field_type',
    'section',
    'sort_order',
    'is_active',
    'updated_at',
  ],
} as any);

  // Back-fill field_permissions_v2 so every newly-seeded field is actually
  // visible/editable to the groups that already manage employee fields — the
  // normal cascade only runs when an admin re-saves a permission group, which
  // is easy to forget in a dev/test DB. Grants View + Edit + Download (Copy
  // stays an explicit opt-in, matching applyModuleDefaultsToFields()).
  // No-op when field_permissions_v2 has no rows yet.
  await queryInterface.sequelize.query(`
    INSERT INTO field_permissions_v2
      (group_id, field_id, company_id, can_view, can_edit, can_copy, can_download, is_masked)
    SELECT g.group_id, df.id, g.company_id, 1, 1, 0, 1, 0
    FROM dynamic_fields df
    CROSS JOIN (SELECT DISTINCT group_id, company_id FROM field_permissions_v2) g
    WHERE df.form_id = ${FORM_ID}
      AND NOT EXISTS (
        SELECT 1 FROM field_permissions_v2 fp
        WHERE fp.field_id = df.id
          AND fp.group_id = g.group_id
          AND (fp.company_id <=> g.company_id)
      )
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const fieldKeys = FIELDS.map((f) => f.field_key);

  // remove the permission rows first so nothing is left dangling
  await queryInterface.sequelize.query(`
    DELETE fp FROM field_permissions_v2 fp
    JOIN dynamic_fields df ON df.id = fp.field_id
    WHERE df.form_id = ${FORM_ID}
      AND df.field_key IN (:keys)
  `, { replacements: { keys: fieldKeys } });

  await queryInterface.bulkDelete('dynamic_fields', {
    form_id: FORM_ID,
    field_key: fieldKeys,
  } as any);
}
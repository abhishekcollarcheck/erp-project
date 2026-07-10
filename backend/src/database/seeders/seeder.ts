import { sequelize } from "../../config/database";

import { Employee } from '../models/Employee';
import { Company } from '../models/Company';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { PERMISSIONS } from "../models/Permissions";
import { Permission } from "../models/RoleModels";
import { Role, RoleModulePermission } from '../models/RoleModels';
import { EmployeeRole, RoleTemplate, RoleTemplatePermission } from '../models/AuthModels';
import { logger } from '../../config/logger';
import { DynamicField, FormDefinition, HrModule } from "../models";


const COMPANY_ID = 1;

const TEMPLATE_DEFS = [
  { slug: 'super_admin', name: 'Super Admin', sort_order: 1 },
  { slug: 'hr_manager', name: 'HR Manager', sort_order: 2 },
  { slug: 'manager', name: 'Department Manager', sort_order: 3 },
  { slug: 'employee', name: 'Employee', sort_order: 4 },
] as const;

type TemplatePerm = { module: string; can_view: boolean; can_edit: boolean; can_delete: boolean; can_download: boolean; };

const TEMPLATE_PERMS: Record<string, TemplatePerm[]> = {
  super_admin: [
    { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'settings', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'companies', can_view: true, can_edit: true, can_delete: true, can_download: true, },
  ],
  hr_manager: [
    { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
  ],
  manager: [
    { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'settings', can_view: true, can_edit: true, can_delete: true, can_download: true, },
    { module: 'companies', can_view: true, can_edit: true, can_delete: true, can_download: true, },
  ],
  employee: [
    { module: 'employees', can_view: true, can_delete: false, can_edit: false, can_download: false },
  ],
};


export async function seedDatabase(): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    logger.info("🚀 Running database seed...");

    // ── 1. Company ───────────────────────────────────────────────────────────
    await Company.upsert({
      id: COMPANY_ID, name: 'Narula Exports', slug: 'narula-exports',
      country: 'India', currency: 'INR', timezone: 'Asia/Kolkata', employee_code_start: null, employee_code_end: null, employee_code_skip: '',
      is_active: true, onboarding_step: 5,
    });
    logger.info('✅ Company ready');

    // ── 2. Global role templates ─────────────────────────────────────────────
    for (const def of TEMPLATE_DEFS) {
      await RoleTemplate.findOrCreate({
        where: { slug: def.slug },
        defaults: { slug: def.slug, name: def.name, sort_order: def.sort_order, is_system: true },
      });
    }
    const allTemplates = await RoleTemplate.findAll();
    for (const tmpl of allTemplates) {
      for (const p of (TEMPLATE_PERMS[tmpl.slug] ?? [])) {
        await RoleTemplatePermission.findOrCreate({
          where: { template_id: tmpl.id, module: p.module },
          defaults: { template_id: tmpl.id, ...p },
        });
      }
    }
    logger.info('✅ Role templates + permissions seeded');

    // ── 3. Per-company roles + module permissions ────────────────────────────
    const templateMap = new Map(allTemplates.map(t => [t.slug, t]));
    for (const def of TEMPLATE_DEFS) {
      const tmpl = templateMap.get(def.slug)!;
      const [role] = await Role.findOrCreate({
        where: { company_id: COMPANY_ID, slug: def.slug },
        defaults: {
          company_id: COMPANY_ID,
          name: def.name,
          slug: def.slug,
          is_system: true,
          template_id: tmpl.id,  // ✓ now valid on updated Role model
        },
      });
      const tPerms = await RoleTemplatePermission.findAll({ where: { template_id: tmpl.id } });
      for (const tp of tPerms) {
        await RoleModulePermission.findOrCreate({
          where: { role_id: role.id, module: tp.module },
          defaults: {
            role_id: role.id, module: tp.module,
          },
        });
      }
    }
    logger.info('✅ Company roles + module permissions ready');

    // ── 4. Departments ───────────────────────────────────────────────────────
    const deptMap = new Map<string, number>();
    for (const name of ['Commercial', 'Accounts', 'Automation', 'HR', 'Graphics', 'Admin', 'Project', 'Service', 'IT', 'Estimation', 'Management', 'Purchase', 'Tender', 'Sales', 'Technical', 'Legal', 'Regulatory Affairs', 'Store', 'Ortho', 'Maintenance', 'Design', 'Quality', 'Credit Control', 'International Marketing', 'Field', 'Projects', 'Facility Management (Operations)', 'PTS and Project', 'CSSD', 'Quality Control', 'Marketing', 'Operations']) {
      // const code = name.split(' ').map((w: string) => w[0]).join('').toUpperCase();
      const [d] = await Department.findOrCreate({
        where: { name },
        defaults: { name, },
      });
      deptMap.set(name, d.id);
    }

    // ── 5. Designations ──────────────────────────────────────────────────────
    const desigMap = new Map<string, number>();
    for (const name of ['Accountant', 'Advisor', 'Asst. General Manager', 'Asst. Manager', 'CMD', 'Computer Operator', 'Cook', 'Coordinator', 'Deputy Manager', 'Director', 'Driver', 'Electrician', 'Engineer', 'Executive', 'Executive Assistant', 'Field Assistant', 'Fitter', 'General Manager', 'Guard', 'Helper', 'Jr. Accountant', 'Jr. Executive', 'Jr. Operator', 'Jr. Technician', 'Manager', 'MIS Executive', 'Office Attendant', 'Operator', 'Plumber', 'Receptionist', 'Sales Officer', 'Senior Deputy Manager', 'Site Engineer', 'Sr. Computer Operator', 'Sr. Coordinator', 'Sr. Engineer', 'Sr. Executive', 'Sr. Field Assistant', 'Sr. Fitter', 'Sr. Helper', 'Sr. Manager', 'Sr. MIS Executive', 'Sr. Sales Officer', 'Supervisor', 'Technician', 'Data Entry Operator', 'Security Guard', 'Field Executive', 'Site Supervisor', 'Housekeeper', 'Jr. Engineer', 'Semi Fitter', 'Sr. Developer', 'Vice President', 'Social Media Video Editor', 'Quality Assurance Engineer', 'Recruiter', 'Sr. Site Engineer', 'Jr. Site Engineer', 'Site Manager', 'Flutter Developer', 'Incharge', 'Sr. Recruiter', 'Jr. Recruiter', 'PSO', 'Social Media Manager', 'Fullstack Developer', 'Software Engineer', 'Dispatch Clerk Cum Engineer', 'Jr. Fitter', 'Deputy General Manager', 'Jr. Electrician', 'Social Media Executive', 'Sr. Data Analyst', 'Sr. Supervisor', 'Sr. Software Engineer']) {
      const [d] = await Designation.findOrCreate({
        where: { name },
        defaults: { name },
      });
      desigMap.set(name, d.id);
    }
    logger.info('✅ Departments + designations ready');

    // ── 6. Super admin employee ───────────────────────────────────────────────
    const [superAdminEmp, saCreated] = await Employee.findOrCreate({
      where: { email: 'superadmin@ung.com' },
      defaults: {
        company_id: COMPANY_ID, employee_code: 'EMP000',
        first_name: 'Super', last_name: 'Admin',
        email: 'superadmin@ung.com', phone: '+918130988753',
        department_id: 6,
        designation_id: 3,
        employment_type: 'Permanent',
        status: 'Active',
        portal_access: true, is_super_admin: true,
      },
    });
    if (!saCreated) {
      await superAdminEmp.update({ is_super_admin: true, portal_access: true });
    }
    const saRole = await Role.findOne({ where: { company_id: COMPANY_ID, slug: 'super_admin' } });
    if (saRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: superAdminEmp.id, role_id: saRole.id },
        defaults: { employee_id: superAdminEmp.id, role_id: saRole.id, company_id: COMPANY_ID },
      });
    }

    // ── 7. HR admin employee ─────────────────────────────────────────────────
    const [hrEmp] = await Employee.findOrCreate({
      where: { email: 'admin@ung.com' },
      defaults: {
        company_id: COMPANY_ID, employee_code: 'EMP001',
        first_name: 'Admin', last_name: 'User',
        email: 'admin@ung.com', phone: '+918826693968',
        department_id: 6,
        designation_id: 3,
        employment_type: 'Permanent',
        status: 'Active',
        portal_access: true, is_super_admin: false,
      },
    });
    const hrRole = await Role.findOne({ where: { company_id: COMPANY_ID, slug: 'hr_manager' } });
    if (hrRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: hrEmp.id, role_id: hrRole.id },
        defaults: { employee_id: hrEmp.id, role_id: hrRole.id, company_id: COMPANY_ID },
      });
    }

    type SeedField = { field_key: string; label: string; field_type: string };

    async function seedFormField(formId: number, section: string, fields: SeedField[], startOrder: number) {
      for (const [idx, f] of fields.entries()) {
        await DynamicField.findOrCreate({
          where: { form_id: formId, field_key: f.field_key },   // ← no company_id in the lookup key
          defaults: {
            form_id: formId, section,
            field_type: f.field_type as any, label: f.label, field_key: f.field_key,
            is_required: false, is_readonly: false, is_hidden: false, is_unique: false,
            is_active: true, sort_order: startOrder + idx,
          },
        });
      }
    }

    async function seedAllEmployeeFieldSections() {
      // Shared module — no company_id, matches the "forms are common for all companies" decision
      const [mod] = await HrModule.findOrCreate({
        where: { slug: 'employee' },
        defaults: { name: 'Employee', slug: 'employee', icon: '👤', description: 'Employee records and profile management', sort_order: 1, is_active: true, is_system: true },
      });

      // ONE shared form for the whole wizard — matches the already-consolidated form_id 3
      const [form] = await FormDefinition.findOrCreate({
        where: { slug: 'employee_onboarding' },
        defaults: { module_id: mod.id, name: 'Employee Onboarding', slug: 'employee_onboarding', description: 'Full employee onboarding wizard', sort_order: 1, is_active: true, is_system: true },
      });

      const sections: { section: string; fields: SeedField[] }[] = [
        {
          section: 'Core Info',
          fields: [
            { field_key: 'employee_code', label: 'Employee Code', field_type: 'text' },
            { field_key: 'reference_code', label: 'Reference Code', field_type: 'text' },
            { field_key: 'company_id', label: 'Company', field_type: 'text' },
            { field_key: 'first_name', label: 'First Name', field_type: 'text' },
            { field_key: 'middle_name', label: 'Middle Name', field_type: 'text' },
            { field_key: 'last_name', label: 'Last Name', field_type: 'text' },
            { field_key: 'status', label: 'Status', field_type: 'select' },
            { field_key: 'employment_type', label: 'Employment Type', field_type: 'select' },
            { field_key: 'email', label: 'Email', field_type: 'text' },
            { field_key: 'phone', label: 'Phone', field_type: 'text' },
            { field_key: 'department_id', label: 'Department', field_type: 'select' },
            { field_key: 'sub_department_id', label: 'Sub Department', field_type: 'select' },
            { field_key: 'designation_id', label: 'Designation', field_type: 'select' },
            { field_key: 'sub_designation', label: 'Sub Designation', field_type: 'text' },
            { field_key: 'l1_manager_id', label: 'L1 Manager', field_type: 'select' },
            { field_key: 'l2_manager_id', label: 'L2 Manager', field_type: 'select' },
            { field_key: 'actual_doj', label: 'Actual Date of Joining', field_type: 'date' },
            { field_key: 'current_doj', label: 'Current Date of Joining', field_type: 'date' },
            { field_key: 'working_site', label: 'Working Site', field_type: 'text' },
            { field_key: 'working_city', label: 'Working City', field_type: 'text' },
            { field_key: 'working_state_country', label: 'Working State/Country', field_type: 'text' },
            { field_key: 'pay_register_location', label: 'Pay Register Location', field_type: 'text' },
            { field_key: 'shift_id', label: 'Shift', field_type: 'select' },
            { field_key: 'saturday_off', label: 'Saturday Off', field_type: 'text' },
            { field_key: 'grace_minutes', label: 'Grace Minutes', field_type: 'number' },
            { field_key: 'avatar_url', label: 'Avatar', field_type: 'text' },
          ],
        },
        {
          section: 'Commitment & Probation',
          fields: [
            { field_key: 'commitment', label: 'Commitment', field_type: 'checkbox' },
            { field_key: 'commitment_term', label: 'Commitment Term', field_type: 'select' },
            { field_key: 'commitment_entered_on', label: 'Commitment Entered On', field_type: 'date' },
            { field_key: 'commitment_end_date', label: 'Commitment End Date', field_type: 'date' },
            { field_key: 'commitment_status', label: 'Commitment Status', field_type: 'text' },
            { field_key: 'on_probation', label: 'On Probation', field_type: 'checkbox' },
            { field_key: 'probation_period', label: 'Probation Period', field_type: 'text' },
            { field_key: 'probation_end_date', label: 'Probation End Date', field_type: 'date' },
            { field_key: 'probation_status', label: 'Probation Status', field_type: 'text' },
            { field_key: 'probation_extended_period', label: 'Probation Extended Period', field_type: 'text' },
            { field_key: 'probation_final_status', label: 'Probation Final Status', field_type: 'text' },
            { field_key: 'confirmation_status', label: 'Confirmation Status', field_type: 'select' },
            { field_key: 'confirmed_on', label: 'Confirmed On', field_type: 'date' },
          ],
        },
        {
          section: 'Schemes (PF/ESIC/Mediclaim/RD)',
          fields: [
            { field_key: 'pf_status', label: 'PF Status', field_type: 'checkbox' },
            { field_key: 'uan_number', label: 'UAN Number', field_type: 'text' },
            { field_key: 'epfo_member_id', label: 'EPFO Member ID', field_type: 'text' },
            { field_key: 'pf_contribution_pct', label: 'PF Contribution %', field_type: 'number' },
            { field_key: 'pf_employer_from', label: 'PF Employer From', field_type: 'select' },
            { field_key: 'esic_status', label: 'ESIC Status', field_type: 'checkbox' },
            { field_key: 'esic_number', label: 'ESIC Number', field_type: 'text' },
            { field_key: 'mediclaim_status', label: 'Mediclaim Status', field_type: 'select' },
            { field_key: 'mediclaim_number', label: 'Mediclaim Number', field_type: 'text' },
            { field_key: 'mediclaim_amount', label: 'Mediclaim Amount', field_type: 'number' },
            { field_key: 'rd_scheme', label: 'RD Scheme', field_type: 'checkbox' },
            { field_key: 'rd_term', label: 'RD Term', field_type: 'select' },
            { field_key: 'rd_opening_date', label: 'RD Opening Date', field_type: 'date' },
            { field_key: 'rd_account_number', label: 'RD Account Number', field_type: 'text' },
            { field_key: 'rd_deduction_from', label: 'RD Deduction From', field_type: 'select' },
            { field_key: 'rd_amount_employee', label: 'RD Amount (Employee)', field_type: 'number' },
            { field_key: 'rd_amount_employer', label: 'RD Amount (Employer)', field_type: 'number' },
            { field_key: 'rd_maturity_date', label: 'RD Maturity Date', field_type: 'date' },
            { field_key: 'rd_maturity_amount', label: 'RD Maturity Amount', field_type: 'number' },
            { field_key: 'rd_status', label: 'RD Status', field_type: 'text' },
          ],
        },
        {
          section: 'Personal',
          fields: [
            { field_key: 'personal_email', label: 'Personal Email', field_type: 'text' },
            { field_key: 'personal_mobile', label: 'Personal Mobile', field_type: 'text' },
            { field_key: 'date_of_birth', label: 'Date of Birth', field_type: 'date' },
            { field_key: 'gender', label: 'Gender', field_type: 'select' },
            { field_key: 'shirt_size', label: 'Shirt Size', field_type: 'select' },
            { field_key: 'tshirt_size', label: 'T-Shirt Size', field_type: 'select' },
            { field_key: 'nationality', label: 'Nationality', field_type: 'text' },
            { field_key: 'religion', label: 'Religion', field_type: 'text' },
            { field_key: 'blood_group', label: 'Blood Group', field_type: 'select' },
            { field_key: 'marital_status', label: 'Marital Status', field_type: 'select' },
            { field_key: 'marriage_date', label: 'Marriage Date', field_type: 'date' },
            { field_key: 'spouse_name', label: 'Spouse Name', field_type: 'text' },
            { field_key: 'spouse_dob', label: 'Spouse DOB', field_type: 'date' },
            { field_key: 'child1_name', label: 'Child 1 Name', field_type: 'text' },
            { field_key: 'child1_dob', label: 'Child 1 DOB', field_type: 'date' },
            { field_key: 'child2_name', label: 'Child 2 Name', field_type: 'text' },
            { field_key: 'child2_dob', label: 'Child 2 DOB', field_type: 'date' },
            { field_key: 'child3_name', label: 'Child 3 Name', field_type: 'text' },
            { field_key: 'child3_dob', label: 'Child 3 DOB', field_type: 'date' },
          ],
        },
        {
          section: 'Family',
          fields: [
            { field_key: 'father_salutation', label: 'Father Salutation', field_type: 'text' },
            { field_key: 'father_name', label: 'Father Name', field_type: 'text' },
            { field_key: 'father_age_dob', label: 'Father Age/DOB', field_type: 'text' },
            { field_key: 'father_occupation', label: 'Father Occupation', field_type: 'text' },
            { field_key: 'father_status', label: 'Father Status', field_type: 'text' },
            { field_key: 'mother_salutation', label: 'Mother Salutation', field_type: 'text' },
            { field_key: 'mother_name', label: 'Mother Name', field_type: 'text' },
            { field_key: 'mother_age_dob', label: 'Mother Age/DOB', field_type: 'text' },
            { field_key: 'mother_occupation', label: 'Mother Occupation', field_type: 'text' },
          ],
        },
        {
          section: 'Address',
          fields: [
            { field_key: 'address_type', label: 'Address Type', field_type: 'select' },
            { field_key: 'house_type', label: 'House Type', field_type: 'select' },
            { field_key: 'house_no', label: 'House No', field_type: 'text' },
            { field_key: 'area', label: 'Area', field_type: 'text' },
            { field_key: 'district', label: 'District', field_type: 'text' },
            { field_key: 'city', label: 'City', field_type: 'text' },
            { field_key: 'state', label: 'State', field_type: 'text' },
            { field_key: 'country', label: 'Country', field_type: 'text' },
            { field_key: 'pincode', label: 'Pincode', field_type: 'text' },
            { field_key: 'is_same_as_present', label: 'Same as Present', field_type: 'checkbox' },
          ],
        },
        {
          section: 'Statutory',
          fields: [
            { field_key: 'passport_number', label: 'Passport Number', field_type: 'text' },
            { field_key: 'passport_expiry', label: 'Passport Expiry', field_type: 'date' },
            { field_key: 'yellow_fever', label: 'Yellow Fever', field_type: 'checkbox' },
            { field_key: 'yellow_fever_date', label: 'Yellow Fever Date', field_type: 'date' },
            { field_key: 'driving_license_number', label: 'Driving License Number', field_type: 'text' },
            { field_key: 'driving_license_expiry', label: 'Driving License Expiry', field_type: 'date' },
            { field_key: 'aadhaar_number', label: 'Aadhaar Number', field_type: 'text' },
            { field_key: 'aadhaar_address', label: 'Aadhaar Address', field_type: 'text' },
            { field_key: 'pan_number', label: 'PAN Number', field_type: 'text' },
            { field_key: 'pan_full_name', label: 'PAN Full Name', field_type: 'text' },
            { field_key: 'pan_dob', label: 'PAN DOB', field_type: 'date' },
            { field_key: 'pan_parent_spouse_name', label: 'PAN Parent/Spouse Name', field_type: 'text' },
          ],
        },
        {
          section: 'Bank Details',
          fields: [
            { field_key: 'bank_type', label: 'Bank Type', field_type: 'select' },
            { field_key: 'bank_name', label: 'Bank Name', field_type: 'text' },
            { field_key: 'account_number', label: 'Account Number', field_type: 'text' },
            { field_key: 'ifsc_code', label: 'IFSC Code', field_type: 'text' },
            { field_key: 'branch_name', label: 'Branch Name', field_type: 'text' },
          ],
        },
        {
          section: 'Salary',
          fields: [
            { field_key: 'salary_type', label: 'Salary Type', field_type: 'select' },
            { field_key: 'salary_mode', label: 'Salary Mode', field_type: 'select' },
            { field_key: 'basic', label: 'Basic', field_type: 'number' },
            { field_key: 'hra', label: 'HRA', field_type: 'number' },
            { field_key: 'allowance1', label: 'Allowance 1', field_type: 'number' },
            { field_key: 'gross_salary_pm', label: 'Gross Salary (PM)', field_type: 'number' },
            { field_key: 'amdb_pm', label: 'AMDB (PM)', field_type: 'number' },
            { field_key: 'total_earning_pm', label: 'Total Earning (PM)', field_type: 'number' },
            { field_key: 'effective_from', label: 'Effective From', field_type: 'date' },
          ],
        },
        {
          section: 'Asset Deduction',
          fields: [
            { field_key: 'asset_deduction_applicable', label: 'Applicable', field_type: 'checkbox' },
            { field_key: 'security_amount', label: 'Security Amount', field_type: 'number' },
            { field_key: 'deduction_months', label: 'Deduction Months', field_type: 'text' },
            { field_key: 'deduction_from', label: 'Deduction From', field_type: 'select' },
            { field_key: 'monthly_deduction', label: 'Monthly Deduction', field_type: 'number' },
            { field_key: 'last_installment', label: 'Last Installment', field_type: 'number' },
          ],
        },
        {
          section: 'Experience',
          fields: [
            { field_key: 'is_experienced', label: 'Is Experienced', field_type: 'checkbox' },
            { field_key: 'last_company_name', label: 'Last Company Name', field_type: 'text' },
            { field_key: 'last_designation', label: 'Last Designation', field_type: 'text' },
            { field_key: 'last_working_day', label: 'Last Working Day', field_type: 'date' },
            { field_key: 'exp_contact_name', label: 'Contact Name', field_type: 'text' },
            { field_key: 'exp_contact_number', label: 'Contact Number', field_type: 'text' },
            { field_key: 'exp_contact_designation', label: 'Contact Designation', field_type: 'text' },
            { field_key: 'last_inhand_salary', label: 'Last In-hand Salary', field_type: 'number' },
          ],
        },
        {
          section: 'Education',
          fields: [
            { field_key: 'highest_education', label: 'Highest Education', field_type: 'text' },
            { field_key: 'education_stream', label: 'Education Stream', field_type: 'text' },
            { field_key: 'education_mode', label: 'Education Mode', field_type: 'select' },
            { field_key: 'institute_name', label: 'Institute Name', field_type: 'text' },
            { field_key: 'passing_year', label: 'Passing Year', field_type: 'number' },
            { field_key: 'education_marks', label: 'Education Marks', field_type: 'text' },
          ],
        },
        {
          section: 'Onboarding Docs',
          fields: [
            { field_key: 'offer_letter', label: 'Offer Letter', field_type: 'checkbox' },
            { field_key: 'address_verification', label: 'Address Verification', field_type: 'checkbox' },
            { field_key: 'service_agreement', label: 'Service Agreement', field_type: 'checkbox' },
            { field_key: 'indemnity_bond', label: 'Indemnity Bond', field_type: 'checkbox' },
            { field_key: 'asset_deduction_letter', label: 'Asset Deduction Letter', field_type: 'checkbox' },
            { field_key: 'account_opening_letter', label: 'Account Opening Letter', field_type: 'checkbox' },
            { field_key: 'nda', label: 'NDA', field_type: 'checkbox' },
          ],
        },
        {
          section: 'Transfers',
          fields: [
            { field_key: 'transfer_order', label: 'Transfer Order', field_type: 'number' },
            { field_key: 'transferred_on', label: 'Transferred On', field_type: 'date' },
            { field_key: 'new_company', label: 'New Company', field_type: 'text' },
            { field_key: 'new_joining_date', label: 'New Joining Date', field_type: 'date' },
            { field_key: 'new_location', label: 'New Location', field_type: 'text' },
            { field_key: 'new_department', label: 'New Department', field_type: 'text' },
            { field_key: 'new_job_title', label: 'New Job Title', field_type: 'text' },
            { field_key: 'old_company', label: 'Old Company', field_type: 'text' },
            { field_key: 'exit_date', label: 'Exit Date', field_type: 'date' },
            { field_key: 'old_location', label: 'Old Location', field_type: 'text' },
            { field_key: 'old_department', label: 'Old Department', field_type: 'text' },
            { field_key: 'old_job_title', label: 'Old Job Title', field_type: 'text' },
            { field_key: 'old_emp_code', label: 'Old Employee Code', field_type: 'text' },
          ],
        },
        {
          section: 'Exit',
          fields: [
            { field_key: 'resignation_submitted', label: 'Resignation Submitted', field_type: 'checkbox' },
            { field_key: 'resignation_date', label: 'Resignation Date', field_type: 'date' },
            { field_key: 'notice_period', label: 'Notice Period', field_type: 'text' },
            { field_key: 'last_working_day', label: 'Last Working Day', field_type: 'date' },
            { field_key: 'exit_formalities_done', label: 'Exit Formalities Done', field_type: 'checkbox' },
            { field_key: 'exit_status', label: 'Exit Status', field_type: 'text' },
            { field_key: 'exit_remarks', label: 'Exit Remarks', field_type: 'text' },
            { field_key: 'verified', label: 'Verified', field_type: 'checkbox' },
            { field_key: 'verified_by', label: 'Verified By', field_type: 'text' },
            { field_key: 'verification_remarks', label: 'Verification Remarks', field_type: 'text' },
          ],
        },
      ];

      let order = 0;
      for (const s of sections) {
        await seedFormField(form.id, s.section, s.fields, order);
        order += s.fields.length;
      }

      return { moduleId: mod.id, formId: form.id };
    }

    const { moduleId, formId } = await seedAllEmployeeFieldSections();
    logger.info(`Employee module id: ${moduleId}, form id: ${formId}`);

    await Permission.bulkCreate(PERMISSIONS, {
      ignoreDuplicates: true,
      transaction,
    });


    await transaction.commit();

    logger.info("🎉 Database seed completed successfully");
    logger.info("📧 Login: admin@ung.com");
    logger.info("🔑 Password: 123456");

  } catch (error) {
    await transaction.rollback();

    console.error(error);

    logger.error("❌ Seed failed:", error);

    throw error;
  }
}

// =========================================================
// RUN DIRECTLY
// =========================================================

if (require.main === module) {
  sequelize
    .authenticate()
    .then(async () => {
      logger.info("✅ Database Connected");

      // IMPORTANT
      // sync tables before seed
      await sequelize.sync(
        { alter: true }
      );

      await seedDatabase();
    })
    .then(() => {
      logger.info("🌱 Seeder finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);

      logger.error("Seeder execution failed:", error);

      process.exit(1);
    });
}
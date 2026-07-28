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
import { seedShifts } from "./shift-seed-data";
import { seedHolidays } from "./holiday-seed-data";
import { seedLeaveTypes } from "./seed-leave-types";


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

// ✅ HELPER: Batch create form fields
type SeedField = { field_key: string; label: string; field_type: string };

async function seedFormField(
  formId: number,
  section: string,
  fields: SeedField[],
  startOrder: number,
  transaction: any
): Promise<void> {
  try {
    // Check which fields already exist
    const existingFields = await DynamicField.findAll({
      where: { 
        form_id: formId, 
        field_key: fields.map(f => f.field_key)
      },
      transaction,
    });
    const existingFieldKeys = new Set(existingFields.map(f => f.field_key));

    // Build batch create data for missing fields
    const fieldsToCreate = fields
      .filter(f => !existingFieldKeys.has(f.field_key))
      .map((f, idx) => ({
        form_id: formId,
        section,
        field_type: f.field_type as any,
        label: f.label,
        field_key: f.field_key,
        is_required: false,
        is_readonly: false,
        is_hidden: false,
        is_unique: false,
        is_active: true,
        sort_order: startOrder + idx,
      }));

    // Batch create all fields at once
    if (fieldsToCreate.length > 0) {
      await DynamicField.bulkCreate(fieldsToCreate, {
        ignoreDuplicates: true,
        transaction,
      });
    }
  } catch (error) {
    logger.error(`Error seeding form fields for section "${section}":`, error);
    throw error;
  }
}

// ✅ HELPER: Seed employee form sections
async function seedAllEmployeeFieldSections(transaction: any): Promise<{ moduleId: number; formId: number }> {
  try {
    // Shared module — no company_id
    const [mod] = await HrModule.findOrCreate({
      where: { slug: 'employee' },
      defaults: { 
        name: 'Employee', 
        slug: 'employee', 
        icon: '👤', 
        description: 'Employee records and profile management', 
        sort_order: 1, 
        is_active: true, 
        is_system: true 
      },
      transaction,
    });

    // ONE shared form for the whole wizard
    const [form] = await FormDefinition.findOrCreate({
      where: { slug: 'employee_onboarding' },
      defaults: { 
        module_id: mod.id, 
        name: 'Employee Onboarding', 
        slug: 'employee_onboarding', 
        description: 'Full employee onboarding wizard', 
        sort_order: 1, 
        is_active: true, 
        is_system: true 
      },
      transaction,
    });

    const sections: { section: string; fields: SeedField[] }[] = [
      {
        section: 'Basic Info',
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
          { field_key: 'avatar_url', label: 'Avatar', field_type: 'text' },
        ],
      },
      {
        section: 'Employment Details',
        fields: [
          { field_key: 'working_site', label: 'Working Site', field_type: 'text' },
          { field_key: 'working_city', label: 'Working City', field_type: 'text' },
          { field_key: 'working_state', label: 'Working State', field_type: 'text' },
          { field_key: 'joining_date', label: 'Joining Date', field_type: 'date' },
          { field_key: 'probation_end_date', label: 'Probation End Date', field_type: 'date' },
          { field_key: 'confirmation_status', label: 'Confirmation Status', field_type: 'select' },
          { field_key: 'reporting_manager', label: 'Reporting Manager', field_type: 'text' },
          { field_key: 'supervisor', label: 'Supervisor', field_type: 'text' },
          { field_key: 'shift_id', label: 'Shift', field_type: 'select' },
          { field_key: 'shift_type', label: 'Shift Type', field_type: 'select' },
        ],
      },
      {
        section: 'Personal Details',
        fields: [
          { field_key: 'date_of_birth', label: 'Date of Birth', field_type: 'date' },
          { field_key: 'gender', label: 'Gender', field_type: 'select' },
          { field_key: 'blood_group', label: 'Blood Group', field_type: 'select' },
          { field_key: 'marital_status', label: 'Marital Status', field_type: 'select' },
          { field_key: 'nationality', label: 'Nationality', field_type: 'text' },
          { field_key: 'religion', label: 'Religion', field_type: 'text' },
          { field_key: 'mother_tongue', label: 'Mother Tongue', field_type: 'text' },
          { field_key: 'passport_number', label: 'Passport Number', field_type: 'text' },
          { field_key: 'aadhaar_number', label: 'Aadhaar Number', field_type: 'text' },
          { field_key: 'pan_number', label: 'PAN Number', field_type: 'text' },
        ],
      },
      {
        section: 'Contact & Address',
        fields: [
          { field_key: 'permanent_address', label: 'Permanent Address', field_type: 'text' },
          { field_key: 'permanent_city', label: 'Permanent City', field_type: 'text' },
          { field_key: 'permanent_state', label: 'Permanent State', field_type: 'text' },
          { field_key: 'permanent_zip_code', label: 'Permanent Zip Code', field_type: 'text' },
          { field_key: 'temporary_address', label: 'Temporary Address', field_type: 'text' },
          { field_key: 'temporary_city', label: 'Temporary City', field_type: 'text' },
          { field_key: 'temporary_state', label: 'Temporary State', field_type: 'text' },
          { field_key: 'temporary_zip_code', label: 'Temporary Zip Code', field_type: 'text' },
        ],
      },
      {
        section: 'Previous Experience',
        fields: [
          { field_key: 'prev_company_name', label: 'Previous Company Name', field_type: 'text' },
          { field_key: 'prev_job_title', label: 'Previous Job Title', field_type: 'text' },
          { field_key: 'prev_from_date', label: 'From Date', field_type: 'date' },
          { field_key: 'prev_to_date', label: 'To Date', field_type: 'date' },
          { field_key: 'exp_years', label: 'Years of Experience', field_type: 'number' },
          { field_key: 'exp_months', label: 'Months of Experience', field_type: 'number' },
          { field_key: 'exp_contact_person', label: 'Contact Person', field_type: 'text' },
          { field_key: 'exp_contact_email', label: 'Contact Email', field_type: 'text' },
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
      await seedFormField(form.id, s.section, s.fields, order, transaction);
      order += s.fields.length;
    }

    return { moduleId: mod.id, formId: form.id };
  } catch (error) {
    logger.error("Error seeding employee field sections:", error);
    throw error;
  }
}

export async function seedDatabase(): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    logger.info("🚀 Running database seed...");

    // ── 1. Company ───────────────────────────────────────────────────────────
    await Company.upsert({
      id: COMPANY_ID, 
      name: 'Narula Exports', 
      slug: 'narula-exports',
      country: 'India', 
      currency: 'INR', 
      timezone: 'Asia/Kolkata', 
      employee_code_start: null, 
      employee_code_end: null, 
      employee_code_skip: '',
      is_active: true, 
      onboarding_step: 5,
    }, { transaction });
    logger.info('✅ Company ready');

    // ── 2. Global role templates + permissions ────────────────────────────
    const allTemplates = await RoleTemplate.findAll({ transaction });
    const templateMap = new Map(allTemplates.map(t => [t.slug, t]));
    
    const templatesToCreate = TEMPLATE_DEFS
      .filter(def => !templateMap.has(def.slug))
      .map(def => ({ slug: def.slug, name: def.name, sort_order: def.sort_order, is_system: true }));
    
    if (templatesToCreate.length > 0) {
      const created = await RoleTemplate.bulkCreate(templatesToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
      created.forEach(t => templateMap.set(t.slug, t));
    }

    const existingPerms = await RoleTemplatePermission.findAll({ transaction });
    const existingPermSet = new Set(
      existingPerms.map(p => `${p.template_id}:${p.module}`)
    );

    const permsToCreate: any[] = [];
    for (const def of TEMPLATE_DEFS) {
      const tmpl = templateMap.get(def.slug)!;
      for (const p of (TEMPLATE_PERMS[def.slug] ?? [])) {
        const key = `${tmpl.id}:${p.module}`;
        if (!existingPermSet.has(key)) {
          permsToCreate.push({ template_id: tmpl.id, ...p });
        }
      }
    }
    
    if (permsToCreate.length > 0) {
      await RoleTemplatePermission.bulkCreate(permsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
    }
    logger.info('✅ Role templates + permissions seeded');

    // ── 3. Per-company roles + module permissions ────────────────────────
    const existingRoles = await Role.findAll({ 
      where: { company_id: COMPANY_ID },
      transaction 
    });
    const roleMap = new Map(existingRoles.map(r => [r.slug, r]));

    const rolesToCreate = TEMPLATE_DEFS
      .filter(def => !roleMap.has(def.slug))
      .map(def => ({
        company_id: COMPANY_ID,
        name: def.name,
        slug: def.slug,
        is_system: true,
        template_id: templateMap.get(def.slug)!.id,
      }));
    
    if (rolesToCreate.length > 0) {
      const created = await Role.bulkCreate(rolesToCreate, { transaction });
      created.forEach(r => roleMap.set(r.slug, r));
    }

    const allTemplatePerms = await RoleTemplatePermission.findAll({ 
      where: { template_id: Array.from(templateMap.values()).map(t => t.id) },
      transaction 
    });
    
    const permsByTemplate = new Map<number, any[]>();
    for (const tp of allTemplatePerms) {
      if (!permsByTemplate.has(tp.template_id)) {
        permsByTemplate.set(tp.template_id, []);
      }
      permsByTemplate.get(tp.template_id)!.push(tp);
    }

    const existingRolePerms = await RoleModulePermission.findAll({ 
      where: { role_id: Array.from(roleMap.values()).map(r => r.id) },
      transaction 
    });
    const rolePermSet = new Set(
      existingRolePerms.map(rp => `${rp.role_id}:${rp.module}`)
    );

    const rolePermsToCreate: any[] = [];
    for (const def of TEMPLATE_DEFS) {
      const tmpl = templateMap.get(def.slug)!;
      const role = roleMap.get(def.slug)!;
      const tPerms = permsByTemplate.get(tmpl.id) || [];
      
      for (const tp of tPerms) {
        const key = `${role.id}:${tp.module}`;
        if (!rolePermSet.has(key)) {
          rolePermsToCreate.push({
            role_id: role.id,
            module: tp.module,
          });
        }
      }
    }
    
    if (rolePermsToCreate.length > 0) {
      await RoleModulePermission.bulkCreate(rolePermsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
    }
    logger.info('✅ Company roles + module permissions ready');

    // ── 4. Departments ───────────────────────────────────────────────────
    const deptNames = ['Commercial', 'Accounts', 'Automation', 'HR', 'Graphics', 'Admin', 'Project', 'Service', 'IT', 'Estimation', 'Management', 'Purchase', 'Tender', 'Sales', 'Technical', 'Legal', 'Regulatory Affairs', 'Store', 'Ortho', 'Maintenance', 'Design', 'Quality', 'Credit Control', 'International Marketing', 'Field', 'Projects', 'Facility Management (Operations)', 'PTS and Project', 'CSSD', 'Quality Control', 'Marketing', 'Operations'];
    
    const existingDepts = await Department.findAll({ 
      where: { name: deptNames },
      transaction 
    });
    const existingDeptNames = new Set(existingDepts.map(d => d.name));
    
    const deptsToCreate = deptNames
      .filter(name => !existingDeptNames.has(name))
      .map(name => ({ name }));
    
    const createdDepts = existingDepts;
    if (deptsToCreate.length > 0) {
      const newDepts = await Department.bulkCreate(deptsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
      createdDepts.push(...newDepts);
    }
    
    const deptMap = new Map<string, number>();
    for (const dept of createdDepts) {
      if (deptNames.includes(dept.name)) {
        deptMap.set(dept.name, dept.id);
      }
    }
    
    if (deptMap.size < deptNames.length) {
      const allDepts = await Department.findAll({ 
        where: { name: deptNames },
        transaction 
      });
      for (const dept of allDepts) {
        deptMap.set(dept.name, dept.id);
      }
    }

    // ── 5. Designations ──────────────────────────────────────────────────
    const desigNames = ['Accountant', 'Advisor', 'Asst. General Manager', 'Asst. Manager', 'CMD', 'Computer Operator', 'Cook', 'Coordinator', 'Deputy Manager', 'Director', 'Driver', 'Electrician', 'Engineer', 'Executive', 'Executive Assistant', 'Field Assistant', 'Fitter', 'General Manager', 'Guard', 'Helper', 'Jr. Accountant', 'Jr. Executive', 'Jr. Operator', 'Jr. Technician', 'Manager', 'MIS Executive', 'Office Attendant', 'Operator', 'Plumber', 'Receptionist', 'Sales Officer', 'Senior Deputy Manager', 'Site Engineer', 'Sr. Computer Operator', 'Sr. Coordinator', 'Sr. Engineer', 'Sr. Executive', 'Sr. Field Assistant', 'Sr. Fitter', 'Sr. Helper', 'Sr. Manager', 'Sr. MIS Executive', 'Sr. Sales Officer', 'Supervisor', 'Technician', 'Data Entry Operator', 'Security Guard', 'Field Executive', 'Site Supervisor', 'Housekeeper', 'Jr. Engineer', 'Semi Fitter', 'Sr. Developer', 'Vice President', 'Social Media Video Editor', 'Quality Assurance Engineer', 'Recruiter', 'Sr. Site Engineer', 'Jr. Site Engineer', 'Site Manager', 'Flutter Developer', 'Incharge', 'Sr. Recruiter', 'Jr. Recruiter', 'PSO', 'Social Media Manager', 'Fullstack Developer', 'Software Engineer', 'Dispatch Clerk Cum Engineer', 'Jr. Fitter', 'Deputy General Manager', 'Jr. Electrician', 'Social Media Executive', 'Sr. Data Analyst', 'Sr. Supervisor', 'Sr. Software Engineer'];
    
    const existingDesigs = await Designation.findAll({ 
      where: { name: desigNames },
      transaction 
    });
    const existingDesigNames = new Set(existingDesigs.map(d => d.name));
    
    const desigsToCreate = desigNames
      .filter(name => !existingDesigNames.has(name))
      .map(name => ({ name }));
    
    const createdDesigs = existingDesigs;
    if (desigsToCreate.length > 0) {
      const newDesigs = await Designation.bulkCreate(desigsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
      createdDesigs.push(...newDesigs);
    }
    
    const desigMap = new Map<string, number>();
    for (const desig of createdDesigs) {
      if (desigNames.includes(desig.name)) {
        desigMap.set(desig.name, desig.id);
      }
    }
    
    if (desigMap.size < desigNames.length) {
      const allDesigs = await Designation.findAll({ 
        where: { name: desigNames },
        transaction 
      });
      for (const desig of allDesigs) {
        desigMap.set(desig.name, desig.id);
      }
    }
    
    logger.info('✅ Departments + designations ready');

    // ── 5b. Shifts ──────────────────────────────────────────────────────
    // ✅ Shifts MUST be seeded BEFORE employees
    await seedShifts(transaction);

    // ── 5c. Holidays ─────────────────────────────────────────────────────
    await seedHolidays(transaction);

    // ── 5d. Leave Types ──────────────────────────────────────────────────
    await seedLeaveTypes(transaction);

    // ── 6. Super admin employee ──────────────────────────────────────────
    const [superAdminEmp, saCreated] = await Employee.findOrCreate({
      where: { email: 'superadmin@ung.com' },
      defaults: {
        company_id: COMPANY_ID, 
        employee_code: 'EMP000',
        first_name: 'Super', 
        last_name: 'Admin',
        email: 'superadmin@ung.com', 
        phone: '+918130988753',
        department_id: 6,
        designation_id: 3,
        employment_type: 'Permanent',
        status: 'Active',
        portal_access: true, 
        is_super_admin: true,
        shift_id: null,
      },
      transaction,
    });
    if (!saCreated) {
      await superAdminEmp.update({ is_super_admin: true, portal_access: true }, { transaction });
    }
    
    const saRole = roleMap.get('super_admin');
    if (saRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: superAdminEmp.id, role_id: saRole.id },
        defaults: { employee_id: superAdminEmp.id, role_id: saRole.id, company_id: COMPANY_ID },
        transaction,
      });
    }

    // ── 7. HR admin employee ─────────────────────────────────────────────
    const [hrEmp] = await Employee.findOrCreate({
      where: { email: 'admin@ung.com' },
      defaults: {
        company_id: COMPANY_ID, 
        employee_code: 'EMP001',
        first_name: 'Admin', 
        last_name: 'User',
        email: 'admin@ung.com', 
        phone: '+918826693968',
        department_id: 6,
        designation_id: 3,
        employment_type: 'Permanent',
        status: 'Active',
        portal_access: true, 
        is_super_admin: false,
        shift_id: null,
      },
      transaction,
    });
    
    const hrRole = roleMap.get('hr_manager');
    if (hrRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: hrEmp.id, role_id: hrRole.id },
        defaults: { employee_id: hrEmp.id, role_id: hrRole.id, company_id: COMPANY_ID },
        transaction,
      });
    }

    // ── 8. Employee form definitions ─────────────────────────────────────
    const { moduleId, formId } = await seedAllEmployeeFieldSections(transaction);
    logger.info(`✅ Employee module id: ${moduleId}, form id: ${formId}`);

    // ── 9. Permissions ───────────────────────────────────────────────────
    if (PERMISSIONS && PERMISSIONS.length > 0) {
      await Permission.bulkCreate(PERMISSIONS, {
        ignoreDuplicates: true,
        transaction,
      });
      logger.info(`✅ Permissions seeded (${PERMISSIONS.length} entries)`);
    }

    // ── Commit transaction ───────────────────────────────────────────────
    await transaction.commit();

    logger.info("🎉 Database seed completed successfully");
    logger.info("📧 Login: admin@ung.com");
    logger.info("🔑 Password: 123456");

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Seeder Error:", error);
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

      // ✅ CRITICAL FIX: Disable foreign key checks during sync
      // This allows sequelize.sync to work without FK constraint errors
      const dialect = sequelize.getDialect();
      
      if (dialect === 'mysql' || dialect === 'mariadb') {
        logger.info("🔒 Disabling FK checks for sync...");
        await sequelize.query('SET FOREIGN_KEY_CHECKS=0');
      }

      try {
        // Sync tables without altering (prevents FK issues)
        logger.info("📋 Syncing database schema...");
        await sequelize.sync({ alter: false, force: false });
        logger.info("✅ Schema synced");

        // Re-enable foreign key checks after sync
        if (dialect === 'mysql' || dialect === 'mariadb') {
          logger.info("🔓 Re-enabling FK checks...");
          await sequelize.query('SET FOREIGN_KEY_CHECKS=1');
        }

        await seedDatabase();
      } catch (syncError) {
        // Re-enable FK checks even if sync fails
        if (dialect === 'mysql' || dialect === 'mariadb') {
          await sequelize.query('SET FOREIGN_KEY_CHECKS=1').catch(() => {});
        }
        throw syncError;
      }
    })
    .then(() => {
      logger.info("🌱 Seeder finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeder execution failed:", error);
      logger.error("Seeder execution failed:", error);
      process.exit(1);
    });
}
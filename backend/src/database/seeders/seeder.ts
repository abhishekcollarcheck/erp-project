import { sequelize } from "../../config/database";

import { Employee } from '../models/Employee';
import { Company } from '../models/Company';
import { Department } from "../models/Department";
import { SubDepartment } from "../models/Subdepartment";
import { Designation } from '../models/Designation';
import { SubDesignation } from "../models/SubDesignation";
import { Role } from '../models/RoleModels';
import { EmployeeRole, RoleTemplate } from '../models/AuthModels';
import { logger } from '../../config/logger';
import { seedShifts } from "./shift-seed-data";
import { seedHolidays } from "./holiday-seed-data";


const COMPANY_ID = 1;

const TEMPLATE_DEFS = [
  { slug: 'super_admin', name: 'Super Admin', sort_order: 1 },
  { slug: 'hr_manager', name: 'HR Manager', sort_order: 2 },
  { slug: 'manager', name: 'Department Manager', sort_order: 3 },
  { slug: 'employee', name: 'Employee', sort_order: 4 },
] as const;

type TemplatePerm = { module: string; can_view: boolean; can_edit: boolean; can_delete: boolean; can_download: boolean; };

// const TEMPLATE_PERMS: Record<string, TemplatePerm[]> = {
//   super_admin: [
//     { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'settings', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'companies', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//   ],
//   hr_manager: [
//     { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//   ],
//   manager: [
//     { module: 'recruitment', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'apptitude', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'employees', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'department', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'designation', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'settings', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//     { module: 'companies', can_view: true, can_edit: true, can_delete: true, can_download: true, },
//   ],
//   employee: [
//     { module: 'employees', can_view: true, can_delete: false, can_edit: false, can_download: false },
//   ],
// };


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
    // const allTemplates = await RoleTemplate.findAll();
    // for (const tmpl of allTemplates) {
    //   for (const p of (TEMPLATE_PERMS[tmpl.slug] ?? [])) {
    //     await RoleTemplatePermission.findOrCreate({
    //       where: { template_id: tmpl.id, module: p.module },
    //       defaults: { template_id: tmpl.id, ...p },
    //     });
    //   }
    // }
    // logger.info('✅ Role templates + permissions seeded');

    // ── 3. Per-company roles + module permissions ────────────────────────────
    // const templateMap = new Map(allTemplates.map(t => [t.slug, t]));
    // for (const def of TEMPLATE_DEFS) {
    //   const tmpl = templateMap.get(def.slug)!;
    //   const [role] = await Role.findOrCreate({
    //     where: { company_id: COMPANY_ID, slug: def.slug },
    //     defaults: {
    //       company_id: COMPANY_ID,
    //       name: def.name,
    //       slug: def.slug,
    //       is_system: true,
    //       template_id: tmpl.id,  // ✓ now valid on updated Role model
    //     },
    //   });
    //   const tPerms = await RoleTemplatePermission.findAll({ where: { template_id: tmpl.id } });
    //   for (const tp of tPerms) {
    //     await RoleModulePermission.findOrCreate({
    //       where: { role_id: role.id, module: tp.module },
    //       defaults: {
    //         role_id: role.id, module: tp.module,
    //       },
    //     });
    //   }
    // }
    // logger.info('✅ Company roles + module permissions ready');

    // ── 4. Departments ───────────────────────────────────────────────────
    const deptNames = ['Commercial', 'Accounts', 'Automation', 'HR', 'Graphics', 'Admin', 'Project', 'Service', 'IT', 'Estimation', 'Management', 'Purchase', 'Tender', 'Sales', 'Technical', 'Legal', 'Regulatory Affairs', 'Store', 'Ortho', 'Maintenance', 'Design', 'Quality', 'Credit Control', 'International Marketing', 'Field', 'Projects', 'Facility Management (Operations)', 'PTS and Project', 'CSSD', 'Quality Control', 'Marketing', 'Operations'];
    
    const existingDepts = await Department.findAll({ 
      where: { department_name: deptNames },
      transaction 
    });
    const existingDeptNames = new Set(existingDepts.map(d => d.department_name));
    
 const deptsToCreate = deptNames
  .filter(name => !existingDeptNames.has(name))
  .map(name => ({
    department_name: name,
  }));
    
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
      if (deptNames.includes(dept.department_name)) {
        deptMap.set(dept.department_name, dept.id);
      }
    }
    
    if (deptMap.size < deptNames.length) {
      const allDepts = await Department.findAll({ 
        where: { department_name: deptNames },
        transaction 
      });
      for (const dept of allDepts) {
        deptMap.set(dept.department_name, dept.id);
      }
    }

    // ── 4b. Sub Departments ─────────────────────────────────────────────
    const subdeptNames = ['AUTOMATION', 'NCS', 'PTS', 'HELP DESK / IT SUPPORT', 'UI / UX/ Frontend', 'PWLCS', 'DOMESTIC', 'BACKEND', 'SEO', 'INTERNATIONAL', 'MGPS', 'WHATSAPP & EMAIL', 'Not Applicable', 'Electrical'];
    
    const existingSubDepts = await SubDepartment.findAll({ 
      where: { name: subdeptNames },
      transaction 
    });
    const existingSubDeptNames = new Set(existingSubDepts.map(d => d.name));
    
    const subdeptsToCreate = subdeptNames
      .filter(name => !existingSubDeptNames.has(name))
      .map(name => ({ name }));
    
    const createdSubDepts = existingSubDepts;
    if (subdeptsToCreate.length > 0) {
      const newSubDepts = await SubDepartment.bulkCreate(subdeptsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
      createdSubDepts.push(...newSubDepts);
    }
    
    const subdeptMap = new Map<string, number>();
    for (const dept of createdSubDepts) {
      if (subdeptNames.includes(dept.name)) {
        subdeptMap.set(dept.name, dept.id);
      }
    }
    
    if (subdeptMap.size < subdeptNames.length) {
      const allSubDepts = await SubDepartment.findAll({ 
        where: { name: subdeptNames },
        transaction 
      });
      for (const dept of allSubDepts) {
        subdeptMap.set(dept.name, dept.id);
      }
    }

    // ── 5. Designations ──────────────────────────────────────────────────
    const desigNames = ['Accountant', 'Advisor', 'Asst. General Manager', 'Asst. Manager', 'CMD', 'Computer Operator', 'Cook', 'Coordinator', 'Deputy Manager', 'Director', 'Driver', 'Electrician', 'Engineer', 'Executive', 'Executive Assistant', 'Field Assistant', 'Fitter', 'General Manager', 'Guard', 'Helper', 'Jr. Accountant', 'Jr. Executive', 'Jr. Operator', 'Jr. Technician', 'Manager', 'MIS Executive', 'Office Attendant', 'Operator', 'Plumber', 'Receptionist', 'Sales Officer', 'Senior Deputy Manager', 'Site Engineer', 'Sr. Computer Operator', 'Sr. Coordinator', 'Sr. Engineer', 'Sr. Executive', 'Sr. Field Assistant', 'Sr. Fitter', 'Sr. Helper', 'Sr. Manager', 'Sr. MIS Executive', 'Sr. Sales Officer', 'Supervisor', 'Technician', 'Data Entry Operator', 'Security Guard', 'Field Executive', 'Site Supervisor', 'Housekeeper', 'Jr. Engineer', 'Semi Fitter', 'Sr. Developer', 'Vice President', 'Social Media Video Editor', 'Quality Assurance Engineer', 'Recruiter', 'Sr. Site Engineer', 'Jr. Site Engineer', 'Site Manager', 'Flutter Developer', 'Incharge', 'Sr. Recruiter', 'Jr. Recruiter', 'PSO', 'Social Media Manager', 'Fullstack Developer', 'Software Engineer', 'Dispatch Clerk Cum Engineer', 'Jr. Fitter', 'Deputy General Manager', 'Jr. Electrician', 'Social Media Executive', 'Sr. Data Analyst', 'Sr. Supervisor', 'Sr. Software Engineer'];
    
    const existingDesigs = await Designation.findAll({ 
      where: { designation_name: desigNames },
      transaction 
    });
    const existingDesigNames = new Set(existingDesigs.map(d => d.designation_name));
    
const desigsToCreate = desigNames
  .filter(name => !existingDesigNames.has(name))
  .map(name => ({ designation_name: name }));
    
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
      if (desigNames.includes(desig.designation_name)) {
        desigMap.set(desig.designation_name, desig.id);
      }
    }
    
    if (desigMap.size < desigNames.length) {
      const allDesigs = await Designation.findAll({ 
        where: { designation_name: desigNames },
        transaction 
      });
      for (const desig of allDesigs) {
        desigMap.set(desig.designation_name, desig.id);
      }
    }
    
    logger.info('✅ Departments + designations ready');

        // ── 5b. Sub Designations ────────────────────────────────────────────
    const subdesigNames = ['Not Applicable'];
    
    const existingSubDesigs = await SubDesignation.findAll({ 
      where: { name: subdesigNames },
      transaction 
    });
    const existingSubDesigNames = new Set(existingSubDesigs.map(d => d.name));
    
    const subdesigsToCreate = subdesigNames
      .filter(name => !existingSubDesigNames.has(name))
      .map(name => ({ name }));
    
    const createdSubDesigs = existingSubDesigs;
    if (subdesigsToCreate.length > 0) {
      const newSubDesigs = await SubDesignation.bulkCreate(subdesigsToCreate, { 
        ignoreDuplicates: true, 
        transaction 
      });
      createdSubDesigs.push(...newSubDesigs);
    }
    
    const subdesigMap = new Map<string, number>();
    for (const desig of createdSubDesigs) {
      if (subdesigNames.includes(desig.name)) {
        subdesigMap.set(desig.name, desig.id);
      }
    }
    
    if (subdesigMap.size < subdesigNames.length) {
      const allSubDesigs = await SubDesignation.findAll({ 
        where: { name: subdesigNames },
        transaction 
      });
      for (const desig of allSubDesigs) {
        subdesigMap.set(desig.name, desig.id);
      }
    }
    
    logger.info('✅ Sub-departments + sub-designations ready');

    // ── 5c. Shifts ───────────────────────────────────────────────────────────
    await seedShifts(transaction);

    // ── 5d. Holidays ───────────────────────────────────────────────────────────
    await seedHolidays();

    // ── 6. Super admin employee ───────────────────────────────────────────────
    const [superAdminEmp, saCreated] = await Employee.findOrCreate({
      where: { email: 'superadmin@ung.com' },
      defaults: {
        // employee_code is intentionally omitted — it's generated by the
        // backend (generateEmployeeCode) once a profile reaches 100% completion.
        company_id: COMPANY_ID,
        first_name: 'Super', last_name: 'Admin',
        email: 'superadmin@ung.com', phone: '+918130988753',
        department_id: deptMap.get('HR')!,
        designation_id: desigMap.get('Asst. General Manager')!, // or whichever designation you want
        employment_type: 'Permanent',
        status: 'Active',
        record_status: 'Final', form_completion_pct: 100,
        portal_access: true, is_super_admin: true,
      },
    });
    if (!saCreated) {
      await superAdminEmp.update({ is_super_admin: true, portal_access: true, record_status: 'Final' });
    }
    const saRole = await Role.findOne({ where: { company_id: COMPANY_ID, slug: 'super_admin' } });
    if (saRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: superAdminEmp.id, role_id: saRole.id },
        defaults: { employee_id: superAdminEmp.id, role_id: saRole.id, company_id: COMPANY_ID },
      });
    }

    // ── 7. HR admin employee ─────────────────────────────────────────────────
    const [hrEmp, hrCreated] = await Employee.findOrCreate({
      where: { email: 'admin@ung.com' },
      defaults: {
        // employee_code omitted — generated by the backend at 100% completion.
        company_id: COMPANY_ID,
        first_name: 'Admin', last_name: 'User',
        email: 'admin@ung.com', phone: '+918826693968',
        department_id: deptMap.get('HR')!,
        designation_id: desigMap.get('Asst. General Manager')!, // or whichever designation you want
        employment_type: 'Permanent',
        status: 'Active',
        record_status: 'Final', form_completion_pct: 100,
        portal_access: true, is_super_admin: false,
      },
    });
    if (!hrCreated) {
      await hrEmp.update({ portal_access: true, is_super_admin: false, record_status: 'Final' });
    }
    const hrRole = await Role.findOne({ where: { company_id: COMPANY_ID, slug: 'hr_manager' } });
    if (hrRole) {
      await EmployeeRole.findOrCreate({
        where: { employee_id: hrEmp.id, role_id: hrRole.id },
        defaults: { employee_id: hrEmp.id, role_id: hrRole.id, company_id: COMPANY_ID },
      });
    }

   

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

      // IMPORTANT: schema changes belong in tracked migrations
      // (`npm run migrate`), not here. sequelize.sync({ alter: true })
      // inspects the live models and silently ALTERs the DB to match them
      // on every run — bypassing the migration history entirely, with no
      // down() to undo it if a model has drifted from what migrations
      // actually produced. Run migrations first, then seed.
      //
      // Opt-in escape hatch for local/dev convenience only — never rely on
      // this in staging/production:
      if (process.env.ALLOW_SYNC_ALTER === 'true') {
        logger.warn("⚠️  ALLOW_SYNC_ALTER=true — running sequelize.sync({ alter: true }). Do not use this in staging/production.");
        await sequelize.sync({ alter: true });
      }

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
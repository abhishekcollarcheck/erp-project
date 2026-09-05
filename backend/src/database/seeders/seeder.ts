
import { sequelize } from "../../config/database";

import { Employee } from "../models/Employee";
import { Company } from "../models/Company";
import { Department, CompanyDepartment } from "../models/Department";
import { SubDepartment } from "../models/Subdepartment";
import { Role } from "../models/RoleModels";
import { EmployeeRole, RoleTemplate } from "../models/AuthModels";
import { LeaveType } from "../models/LeaveModels";
import { logger } from "../../config/logger";
import { seedHolidays } from "./holiday-seed-data";
import { seedEmpLookups } from "./seedEmpLookups";
import { computeCompletionPct } from "../../modules/employees/employee.helper";
import { Designation } from "../models";
import type { Sequelize } from "sequelize";
/**
 * Guard against repeating the "Too many keys specified; max 64 keys allowed"
 * outage (see the 2026-09-05 unique-index cleanup migration + the comment at
 * the ALLOW_SYNC_ALTER call site). MySQL caps a table at 64 indexes; refuse to
 * run `sync({ alter: true })` — which can still add an index per un-matched
 * attribute — while any table is already within striking distance of that
 * ceiling, so a stray env var fails loudly instead of silently piling on.
 */
async function assertNoIndexBloat(db: Sequelize, threshold = 55): Promise<void> {
  const [rows] = (await db.query(
    `SELECT TABLE_NAME, COUNT(DISTINCT INDEX_NAME) AS index_count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
     GROUP BY TABLE_NAME
     HAVING index_count >= ${threshold}
     ORDER BY index_count DESC`
  )) as unknown as [{ TABLE_NAME: string; index_count: number }[], unknown];

  if (rows.length > 0) {
    const detail = rows.map((r) => `${r.TABLE_NAME} (${r.index_count})`).join(", ");
    throw new Error(
      `Refusing to run sequelize.sync({ alter: true }) — ${rows.length} table(s) already ` +
      `have ${threshold}+ of MySQL's 64-key limit: ${detail}. Run the index cleanup ` +
      `migration first, or fix the model(s) still declaring inline "unique: true" ` +
      `instead of a named index in "indexes: []".`
    );
  }
}

// =========================================================
// CONSTANTS
// =========================================================

const COMPANY_ID = 1;

// The seeded admin accounts are login users, not filled-in employee profiles —
// their completion % must reflect the actual data (base identity only), not a
// hard-coded 100. Kept in sync with the wizard/list by using the same helper.
const seedAdminCompletionPct = (emp: {
  first_name: string; last_name: string; employment_type: string;
  department_id: number; designation_id: number; email: string; phone: string;
}) => computeCompletionPct(emp).overallPct;
// =========================================================
// ROLE TEMPLATES
// =========================================================

const TEMPLATE_DEFS = [
  {
    slug: "super_admin",
    name: "Super Admin",
    sort_order: 1,
  },
  {
    slug: "hr_manager",
    name: "HR Manager",
    sort_order: 2,
  },
  {
    slug: "manager",
    name: "Department Manager",
    sort_order: 3,
  },
  {
    slug: "employee",
    name: "Employee",
    sort_order: 4,
  },
] as const;

// =========================================================
// DESIGNATIONS
// =========================================================

const DESIGNATION_NAMES = [
  "Accountant",
  "Advisor",
  "Asst. General Manager",
  "Asst. Manager",
  "CMD",
  "Computer Operator",
  "Cook",
  "Coordinator",
  "Deputy Manager",
  "Director",
  "Driver",
  "Electrician",
  "Engineer",
  "Executive",
  "Executive Assistant",
  "Field Assistant",
  "Fitter",
  "General Manager",
  "Guard",
  "Helper",
  "Jr. Accountant",
  "Jr. Executive",
  "Jr. Operator",
  "Jr. Technician",
  "Manager",
  "MIS Executive",
  "Office Attendant",
  "Operator",
  "Plumber",
  "Receptionist",
  "Sales Officer",
  "Senior Deputy Manager",
  "Site Engineer",
  "Sr. Computer Operator",
  "Sr. Coordinator",
  "Sr. Engineer",
  "Sr. Executive",
  "Sr. Field Assistant",
  "Sr. Fitter",
  "Sr. Helper",
  "Sr. Manager",
  "Sr. MIS Executive",
  "Sr. Sales Officer",
  "Supervisor",
  "Technician",
  "Data Entry Operator",
  "Security Guard",
  "Field Executive",
  "Site Supervisor",
  "Housekeeper",
  "Jr. Engineer",
  "Semi Fitter",
  "Sr. Developer",
  "Vice President",
  "Social Media Video Editor",
  "Quality Assurance Engineer",
  "Recruiter",
  "Sr. Site Engineer",
  "Jr. Site Engineer",
  "Site Manager",
  "Flutter Developer",
  "Incharge",
  "Sr. Recruiter",
  "Jr. Recruiter",
  "PSO",
  "Social Media Manager",
  "Fullstack Developer",
  "Software Engineer",
  "Dispatch Clerk Cum Engineer",
  "Jr. Fitter",
  "Deputy General Manager",
  "Jr. Electrician",
  "Social Media Executive",
  "Sr. Data Analyst",
  "Sr. Supervisor",
  "Sr. Software Engineer",
] as const;

// =========================================================
// DEPARTMENTS
// =========================================================

const DEPARTMENT_NAMES = [
  "Commercial",
  "Accounts",
  "Automation",
  "HR",
  "Graphics",
  "Admin",
  "Project",
  "Service",
  "IT",
  "Estimation",
  "Management",
  "Purchase",
  "Tender",
  "Sales",
  "Technical",
  "Legal",
  "Regulatory Affairs",
  "Store",
  "Ortho",
  "Maintenance",
  "Design",
  "Quality",
  "Credit Control",
  "International Marketing",
  "Field",
  "Projects",
  "Facility Management (Operations)",
  "PTS and Project",
  "CSSD",
  "Quality Control",
  "Marketing",
  "Operations",
];

// =========================================================
// LEAVE TYPES
// =========================================================
//
// Values mirror the defaults from the original vanilla-JS leave-management
// demo's lvDefaultPolicy(): EL needs 2 days' advance notice and can't be
// backdated; CL allows 1 day of backdating and half-day use; SHORT is a
// 60-min monthly pool splittable into 30-min chunks with sandwich off;
// SPECIAL is earned-only (is_earned, no annual quota); HALF allows 1 day of
// backdating, sandwich applies, and deducts from CL (wired up after all five
// rows exist, same as the earlier SQL seed — HALF needs CL's id which isn't
// known until CL itself has been created).
// =========================================================

const LEAVE_TYPE_DEFS = [
  {
    code: "EL", name: "Earned Leave", unit: "day" as const,
    days_per_year: 12, monthly_quota_minutes: 0, split_chunk_minutes: 0, allow_split: false,
    is_paid: true, carry_forward: false, max_carry_days: 0,
    min_advance_days: 2, max_backdate_days: 0, sandwich_applies: true, allow_half_day: false,
    requires_approval: true, is_earned: false,
  },
  {
    code: "CL", name: "Casual Leave", unit: "day" as const,
    days_per_year: 7, monthly_quota_minutes: 0, split_chunk_minutes: 0, allow_split: false,
    is_paid: true, carry_forward: false, max_carry_days: 0,
    min_advance_days: 0, max_backdate_days: 1, sandwich_applies: true, allow_half_day: true,
    requires_approval: true, is_earned: false,
  },
  {
    code: "SHORT", name: "Short Leave", unit: "minutes" as const,
    days_per_year: 0, monthly_quota_minutes: 60, split_chunk_minutes: 30, allow_split: true,
    is_paid: true, carry_forward: false, max_carry_days: 0,
    min_advance_days: 0, max_backdate_days: 1, sandwich_applies: false, allow_half_day: false,
    requires_approval: true, is_earned: false,
  },
  {
    code: "SPECIAL", name: "Special Leave", unit: "day" as const,
    days_per_year: 0, monthly_quota_minutes: 0, split_chunk_minutes: 0, allow_split: false,
    is_paid: true, carry_forward: false, max_carry_days: 0,
    min_advance_days: 0, max_backdate_days: 0, sandwich_applies: false, allow_half_day: false,
    requires_approval: true, is_earned: true,
  },
  {
    code: "HALF", name: "Half Day", unit: "day" as const,
    days_per_year: 0, monthly_quota_minutes: 0, split_chunk_minutes: 0, allow_split: false,
    is_paid: true, carry_forward: false, max_carry_days: 0,
    min_advance_days: 0, max_backdate_days: 1, sandwich_applies: true, allow_half_day: true,
    requires_approval: true, is_earned: false,
  },
] as const;

// =========================================================
// SEED DATABASE
// =========================================================

export async function seedDatabase(): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    logger.info("🚀 Running database seed...");

    // =====================================================
    // 1. COMPANY
    // =====================================================

    await Company.upsert(
      {
        id: COMPANY_ID,

        // Basic company information
        name: "Narula Exports",
        slug: "narula-exports",
        code: "NE",

        // Company profile
        legal_name: "Narula Exports",
        tagline: null,
        since_year: null,

        // Registration / tax information
        gstin: null,
        pan: null,
        cin: null,

        // Contact information
        phone: null,
        email: null,
        hr_email: null,
        website: null,

        // Address
        address: null,
        city: null,
        state: null,
        pincode: null,
        country: "India",

        // Google Maps
        google_maps_link: null,

        // Company information
        industry: null,
        about: null,

        // Employee code configuration
        employee_code_start: null,
        employee_code_end: null,
        employee_code_skip: "[]",

        // Localization
        fiscal_year: "Apr-Mar",
        employee_count: 0,
        timezone: "Asia/Kolkata",
        currency: "INR",
        date_format: "DD/MM/YYYY",

        // UI
        theme_color: null,

        // Setup
        onboarding_step: 5,
        setup_completed_at: null,
        is_active: true,

        // Misc
        notes: null,
        created_by: null,
      },
      {
        transaction,
      }
    );

    logger.info("✅ Company ready");

    // =====================================================
    // 2. GLOBAL ROLE TEMPLATES
    // =====================================================

    for (const def of TEMPLATE_DEFS) {
      await RoleTemplate.findOrCreate({
        where: {
          slug: def.slug,
        },
        defaults: {
          slug: def.slug,
          name: def.name,
          sort_order: def.sort_order,
          is_system: true,
        },
        transaction,
      });
    }

    logger.info("✅ Role templates ready");

    const existingDepts = await Department.findAll({
      where: {
        department_name: DEPARTMENT_NAMES,
      },
      transaction,
    });

    const existingDeptNames = new Set(
      existingDepts.map((department) => department.department_name)
    );

    const deptsToCreate = DEPARTMENT_NAMES
      .filter((name) => !existingDeptNames.has(name))
      .map((name) => ({
        department_name: name,
      }));

    const createdDepts = [...existingDepts];

    if (deptsToCreate.length > 0) {
      const newDepts = await Department.bulkCreate(
        deptsToCreate,
        {
          ignoreDuplicates: true,
          transaction,
        }
      );

      createdDepts.push(...newDepts);
    }

    // =====================================================
    // DEPARTMENT MAP
    // =====================================================

    const deptMap = new Map<string, number>();

    for (const department of createdDepts) {
      if (DEPARTMENT_NAMES.includes(department.department_name as any)) {
        deptMap.set(
          department.department_name,
          department.id
        );
      }
    }

    // Re-fetch in case ignoreDuplicates prevented returned
    // instances from containing everything we need.

    if (deptMap.size < DEPARTMENT_NAMES.length) {
      const allDepts = await Department.findAll({
        where: {
          department_name: DEPARTMENT_NAMES,
        },
        transaction,
      });

      for (const department of allDepts) {
        deptMap.set(
          department.department_name,
          department.id
        );
      }
    }

    logger.info(
      `✅ Departments ready (${deptMap.size}/${DEPARTMENT_NAMES.length})`
    );

    // =====================================================
    // 4b. COMPANY ↔ DEPARTMENT LINKS
    // =====================================================
    // ADDED — the block above created/found every department but never
    // connected a single one to a company. Per Associations.ts, the real
    // multi-company relationship is the CompanyDepartment junction table
    // (Company.hasMany(CompanyDepartment) / Department.hasMany(CompanyDepartment)),
    // not a bare company_id on Department itself. Without this, every
    // department seeded above was floating — attached to no company at all.
    // =====================================================

    let companyDeptLinks = 0;
    for (const departmentId of deptMap.values()) {
      const [, created] = await CompanyDepartment.findOrCreate({
        where: {
          company_id: COMPANY_ID,
          department_id: departmentId,
        },
        defaults: {
          company_id: COMPANY_ID,
          department_id: departmentId,
        },
        transaction,
      });
      if (created) companyDeptLinks += 1;
    }

    logger.info(
      `✅ Company↔Department links ready (${companyDeptLinks} new, ${deptMap.size} total for company ${COMPANY_ID})`
    );

    // =====================================================
    // 5. DESIGNATIONS
    // =====================================================
    //
    // IMPORTANT:
    //
    // Your Designation model uses:
    //
    //   name
    //
    // NOT:
    //
    //   designation_name
    //
    // Therefore the old code was incorrect.
    //
    // NOTE: Designations are NOT linked to a company here. Unlike Department,
    // nothing in Associations.ts (or any Designation model shared so far)
    // gives Designation a company_id or a company junction table — only
    // DesignationDepartment, which links to Department, not Company. If a
    // real company-scoping mechanism for designations exists elsewhere in
    // this codebase, it needs to be pointed out before this can be wired up;
    // guessing at a table/column with no evidence for it would just trade
    // one silent gap for a different one.
    //
    // =====================================================

    const desigMap = new Map<string, number>();

    for (const designationName of DESIGNATION_NAMES) {
      const [designation] = await Designation.findOrCreate({
        where: {
          name: designationName,
        },
        defaults: {
          name: designationName,
          code: null,
          is_all_departments: false,
          is_active: true,
        },
        transaction,
      });

      desigMap.set(
        designationName,
        designation.id
      );
    }

    logger.info(
      `✅ Designations ready (${desigMap.size}/${DESIGNATION_NAMES.length})`
    );
    // =====================================================
    // 6. SHIFTS
    // =====================================================

    // await seedShifts(transaction);

    // =====================================================
    // 7. HOLIDAYS
    // =====================================================

    await seedHolidays();

    logger.info("✅ Holidays ready");

    // =====================================================
    // 7b. LEAVE TYPES
    // =====================================================
    // ADDED — nothing seeded EL/CL/SHORT/SPECIAL/HALF for this company
    // before. Without this, GET /leaves/types returns empty on a fresh
    // database and the entire leave module has nothing to work against.
    // =====================================================

    const leaveTypeMap = new Map<string, number>();

    for (const def of LEAVE_TYPE_DEFS) {
      const [leaveType] = await LeaveType.findOrCreate({
        where: {
          company_id: COMPANY_ID,
          code: def.code,
        },
        defaults: {
          company_id: COMPANY_ID,
          name: def.name,
          code: def.code,
          unit: def.unit,
          days_per_year: def.days_per_year,
          monthly_quota_minutes: def.monthly_quota_minutes,
          split_chunk_minutes: def.split_chunk_minutes,
          allow_split: def.allow_split,
          is_paid: def.is_paid,
          carry_forward: def.carry_forward,
          max_carry_days: def.max_carry_days,
          min_advance_days: def.min_advance_days,
          max_backdate_days: def.max_backdate_days,
          sandwich_applies: def.sandwich_applies,
          allow_half_day: def.allow_half_day,
          requires_approval: def.requires_approval,
          is_earned: def.is_earned,
          deduct_from_leave_type_id: null,
          is_active: true,
        },
        transaction,
      });

      leaveTypeMap.set(def.code, leaveType.id);
    }

    // HALF deducts from CL — can't be set until CL's row exists, same
    // ordering issue as the standalone SQL seed had.
    const halfId = leaveTypeMap.get("HALF");
    const clId = leaveTypeMap.get("CL");
    if (halfId && clId) {
      await LeaveType.update(
        { deduct_from_leave_type_id: clId },
        { where: { id: halfId, company_id: COMPANY_ID }, transaction },
      );
    }

    logger.info(
      `✅ Leave types ready (${leaveTypeMap.size}/${LEAVE_TYPE_DEFS.length})`
    );

    // =====================================================
    // 8. SUPER ADMIN EMPLOYEE
    // =====================================================

    const hrDepartmentId = deptMap.get("HR");
    const superAdminDesignationId = desigMap.get(
      "Asst. General Manager"
    );

    if (!hrDepartmentId) {
      throw new Error(
        "HR department was not found while creating Super Admin."
      );
    }

    if (!superAdminDesignationId) {
      throw new Error(
        "Asst. General Manager designation was not found while creating Super Admin."
      );
    }

    const [superAdminEmp, saCreated] =
      await Employee.findOrCreate({
        where: {
          email: "superadmin@ung.com",
        },

        defaults: {
          company_id: COMPANY_ID,

          first_name: "Super",
          last_name: "Admin",

          email: "superadmin@ung.com",
          phone: "+918130988753",

          department_id: hrDepartmentId,
          designation_id: superAdminDesignationId,

          employment_type: "Permanent",
          status: "Active",

          record_status: "Final",
          // Honest completion for a base-identity-only record (matches the
          // Employee List and the Edit wizard). NOT a hard-coded 100.
          form_completion_pct: seedAdminCompletionPct({
            first_name: "Super", last_name: "Admin", employment_type: "Permanent",
            department_id: hrDepartmentId!, designation_id: superAdminDesignationId!,
            email: "superadmin@ung.com", phone: "+918130988753",
          }),

          portal_access: true,
          is_super_admin: true,
        },

        transaction,
      });

    if (!saCreated) {
      await superAdminEmp.update(
        {
          company_id: COMPANY_ID,
          department_id: hrDepartmentId,
          designation_id: superAdminDesignationId,

          portal_access: true,
          is_super_admin: true,

          record_status: "Final",
        },
        {
          transaction,
        }
      );
    }

    // =====================================================
    // SUPER ADMIN ROLE
    // =====================================================

    const saRole = await Role.findOne({
      where: {
        company_id: COMPANY_ID,
        slug: "super_admin",
      },
      transaction,
    });

    if (saRole) {
      await EmployeeRole.findOrCreate({
        where: {
          employee_id: superAdminEmp.id,
          role_id: saRole.id,
        },

        defaults: {
          employee_id: superAdminEmp.id,
          role_id: saRole.id,
          company_id: COMPANY_ID,
        },

        transaction,
      });
    }

    logger.info("✅ Super admin employee ready");

    // =====================================================
    // 9. HR ADMIN EMPLOYEE
    // =====================================================

    // const [hrEmp, hrCreated] =
    //   await Employee.findOrCreate({
    //     where: {
    //       email: "admin@ung.com",
    //     },

    //     defaults: {
    //       company_id: COMPANY_ID,

    //       first_name: "Admin",
    //       last_name: "User",

    //       email: "admin@ung.com",
    //       phone: "+918826693968",

    //       department_id: hrDepartmentId,

    //       employment_type: "Permanent",
    //       status: "Active",

    //       record_status: "Final",
    //       form_completion_pct: 100,

    //       portal_access: true,
    //       is_super_admin: false,
    //     },

    //     transaction,
    //   });

    // if (!hrCreated) {
    //   await hrEmp.update(
    //     {
    //       company_id: COMPANY_ID,
    //       department_id: hrDepartmentId,

    //       portal_access: true,
    //       is_super_admin: false,

    //       record_status: "Final",
    //     },
    //     {
    //       transaction,
    //     }
    //   );
    // }

    const [hrEmp, hrCreated] =
      await Employee.findOrCreate({
        where: {
          email: "admin@ung.com",
        },

        defaults: {
          company_id: COMPANY_ID,

          first_name: "Admin",
          last_name: "User",

          email: "admin@ung.com",
          phone: "+918826693968",

          department_id: hrDepartmentId,
          designation_id: superAdminDesignationId,

          employment_type: "Permanent",
          status: "Active",

          record_status: "Final",
          // Honest completion for a base-identity-only record (matches the
          // Employee List and the Edit wizard). NOT a hard-coded 100.
          form_completion_pct: seedAdminCompletionPct({
            first_name: "Admin", last_name: "User", employment_type: "Permanent",
            department_id: hrDepartmentId!, designation_id: superAdminDesignationId!,
            email: "admin@ung.com", phone: "+918826693968",
          }),

          portal_access: true,
          is_super_admin: false,
        },

        transaction,
      });

    // =====================================================
    // HR MANAGER ROLE
    // =====================================================

    const hrRole = await Role.findOne({
      where: {
        company_id: COMPANY_ID,
        slug: "hr_manager",
      },
      transaction,
    });

    if (hrRole) {
      await EmployeeRole.findOrCreate({
        where: {
          employee_id: hrEmp.id,
          role_id: hrRole.id,
        },

        defaults: {
          employee_id: hrEmp.id,
          role_id: hrRole.id,
          company_id: COMPANY_ID,
        },

        transaction,
      });
    }

    logger.info("✅ HR admin employee ready");

    // =====================================================
    // COMMIT
    // =====================================================

    await transaction.commit();

    logger.info("🎉 Database seed completed successfully");
    logger.info("📧 Login: admin@ung.com");
    logger.info("🔑 Password: 123456");

    // Legacy Excel master-data catalog (genders, blood groups, banks,
    // countries/states/cities, etc. — see seedEmpLookups.ts). Wired in here so
    // a fresh `npm run seed` (new DB, CI, a reset dev DB) always includes it —
    // it was previously a one-off script and silently vanished on the next
    // reseed. Runs AFTER the commit above, in its own try/catch, so a problem
    // here can never roll back or fail the core company/department/employee
    // seed that just succeeded.
    try {
      await seedEmpLookups();
    } catch (lookupError) {
      logger.error("⚠️ Excel master-data catalog seed failed (core seed already committed):", lookupError);
    }
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

      // IMPORTANT:
      // Schema changes belong in migrations.
      // Do not use sequelize.sync({ alter: true }) in
      // staging/production.
      //
      // HISTORY: this flag is what caused the "Too many keys specified;
      // max 64 keys allowed" outage on the master-data tables (probation_periods,
      // genders, bonds, etc. — see the 2026-09-05 unique-index cleanup migration).
      // Every model attribute that declared `unique: true` inline got a fresh,
      // anonymously-named unique index (`name`, `name_2`, `name_3`, ...) on each
      // `alter: true` run, because MySQL's ALTER TABLE ... CHANGE COLUMN ... UNIQUE
      // can't be matched back to an existing index by Sequelize's diffing. All such
      // models now declare ONE named unique index via `indexes: []` instead, which
      // Sequelize's alter-diff can match by name and skip re-adding — but this
      // escape hatch is still opt-in-only and still discouraged outside a
      // throwaway dev DB. The guard below refuses to run if any table is already
      // dangerously close to the 64-key ceiling, so a stray env var can't repeat
      // the outage silently.
      if (process.env.ALLOW_SYNC_ALTER === "true") {
        await assertNoIndexBloat(sequelize);

        logger.warn(
          "⚠️ ALLOW_SYNC_ALTER=true — running sequelize.sync({ alter: true }). Do not use this in staging/production."
        );

        await sequelize.sync({
          alter: true,
        });
      }

      await seedDatabase();
    })
    .then(() => {
      logger.info("🌱 Seeder finished");

      process.exit(0);
    })
    .catch((error) => {
      console.error(error);

      logger.error(
        "Seeder execution failed:",
        error
      );

      process.exit(1);
    });
}
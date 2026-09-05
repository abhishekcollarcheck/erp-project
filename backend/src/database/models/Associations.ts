import { Employee } from './Employee';
import { Company } from './Company';
import { Department, CompanyDepartment } from './Department';
import { Designation, DesignationDepartment, SubDesignation, SubDesignationDesignation } from './Designation';
import { SubDepartment, SubDepartmentDepartment } from './Subdepartment';
import { Shift } from './Shift';
import { State, City, Site, PayRegister } from './Location';
import { WeeklyOffPreset } from './weeklyOffPreset';

// ─── Auth (new — employee-as-identity) ───────────────────────────────────────

import {
  OtpRequest,
  EmployeeRole,
  RoleTemplate,
  RoleTemplatePermission,
} from './AuthModels';

// ─── Roles & Permissions ──────────────────────────────────────────────────────

import {
  Role,
  Permission,
  RolePermission,
  RoleModulePermission,
} from './RoleModels';

// ─── HR Modules ───────────────────────────────────────────────────────────────
import { Attendance }                                    from './Attendance';
import { Candidate }                                     from './Candidate';
import { CandidateEmployment }                           from './CandidateEmployment';
import { AptitudeTest, AptitudeQuestion, CandidateAnswer } from './AptitudeTest';
import { PayrollRun, Payslip }                           from './PayrollModels';
import { Notification }                                  from './Notification';
import { ActivityLog }                                   from './ActivityLog';
import { EmailBranding, EmailTemplate }                  from './EmailTemplate';
import {
  LeaveType,
  LeaveRequest,
} from './LeaveModels';

import {
  HrModule,
  FormDefinition,
  DynamicField,
  FieldOption,
  FieldPermissionV2,
  RoleAssignment,
} from './FormBuilder';

import {
  UserModulePermission,
  UserFieldPermission,
} from './UserPermission';

import {
  PermissionGroup,
  GroupPermission,
  UserGroup,
} from './PermissionGroups';

import {
  Asset,
  AssetCategory,
  AssetAssignment,
  AssetRequest,
  AssetMaintenance,
} from './AssetModels';

import { AttendanceRegularization } from './AttendanceRegularization';

import { CompanyManager } from './CompanyManager';

import { EmployeePermission } from './EmployeePermission';
import {
  EmployeeExperience,
  EmployeeExit,
  EmployeeOnboardingDocs,
  EmployeeTransfer,
  EmployeeCommitmentProbation,
  EmployeeAddress,
  EmployeeAssetDeduction,
  EmployeeBankDetail,
  EmployeeEducation,
  EmployeeSchemes,
  EmployeePersonal,
  EmployeeFamily,
  EmployeeEmergencyContact,
  EmployeeStatutory,
  EmployeeSalary,
  EmployeeLocationAttendance,
  EmployeeManagersWorkContact,
  EmployeeFamilyMember,
  EmployeeExperienceFlag,
  EmployeeVaccination,
  EmployeeDocument,
} from './Employee';

// ─── Company ↔ CompanyManager ↔ Employee ─────────────────────────────────────

Company.hasMany(CompanyManager, {
  foreignKey: 'company_id',
  as: 'managers',
});

CompanyManager.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company',
});

Employee.hasMany(CompanyManager, {
  foreignKey: 'employee_id',
  as: 'managedCompanies',
});

CompanyManager.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee',
});

Company.belongsToMany(Employee, {
  through: CompanyManager,
  foreignKey: 'company_id',
  otherKey: 'employee_id',
  as: 'companyManagers',
});

Employee.belongsToMany(Company, {
  through: CompanyManager,
  foreignKey: 'employee_id',
  otherKey: 'company_id',
  as: 'companies',
});

// ─── Employee Permission ─────────────────────────────────────────────────────

EmployeePermission.belongsTo(Employee, {
  foreignKey: 'employee_id',
});

EmployeePermission.belongsTo(Permission, {
  foreignKey: 'permission_id',
});

Employee.hasMany(EmployeePermission, {
  foreignKey: 'employee_id',
});

// ─── Employee HR Details ─────────────────────────────────────────────────────

Employee.hasOne(EmployeeCommitmentProbation, { foreignKey: 'employee_id', as: 'commitmentProbation' });
Employee.hasOne(EmployeeSchemes,             { foreignKey: 'employee_id', as: 'schemes'             });
Employee.hasOne(EmployeePersonal,            { foreignKey: 'employee_id', as: 'personal'            });
Employee.hasOne(EmployeeFamily,              { foreignKey: 'employee_id', as: 'family'              });
Employee.hasMany(EmployeeFamilyMember,       { foreignKey: 'employee_id', as: 'familyMembers'       });
Employee.hasMany(EmployeeAddress,            { foreignKey: 'employee_id', as: 'addresses'           });
Employee.hasMany(EmployeeEmergencyContact,   { foreignKey: 'employee_id', as: 'emergencyContacts'   });
Employee.hasOne(EmployeeStatutory,           { foreignKey: 'employee_id', as: 'statutory'           });
Employee.hasMany(EmployeeVaccination,        { foreignKey: 'employee_id', as: 'vaccinations'        });
Employee.hasMany(EmployeeDocument,           { foreignKey: 'employee_id', as: 'documents'           });
Employee.hasMany(EmployeeBankDetail,         { foreignKey: 'employee_id', as: 'bankDetails'         });
Employee.hasMany(EmployeeSalary,             { foreignKey: 'employee_id', as: 'salaries'            });
Employee.hasOne(EmployeeAssetDeduction,      { foreignKey: 'employee_id', as: 'assetDeduction'      });
Employee.hasMany(EmployeeExperience,         { foreignKey: 'employee_id', as: 'experience'          });
Employee.hasOne(EmployeeExperienceFlag,      { foreignKey: 'employee_id', as: 'experienceFlag'      });
Employee.hasMany(EmployeeEducation,          { foreignKey: 'employee_id', as: 'education'           });
Employee.hasOne(EmployeeOnboardingDocs,      { foreignKey: 'employee_id', as: 'onboardingDocs'      });
Employee.hasMany(EmployeeTransfer,           { foreignKey: 'employee_id', as: 'transfers'           });
Employee.hasOne(EmployeeExit,                { foreignKey: 'employee_id', as: 'exit'                });

// ─── Steps 2 & 3 — separate 1:1 child tables (Role Identity was merged back
// onto the root Employee table; these two stayed split) ──────────────────────
Employee.hasOne(EmployeeLocationAttendance,  { foreignKey: 'employee_id', as: 'locationAttendance'  });
Employee.hasOne(EmployeeManagersWorkContact, { foreignKey: 'employee_id', as: 'managersWorkContact' });

// EmployeeLocationAttendance's location/shift columns were already
// FK-shaped integers (no ENUM/STRING to migrate) but had no association —
// the wizard's dropdowns read from the master tables now (see StepLocationAttendance),
// so add the belongsTo wiring needed for getById()/StepReview/DetailView to
// resolve them back to names instead of showing a bare id.
EmployeeLocationAttendance.belongsTo(Shift,       { foreignKey: 'shift_id',              as: 'shift'       });
EmployeeLocationAttendance.belongsTo(State,       { foreignKey: 'working_state_country', as: 'workingState' });
EmployeeLocationAttendance.belongsTo(City,        { foreignKey: 'working_city',          as: 'workingCity' });
EmployeeLocationAttendance.belongsTo(Site,        { foreignKey: 'working_site',          as: 'workingSite' });
EmployeeLocationAttendance.belongsTo(PayRegister, { foreignKey: 'pay_register_location', as: 'payRegister' });
EmployeeLocationAttendance.belongsTo(WeeklyOffPreset, { foreignKey: 'weekly_off',        as: 'weeklyOffPreset' });

// l1_manager_id/l2_manager_id live on EmployeeManagersWorkContact now, not on
// the root Employee table — so these belong there, not as a self-referential
// association on Employee.
EmployeeManagersWorkContact.belongsTo(Employee, { foreignKey: 'l1_manager_id', as: 'l1Manager' });
EmployeeManagersWorkContact.belongsTo(Employee, { foreignKey: 'l2_manager_id', as: 'l2Manager' });
Employee.hasMany(EmployeeManagersWorkContact,   { foreignKey: 'l1_manager_id', as: 'directReportsContact' });

// ─── Company ↔ Employee ──────────────────────────────────────────────────────

Employee.belongsTo(Company, { foreignKey: 'company_id', as: 'company'   });
Company.hasMany(Employee,   { foreignKey: 'company_id', as: 'employees' });

// ─── Company ↔ Department ────────────────────────────────────────────────────

Department.belongsTo(Company, { foreignKey: 'company_id', as: 'company'     });
Company.hasMany(Department,   { foreignKey: 'company_id', as: 'departments' });

// ─── Department ↔ CompanyDepartment ↔ Company ───────────────────────────────

Department.hasMany(CompanyDepartment, {
  foreignKey: 'department_id',
  as: 'company_mappings',
});

CompanyDepartment.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

CompanyDepartment.belongsTo(Company, {
  foreignKey: 'company_id',
  as: 'company',
});

Company.hasMany(CompanyDepartment, {
  foreignKey: 'company_id',
  as: 'company_departments',
});

// ─── Employee ↔ Department ───────────────────────────────────────────────────

Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(Employee,   { foreignKey: 'department_id', as: 'employees'  });

SubDepartment.hasMany(SubDepartmentDepartment, {
  foreignKey: 'sub_department_id',
  as: 'department_mappings',
});

SubDepartmentDepartment.belongsTo(SubDepartment, {
  foreignKey: 'sub_department_id',
  as: 'sub_department',
});

SubDepartmentDepartment.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

Department.hasMany(SubDepartmentDepartment, {
  foreignKey: 'department_id',
  as: 'sub_department_mappings',
});

SubDepartment.belongsToMany(Department, {
  through: SubDepartmentDepartment,
  foreignKey: 'sub_department_id',
  otherKey: 'department_id',
  uniqueKey: 'uniq_subdept_dept',
  as: 'departments',
});

Department.belongsToMany(SubDepartment, {
  through: SubDepartmentDepartment,
  foreignKey: 'department_id',
  otherKey: 'sub_department_id',
  uniqueKey: 'uniq_subdept_dept',
  as: 'subDepartments',
});



// ─── Employee ↔ SubDepartment ───────────────────────────────────────────────

Employee.belongsTo(SubDepartment, { foreignKey: 'sub_department_id', as: 'subDepartment' });
SubDepartment.hasMany(Employee,   { foreignKey: 'sub_department_id', as: 'employees'     });

// ─── Employee ↔ Designation ─────────────────────────────────────────────────

Employee.belongsTo(Designation, { foreignKey: 'designation_id', as: 'designation' });
Designation.hasMany(Employee,   { foreignKey: 'designation_id', as: 'employees'   });

// ─── Designation ↔ DesignationDepartment ↔ Department ───────────────────────

Designation.hasMany(DesignationDepartment, {
  foreignKey: 'designation_id',
  as: 'department_mappings',
});

DesignationDepartment.belongsTo(Designation, {
  foreignKey: 'designation_id',
  as: 'designation',
});

DesignationDepartment.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

Department.hasMany(DesignationDepartment, {
  foreignKey: 'department_id',
  as: 'designation_mappings',
});

Designation.belongsToMany(Department, {
  through: DesignationDepartment,
  foreignKey: 'designation_id',
  otherKey: 'department_id',
  as: 'departments',
});

Department.belongsToMany(Designation, {
  through: DesignationDepartment,
  foreignKey: 'department_id',
  otherKey: 'designation_id',
  as: 'designations',
});

// ─── Employee ↔ SubDesignation ───────────────────────────────────────────────

Employee.belongsTo(SubDesignation, { foreignKey: 'sub_designation_id', as: 'subDesignation' });
SubDesignation.hasMany(Employee,   { foreignKey: 'sub_designation_id', as: 'employees'      });

// ─── SubDesignation ↔ SubDesignationDesignation ↔ Designation ───────────────

SubDesignation.hasMany(SubDesignationDesignation, {
  foreignKey: 'sub_designation_id',
  as: 'designation_mappings',
});

SubDesignationDesignation.belongsTo(SubDesignation, {
  foreignKey: 'sub_designation_id',
  as: 'sub_designation',
});

SubDesignationDesignation.belongsTo(Designation, {
  foreignKey: 'designation_id',
  as: 'designation',
});

Designation.hasMany(SubDesignationDesignation, {
  foreignKey: 'designation_id',
  as: 'sub_designation_mappings',
});

// SubDesignation.belongsToMany(Designation, {
//   through: SubDesignationDesignation,
//   foreignKey: 'sub_designation_id',
//   otherKey: 'designation_id',
//   as: 'designations',
// });

// Designation.belongsToMany(SubDesignation, {
//   through: SubDesignationDesignation,
//   foreignKey: 'designation_id',
//   otherKey: 'sub_designation_id',
//   as: 'sub_designations',
// });



SubDesignation.belongsToMany(Designation, {
  through: SubDesignationDesignation,
  foreignKey: 'sub_designation_id',
  otherKey: 'designation_id',
  uniqueKey: 'uniq_subdesig_desig',
  as: 'designations',
});

Designation.belongsToMany(SubDesignation, {
  through: SubDesignationDesignation,
  foreignKey: 'designation_id',
  otherKey: 'sub_designation_id',
  uniqueKey: 'uniq_subdesig_desig',
  as: 'sub_designations',
});

// ─── Employee ↔ Reporting Manager (self-referential) ─────────────────────────

// Employee.belongsTo(Employee, { foreignKey: 'reporting_manager_id', as: 'manager'   });
// Employee.hasMany(Employee,   { foreignKey: 'reporting_manager_id', as: 'reportees' });

// ─── Department Hierarchy ────────────────────────────────────────────────────

Department.belongsTo(Employee, { foreignKey: 'head_id', as: 'head' });

// ─── OTP Requests (auth log) ──────────────────────────────────────────────────

Employee.hasMany(OtpRequest,   { foreignKey: 'employee_id', as: 'otpRequests' });
OtpRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee'    });

// ─── Employee ↔ Role (many-to-many via employee_roles) ───────────────────────

Employee.belongsToMany(Role, {
  through: EmployeeRole,
  foreignKey: 'employee_id',
  otherKey: 'role_id',
  as: 'roles',
});

Role.belongsToMany(Employee, {
  through: EmployeeRole,
  foreignKey: 'role_id',
  otherKey: 'employee_id',
  as: 'employees',
});

// ─── EmployeeRole Direct Associations ────────────────────────────────────────

EmployeeRole.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
EmployeeRole.belongsTo(Role,     { foreignKey: 'role_id',     as: 'role'     });

Employee.hasMany(EmployeeRole, { foreignKey: 'employee_id', as: 'employeeRoles' });
Role.hasMany(EmployeeRole,     { foreignKey: 'role_id',     as: 'employeeRoles' });

// ─── Role ↔ RoleModulePermission ─────────────────────────────────────────────

Role.hasMany(RoleModulePermission, {
  foreignKey: 'role_id',
  as: 'modulePermissions',
});

RoleModulePermission.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

// ─── Role ↔ Permission ───────────────────────────────────────────────────────

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });
RolePermission.belongsTo(Role,       { foreignKey: 'role_id',       as: 'role'       });

// ─── RoleTemplate ↔ RoleTemplatePermission ───────────────────────────────────

RoleTemplate.hasMany(RoleTemplatePermission, {
  foreignKey: 'template_id',
  as: 'permissions',
});

RoleTemplatePermission.belongsTo(RoleTemplate, {
  foreignKey: 'template_id',
  as: 'template',
});

// ─── Role ↔ RoleTemplate ─────────────────────────────────────────────────────

Role.belongsTo(RoleTemplate, { foreignKey: 'template_id', as: 'template' });
RoleTemplate.hasMany(Role,   { foreignKey: 'template_id', as: 'roles'    });

// ─── Attendance ──────────────────────────────────────────────────────────────

Employee.hasMany(Attendance,   { foreignKey: 'employee_id', as: 'attendance' });
Attendance.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee'   });

// ─── Leave ───────────────────────────────────────────────────────────────────

Employee.hasMany(LeaveRequest,   { foreignKey: 'employee_id', as: 'leaveRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee'      });

// ─── Candidates ───────────────────────────────────────────────────────────────
Candidate.hasMany(CandidateAnswer,   { foreignKey: 'candidate_id', as: 'aptitudeAnswers' });
CandidateAnswer.belongsTo(Candidate, { foreignKey: 'candidate_id', as: 'candidate'       });
Candidate.hasMany(CandidateEmployment,   { foreignKey: 'candidate_id', as: 'employments' });
CandidateEmployment.belongsTo(Candidate, { foreignKey: 'candidate_id', as: 'candidate'   });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leaveType' });
LeaveType.hasMany(LeaveRequest,   { foreignKey: 'leave_type_id', as: 'requests'  });

// ─── Payroll ─────────────────────────────────────────────────────────────────

PayrollRun.hasMany(Payslip,      { foreignKey: 'payroll_run_id', as: 'payslips'    });
Payslip.belongsTo(PayrollRun,    { foreignKey: 'payroll_run_id', as: 'payrollRun'  });

Employee.hasMany(Payslip,   { foreignKey: 'employee_id', as: 'payslips' });
Payslip.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

// (Candidate ↔ CandidateAnswer / CandidateEmployment associations are defined
//  once in the "Candidates" block above — the duplicate here was a merge
//  artifact and made Sequelize throw on the repeated `aptitudeAnswers` alias.)

// ─── Form Builder ────────────────────────────────────────────────────────────

HrModule.hasMany(FormDefinition,      { foreignKey: 'module_id', as: 'forms'  });
FormDefinition.belongsTo(HrModule,    { foreignKey: 'module_id', as: 'module' });

FormDefinition.hasMany(DynamicField, { foreignKey: 'form_id', as: 'fields' });
DynamicField.belongsTo(FormDefinition, { foreignKey: 'form_id', as: 'form' });

DynamicField.hasMany(FieldOption, { foreignKey: 'field_id', as: 'options' });
FieldOption.belongsTo(DynamicField, { foreignKey: 'field_id', as: 'field' });

DynamicField.hasMany(FieldPermissionV2, { foreignKey: 'field_id', as: 'fieldPerms' });
FieldPermissionV2.belongsTo(DynamicField, { foreignKey: 'field_id', as: 'field' });

// ─── PermissionGroup ↔ Permission ────────────────────────────────────────────

PermissionGroup.belongsToMany(Permission, {
  through: GroupPermission,
  foreignKey: 'group_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

Permission.belongsToMany(PermissionGroup, {
  through: GroupPermission,
  foreignKey: 'permission_id',
  otherKey: 'group_id',
  as: 'groups',
});

GroupPermission.belongsTo(PermissionGroup, { foreignKey: 'group_id', as: 'group' });
GroupPermission.belongsTo(Permission,      { foreignKey: 'permission_id', as: 'permission' });

PermissionGroup.hasMany(GroupPermission, { foreignKey: 'group_id', as: 'groupPermissions' });

// ─── PermissionGroup ↔ Employee ──────────────────────────────────────────────

PermissionGroup.belongsToMany(Employee, {
  through: UserGroup,
  foreignKey: 'group_id',
  otherKey: 'employee_id',
  as: 'members',
});

Employee.belongsToMany(PermissionGroup, {
  through: UserGroup,
  foreignKey: 'employee_id',
  otherKey: 'group_id',
  as: 'permissionGroups',
});

UserGroup.belongsTo(PermissionGroup, { foreignKey: 'group_id', as: 'group' });
UserGroup.belongsTo(Employee,        { foreignKey: 'employee_id', as: 'employee' });

PermissionGroup.hasMany(UserGroup, { foreignKey: 'group_id', as: 'userGroups' });
Employee.hasMany(UserGroup,        { foreignKey: 'employee_id', as: 'userGroups' });

// ─── Assets ──────────────────────────────────────────────────────────────────

AssetAssignment.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(AssetAssignment,   { foreignKey: 'employee_id', as: 'assetAssignments' });

AssetRequest.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(AssetRequest,   { foreignKey: 'employee_id', as: 'assetRequests' });

// ─── Attendance Regularization ───────────────────────────────────────────────

AttendanceRegularization.belongsTo(Employee, { foreignKey: 'employee_id' });

// ─── Exports ─────────────────────────────────────────────────────────────────

export {
  // Auth / Identity
  Employee,
  OtpRequest,
  EmployeeRole,
  RoleTemplate,
  RoleTemplatePermission,
  // Org structure
  Company,
  Department,
  CompanyDepartment,
  SubDepartment,
  SubDepartmentDepartment,
  Designation,
  DesignationDepartment,
  SubDesignation,
  SubDesignationDesignation,
  // Roles & Permission
  Role,
  Permission,
  RolePermission,
  RoleModulePermission,
  // HR modules
  Attendance,
  LeaveType, LeaveRequest,
  Candidate, CandidateEmployment,
  AptitudeTest, AptitudeQuestion, CandidateAnswer,
  PayrollRun, Payslip,
  Notification, ActivityLog,
  EmailBranding, EmailTemplate,
  HrModule, FormDefinition, DynamicField, FieldOption,
  FieldPermissionV2, RoleAssignment,
  UserModulePermission, UserFieldPermission,
  PermissionGroup, GroupPermission, UserGroup,
  Asset, AssetCategory, AssetAssignment, AssetRequest, AssetMaintenance, CompanyManager,
  EmployeePermission, EmployeeExperience, EmployeeExit, EmployeeOnboardingDocs, EmployeeTransfer,
  EmployeeCommitmentProbation, EmployeeAddress, EmployeeAssetDeduction, EmployeeBankDetail, EmployeeEducation,
  EmployeeSchemes, EmployeePersonal, EmployeeFamily, EmployeeEmergencyContact, EmployeeStatutory, EmployeeSalary,
  EmployeeLocationAttendance, EmployeeManagersWorkContact, EmployeeFamilyMember, EmployeeExperienceFlag,
  EmployeeVaccination, EmployeeDocument,
  AttendanceRegularization,
};
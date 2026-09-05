import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import {employeeRoutes} from '../modules/employees/employee.routes';
import departmentRoutes from '../modules/departments/department.routes';
import subDepartmentRoutes from "../modules/sub-departments/subDepartment.routes"
import designationRoutes from '../modules/designations/designation.routes';
import attendanceRoutes from '../modules/attendance/attendance.routes';
import leaveRoutes from '../modules/leaves/leave.routes';
import payrollRoutes from '../modules/payroll/payroll.routes';
import candidateRoutes from '../modules/candidates/candidate.routes';
import aptitudeRoutes from '../modules/ats-tests/aptitude.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import logsRoutes from '../modules/compliance/activity.routes';
import emailTemplateRoutes from '../modules/email-templates/emailTemplate.routes';
import rbacRoutes from '../modules/form-builder/formBuilder.routes';
import { userPermissionsRouter } from '../modules/user-permissions/userPermissions.controller';
import { permissionGroupRouter } from '../modules/permission-groups/permissionGroups.routes';
import { companyRouter } from '../modules/company/company.controller';
import mssqlAttendanceRouter from "../modules/attendance/attendance.mssql.routes"
import attendanceCombinedRouter from '../modules/attendance/attendance-combined.routes';
import trackolaRouter from '../modules/attendance/trackola.routes';
import shiftRouter from '../modules/shifts/shift.routes';
import locationRoutes from '../modules/locations/location.routes';
import weeklyOffPresetRouter from '../modules/weeklyoffPreset/weeklyOffPreset.routes';
import employeeTypeRoutes from '../modules/employeeType/employeeType.routes';
import employeeStatusRoutes from '../modules/employeeStatus/employeeStatus.routes';
import probationRoutes from '../modules/probation/probation.routes';
import noticePeriodRoutes from '../modules/notice/noticePeriod.routes';
import exitStatusRoutes from '../modules/exitStatus/exitStatus.routes';
import bondRoutes from '../modules/bond/bond.routes';
import insuredAmountRoutes from '../modules/insuredAmount/insuredAmount.routes';
import genderRoutes from '../modules/gender/gender.routes'; 
import maritalStatusRoutes from '../modules/marital-status/marital-status.router'
import bloodGroupRoutes from '../modules/bloodGroup/blood-group.router';
import religionRoutes from '../modules/religion/religion.router';
import nationalityRoutes from '../modules/nationality/nationality.router'
import shirtSizeRoutes from '../modules/shirt-size/shirt-size.router'
import qualificationRoutes from '../modules/qualification/qualification.router'
import educationModeRoutes from '../modules/education-mode/education-mode.router'
import houseTypeRoutes from '../modules/house-type/house-type.router'
import emergencyRelationshipRoutes from '../modules/emergency-relationship/emergency-relationship.router'
import salutationRoutes from '../modules/salutation/salutation.router'
import bankRoutes from '../modules/banks/bank.router'
import modeofPaymentRoutes from '../modules/mode-of-payment/mode-of-payment.router'
import attendanceRulesRoutes from '../modules/attendance-rules/attendance-rule.routes'
import holidayRoutes from '../modules/holiday/holiday.route'

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'NexHR API running', version: '2.0.0', timestamp: new Date().toISOString() }));


router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/sub-department',subDepartmentRoutes);
router.use('/designations', designationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/attendance/mssql', mssqlAttendanceRouter);
router.use('/attendance/combined', attendanceCombinedRouter);
router.use('/attendance/trackola', trackolaRouter);
router.use('/leaves', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/candidates', candidateRoutes);
router.use('/aptitude', aptitudeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/logs', logsRoutes);
router.use('/email-templates', emailTemplateRoutes);
router.use('/rbac', rbacRoutes);
router.use('/user-permissions', userPermissionsRouter);
router.use('/permission-groups', permissionGroupRouter);
router.use('/companies', companyRouter);
router.use('/shifts', shiftRouter);
router.use('/', locationRoutes);
router.use('/weekly-off-preset', weeklyOffPresetRouter);
router.use('/employee-types',employeeTypeRoutes);
router.use('/employee-statuses', employeeStatusRoutes);
router.use('/probation',probationRoutes);
router.use('/notice-periods',noticePeriodRoutes);
router.use('/exit-statuses', exitStatusRoutes);
router.use('/bonds',bondRoutes);
router.use('/insured-amounts', insuredAmountRoutes);
router.use('/genders',genderRoutes);
router.use('/marital-statuses',maritalStatusRoutes);
router.use('/blood-groups',bloodGroupRoutes);
router.use('/religions',religionRoutes);
router.use('/nationalities',nationalityRoutes);
router.use('/shirt-sizes',shirtSizeRoutes);
router.use('/qualifications',qualificationRoutes);
router.use('/education-modes',educationModeRoutes);
router.use('/house-types',houseTypeRoutes);
router.use('/emergency-relationships',emergencyRelationshipRoutes);
router.use('/salutations',salutationRoutes);
router.use('/banks',bankRoutes);
router.use('/modes-of-payment',modeofPaymentRoutes);
router.use('/attendance-rules',attendanceRulesRoutes);
router.use('/holidays',holidayRoutes);

export default router;
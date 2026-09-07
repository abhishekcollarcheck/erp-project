
import { EmployeeLeaveInformation, getEmployeeLeaveInformation, getMonthlyAttendanceSummary, MonthlyAttendanceSummary } from "./leave.service";
import { calculateCasualLeave } from "./rules/casualLeave.rule";
import { calculateEarnedLeave } from "./rules/earnedLeave.rule";

/* ============================================================
   TYPES
============================================================ */

// export interface LeaveRuleResult {
//   leave_type_code: string;
//   leave_type_name: string;
//   eligible: boolean;
//   earned_days: number;
//   rule: string;
//   reason: string;
// }

export interface LeaveRuleResult {
  leave_type_code: string;
  leave_type_name: string;
  eligible: boolean;
  earned_days: number;
  rule: string;
  reason: string;

  // Used specifically when leave is credited
  // to the probation EL account instead of normal EL.
  probation_el_earned?: number;
}

export interface MonthlyLeaveCalculation {
  employee_id: number;
  year: number;
  month: number;
  employee: EmployeeLeaveInformation;
  attendance: MonthlyAttendanceSummary;
  leaves: LeaveRuleResult[];
}
/* ============================================================
   MAIN RULE ENGINE
============================================================ */
// export async function calculateMonthlyLeave(
//   employeeId: number,
//   year: number,
//   month: number
// ): Promise<MonthlyLeaveCalculation> {
//   console.log('');
//   console.log('============================================');
//   console.log('        MONTHLY LEAVE RULE ENGINE');
//   console.log('============================================');
//   console.log('Employee ID:', employeeId);
//   console.log('Year:', year);
//   console.log('Month:', month);
//   /*
//    * ----------------------------------------------------------
//    * 1. GET EMPLOYEE INFORMATION
//    * ----------------------------------------------------------
//    *
//    * This comes from the REAL database.
//    */
//   const processingDate = new Date(
//     year,
//     month,
//     0
//   );
//   const employee =
//     await getEmployeeLeaveInformation(
//       employeeId,
//       processingDate
//     );
//   /*
//    * ----------------------------------------------------------
//    * 2. GET MONTHLY ATTENDANCE
//    * ----------------------------------------------------------
//    *
//    * TEMPORARY STATIC DATA FOR NOW.
//    *
//    * Later this service will query the real attendance table.
//    */
//   const attendance =
//     await getMonthlyAttendanceSummary(
//       employeeId,
//       year,
//       month
//     );
//   /*
//    * ----------------------------------------------------------
//    * 3. CALCULATE ALL LEAVE RULES
//    * ----------------------------------------------------------
//    */
//   const leaves: LeaveRuleResult[] = [];
//   /*
//    * ==========================================================
//    * RULE 1 — CASUAL LEAVE
//    * ==========================================================
//    *
//    * Policy:
//    *
//    * Employee must have at least 20 present days
//    * in the month to earn 1 CL.
//    */
//   const clEligible =
//     attendance.presentDays >= 20;
//   leaves.push({
//     leave_type_code: 'CL',
//     leave_type_name: 'Casual Leave',
//     eligible: clEligible,
//     earned_days: clEligible ? 1 : 0,
//     rule: '20+ present days in a month = 1 CL',
//     reason: clEligible
//       ? `Employee has ${attendance.presentDays} present days. Minimum requirement is 20 present days.`
//       : `Employee has ${attendance.presentDays} present days. Minimum 20 present days are required.`,
//   });
//   /*
//    * ----------------------------------------------------------
//    * RETURN CALCULATION
//    * ----------------------------------------------------------
//    */
//   return {
//     employee_id: employeeId,
//     year,
//     month,
//     employee,
//     attendance,
//     leaves,
//   };
// }



// export async function calculateMonthlyLeave(
//   employeeId: number,
//   year: number,
//   month: number
// ): Promise<MonthlyLeaveCalculation> {

//   console.log('');
//   console.log('============================================');
//   console.log('        MONTHLY LEAVE RULE ENGINE');
//   console.log('============================================');
//   console.log('Employee ID:', employeeId);
//   console.log('Year:', year);
//   console.log('Month:', month);

//   /*
//    * ==========================================================
//    * 1. GET EMPLOYEE INFORMATION
//    * ==========================================================
//    */

//   const processingDate = new Date(year, month, 0);

//   const employee =
//     await getEmployeeLeaveInformation(
//       employeeId,
//       processingDate
//     );

//   /*
//    * ==========================================================
//    * 2. GET MONTHLY ATTENDANCE
//    * ==========================================================
//    */

//   const attendance =
//     await getMonthlyAttendanceSummary(
//       employeeId,
//       year,
//       month
//     );

//   /*
//    * ==========================================================
//    * 3. CALCULATE ALL LEAVE RULES
//    * ==========================================================
//    */

//   const leaves: LeaveRuleResult[] = [];

//   /*
//    * ==========================================================
//    * RULE 1 — CASUAL LEAVE
//    * ==========================================================
//    *
//    * Policy:
//    *
//    * Employee must have at least 20 present days
//    * in the month to earn 1 CL.
//    */

//   const clEligible =
//     attendance.presentDays >= 20;

//   const clEarnedDays =
//     clEligible ? 1 : 0;

//   const clReason = clEligible
//     ? `Employee has ${attendance.presentDays} present days. Minimum requirement is 20 present days. Employee is eligible for 1 CL.`
//     : `Employee has ${attendance.presentDays} present days. Minimum 20 present days are required. Employee is not eligible for CL.`;

//   leaves.push({
//     leave_type_code: 'CL',
//     leave_type_name: 'Casual Leave',
//     eligible: clEligible,
//     earned_days: clEarnedDays,
//     rule: '20+ present days in a month = 1 CL',
//     reason: clReason,
//   });

//   /*
//    * ==========================================================
//    * 4. PRINT RULE RESULT
//    * ==========================================================
//    */

//   console.log('');
//   console.log('============================================');
//   console.log('           LEAVE RULE RESULTS');
//   console.log('============================================');

//   for (const leave of leaves) {
//     console.log('');
//     console.log(`Leave Type       : ${leave.leave_type_name}`);
//     console.log(`Code             : ${leave.leave_type_code}`);
//     console.log(`Eligible         : ${leave.eligible}`);
//     console.log(`Earned Days      : ${leave.earned_days}`);
//     console.log(`Rule             : ${leave.rule}`);
//     console.log(`Reason           : ${leave.reason}`);
//   }

//   console.log('');
//   console.log('============================================');
//   console.log('        MONTHLY CALCULATION COMPLETE');
//   console.log('============================================');

//   /*
//    * ==========================================================
//    * 5. RETURN CALCULATION
//    * ==========================================================
//    */

//   return {
//     employee_id: employeeId,
//     year,
//     month,
//     employee,
//     attendance,
//     leaves,
//   };
// }


export async function calculateMonthlyLeave(
  employeeId: number,
  year: number,
  month: number
): Promise<MonthlyLeaveCalculation> {
  // ==================================================
  // VALIDATION
  // ==================================================
  if (!employeeId || employeeId <= 0) {
    console.error(
      "[ENGINE ERROR] Invalid employee ID:",
      employeeId
    );
    throw new Error("Invalid employee ID");
  }
  if (!year || year < 2000) {
    console.error(
      "[ENGINE ERROR] Invalid year:",
      year
    );
    throw new Error("Invalid year");
  }
  if (!month || month < 1 || month > 12) {
    console.error(
      "[ENGINE ERROR] Invalid month:",
      month
    );
    throw new Error("Invalid month");
  }
  /*
   * Last day of the month.
   *
   * Example:
   * year = 2026
   * month = 8
   *
   * processingDate = 31 August 2026
   */
  const processingDate = new Date(
    year,
    month,
    0
  );
  const employee =
    await getEmployeeLeaveInformation(
      employeeId,
      processingDate
    );
  
  /*
   * TEMPORARY STATIC ATTENDANCE
   *
   * This will be replaced with the real
   * attendance service later.
   */
  const attendance =
    await getMonthlyAttendanceSummary(
      employeeId,
      year,
      month
    );
  

  const leaves: LeaveRuleResult[] = [];

  // ==================================================
  // RULE 1 - CASUAL LEAVE
  // =================================================

  const casualLeave =
    calculateCasualLeave(attendance);

  console.dir(casualLeave, {
    depth: null,
  });

  leaves.push(casualLeave);

  // ==================================================
  // RULE 2 - EARNED LEAVE
  // ==================================================

  const earnedLeave =
    calculateEarnedLeave(
      employee,
      attendance,
      year,
      month
    );

  leaves.push(earnedLeave);
  // ==================================================
  // FINAL SUMMARY
  // ==================================================
  const totalEarnedDays =
    leaves.reduce(
      (total, leave) =>
        total + Number(leave.earned_days || 0),
      0
    );
  // ==================================================
  // RETURN
  // ==================================================
  return {
    employee_id: employeeId,
    year,
    month,
    employee,
    attendance,
    leaves,
  };
}
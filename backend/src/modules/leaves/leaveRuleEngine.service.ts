
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

  console.log("");
  console.log("==================================================");
  console.log("          MONTHLY LEAVE RULE ENGINE");
  console.log("==================================================");
  console.log("[ENGINE] Starting monthly leave calculation");
  console.log("[ENGINE] Employee ID :", employeeId);
  console.log("[ENGINE] Year        :", year);
  console.log("[ENGINE] Month       :", month);
  console.log("==================================================");
  // ==================================================
  // VALIDATION
  // ==================================================
  console.log("");
  console.log("[ENGINE] STEP 0 - VALIDATION");
  console.log("--------------------------------------------------");
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
  console.log("[ENGINE] Validation successful");
  // ==================================================
  // PROCESSING DATE
  // ==================================================
  console.log("");
  console.log("[ENGINE] STEP 1 - PROCESSING DATE");
  console.log("--------------------------------------------------");
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
  console.log(
    "[ENGINE] Processing Date:",
    processingDate
  );
  // ==================================================
  // GET EMPLOYEE INFORMATION
  // ==================================================
  console.log("");
  console.log("[ENGINE] STEP 2 - EMPLOYEE INFORMATION");
  console.log("--------------------------------------------------");
  console.log(
    "[ENGINE] Fetching employee information..."
  );
  const employee =
    await getEmployeeLeaveInformation(
      employeeId,
      processingDate
    );
  console.log(
    "[ENGINE] Employee information fetched successfully"
  );
  console.log(
    "[ENGINE] Employee:"
  );
  console.dir(
    employee,
    {
      depth: null
    }
  );
  // ==================================================
  // EMPLOYEE STATUS DEBUG
  // ==================================================
  console.log("");
  console.log("[ENGINE] EMPLOYEE STATUS");
  console.log("--------------------------------------------------");
  console.log(
    "[ENGINE] Employee ID:",
    employee.employee.id
  );
  console.log(
    "[ENGINE] Employee Code:",
    employee.employee.employee_code
  );
  console.log(
    "[ENGINE] Employee Name:",
    employee.employee.full_name
  );
  console.log(
    "[ENGINE] Employment Type:",
    employee.employee.employment_type
  );
  console.log(
    "[ENGINE] Joining Date:",
    employee.joining_date
  );
  console.log(
    "[ENGINE] Leave Status:",
    employee.leave_status
  );
  console.log(
    "[ENGINE] Probation Exists:",
    employee.probation.exists
  );
  console.log(
    "[ENGINE] On Probation:",
    employee.probation.on_probation
  );
  console.log(
    "[ENGINE] Probation End Date:",
    employee.probation.probation_end_date
  );
  console.log(
    "[ENGINE] Probation Completed:",
    employee.probation_completed
  );
  console.log(
    "[ENGINE] Confirmation Status:",
    employee.probation.confirmation_status
  );
  // ==================================================
  // GET ATTENDANCE
  // ==================================================
  console.log("");
  console.log("[ENGINE] STEP 3 - MONTHLY ATTENDANCE");
  console.log("--------------------------------------------------");
  console.log(
    "[ENGINE] Fetching attendance summary..."
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
  console.log(
    "[ENGINE] Attendance summary fetched"
  );
  console.log("");
  console.log("[ENGINE] ATTENDANCE SUMMARY");
  console.log("--------------------------------------------------");
  console.log(
    "[ENGINE] Employee ID:",
    attendance.employeeId
  );
  console.log(
    "[ENGINE] Year:",
    attendance.year
  );
  console.log(
    "[ENGINE] Month:",
    attendance.month
  );
  console.log(
    "[ENGINE] Calendar Days:",
    attendance.totalCalendarDays
  );
  console.log(
    "[ENGINE] Working Days:",
    attendance.workingDays
  );
  console.log(
    "[ENGINE] Present Days:",
    attendance.presentDays
  );
  console.log(
    "[ENGINE] Absent Days:",
    attendance.absentDays
  );
  console.log(
    "[ENGINE] Half Days:",
    attendance.halfDays
  );
  console.log(
    "[ENGINE] WFH Days:",
    attendance.wfhDays
  );
  console.log(
    "[ENGINE] Leave Days:",
    attendance.leaveDays
  );
  console.log(
    "[ENGINE] Holiday Worked:",
    attendance.holidayWorkedDays
  );
  console.log(
    "[ENGINE] Weekly Off Worked:",
    attendance.weeklyOffWorkedDays
  );
  console.log(
    "[ENGINE] Total Working Hours:",
    attendance.totalWorkingHours
  );
  // ==================================================
  // CALCULATE RULES
  // ==================================================

  console.log("");
  console.log("[ENGINE] STEP 4 - RULE CALCULATION");
  console.log("--------------------------------------------------");

  const leaves: LeaveRuleResult[] = [];

  // ==================================================
  // RULE 1 - CASUAL LEAVE
  // ==================================================

  console.log("");
  console.log("[ENGINE] Executing Rule 1: Casual Leave");
  console.log("--------------------------------------------------");

  const casualLeave =
    calculateCasualLeave(attendance);

  console.log("[ENGINE] CL Rule Result:");

  console.dir(casualLeave, {
    depth: null,
  });

  leaves.push(casualLeave);

  // ==================================================
  // RULE 2 - EARNED LEAVE
  // ==================================================

  console.log("");
  console.log("[ENGINE] Executing Rule 2: Earned Leave");
  console.log("--------------------------------------------------");

  const earnedLeave =
    calculateEarnedLeave(
      employee,
      attendance,
      year,
      month
    );

  console.log("[ENGINE] EL Rule Result:");

  console.dir(earnedLeave, {
    depth: null,
  });

  leaves.push(earnedLeave);
  // ==================================================
  // RULE SUMMARY
  // ==================================================
  console.log("");
  console.log("==================================================");
  console.log("             LEAVE RULE RESULTS");
  console.log("==================================================");
  console.log(
    "[ENGINE] Total Rules Executed:",
    leaves.length
  );
  for (const leave of leaves) {
    console.log("");
    console.log(
      "--------------------------------------------------"
    );
    console.log(
      "Leave Type     :",
      leave.leave_type_name
    );
    console.log(
      "Code           :",
      leave.leave_type_code
    );
    console.log(
      "Eligible       :",
      leave.eligible
    );
    console.log(
      "Earned Days    :",
      leave.earned_days
    );
    console.log(
      "Rule           :",
      leave.rule
    );
    console.log(
      "Reason         :",
      leave.reason
    );
  }
  // ==================================================
  // FINAL SUMMARY
  // ==================================================
  console.log("");
  console.log("==================================================");
  console.log("             FINAL CALCULATION");
  console.log("==================================================");
  const totalEarnedDays =
    leaves.reduce(
      (total, leave) =>
        total + Number(leave.earned_days || 0),
      0
    );
  console.log(
    "[ENGINE] Total Leave Types Calculated:",
    leaves.length
  );
  console.log(
    "[ENGINE] Total Earned Leave:",
    totalEarnedDays
  );
  console.log(
    "[ENGINE] Calculation Status: SUCCESS"
  );
  console.log("==================================================");
  console.log("       MONTHLY CALCULATION COMPLETE");
  console.log("==================================================");
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
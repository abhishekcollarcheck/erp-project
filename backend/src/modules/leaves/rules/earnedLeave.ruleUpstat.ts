// import {
//   EmployeeLeaveInformation,
//   MonthlyAttendanceSummary,
// } from "../leave.service";

// import { LeaveRuleResult } from "../leaveRuleEngine.service";

// /* ============================================================
//    TYPES
// ============================================================ */

// export interface EarnedLeaveCalculationOptions {
//   /**
//    * Total EL accumulated in the probation EL account
//    * before the current processing month.
//    *
//    * Example:
//    * 1.25 + 1.25 + 1.25 = 3.75
//    */
//   probationEarnedEL?: number;
// }
// /* ============================================================
//    HELPER
// ============================================================ */

// /**
//  * Returns true when the processing month is the same
//  * month in which the employee joined.
//  */
// function isJoiningMonth(
//   joiningDate: string | Date | null,
//   year: number,
//   month: number
// ): boolean {
//   if (!joiningDate) {
//     return false;
//   }
//   const date = new Date(joiningDate);
//   if (Number.isNaN(date.getTime())) {
//     return false;
//   }
//   return (
//     date.getFullYear() === year &&
//     date.getMonth() + 1 === month
//   );
// }

// /**
//  * Returns true when the employee is still in probation
//  * during the month being processed.
//  *
//  * Policy:
//  * Probation leave calculation starts from the month
//  * after joining.
//  */
// function isProbationMonth(
//   employee: EmployeeLeaveInformation,
//   year: number,
//   month: number
// ): boolean {
//   const probationEndDate =
//     employee.probation.probation_end_date;
//   const joiningDate =
//     employee.joining_date;
//   if (!probationEndDate) {
//     return false;
//   }
//   const endDate = new Date(probationEndDate);
//   if (Number.isNaN(endDate.getTime())) {
//     return false;
//   }
//   /*
//    * Joining month itself is NOT treated as
//    * a probation month.
//    */
//   if (
//     isJoiningMonth(
//       joiningDate,
//       year,
//       month
//     )
//   ) {
//     return false;
//   }
//   /*
//    * Compare the first day of the processing month
//    * with the probation end date.
//    *
//    * Example:
//    *
//    * Joining: 10 Jan
//    * Probation end: 30 Jun
//    *
//    * Feb → probation
//    * Mar → probation
//    * Apr → probation
//    * May → probation
//    * Jun → probation
//    * Jul → regular
//    */
//   const processingMonthStart =
//     new Date(year, month - 1, 1);

//   return processingMonthStart <= endDate;
// }

// /**
//  * Determines whether the employee is in the
//  * first regular month immediately after probation.
//  */
// function isFirstMonthAfterProbation(
//   employee: EmployeeLeaveInformation,
//   year: number,
//   month: number
// ): boolean {
//   const probationEndDate =
//     employee.probation.probation_end_date;
//   if (!probationEndDate) {
//     return false;
//   }
//   const endDate = new Date(probationEndDate);
//   if (Number.isNaN(endDate.getTime())) {
//     return false;
//   }
//   /*
//    * First day of the month after probation.
//    */
//   const firstRegularMonth =
//     new Date(
//       endDate.getFullYear(),
//       endDate.getMonth() + 1,
//       1
//     );
//   const processingMonth =
//     new Date(
//       year,
//       month - 1,
//       1
//     );
//   return (
//     firstRegularMonth.getFullYear() ===
//       processingMonth.getFullYear() &&
//     firstRegularMonth.getMonth() ===
//       processingMonth.getMonth()
//   );
// }

// /* ============================================================
//    MAIN RULE
// ============================================================ */
// export function calculateEarnedLeave(
//   employee: EmployeeLeaveInformation,
//   attendance: MonthlyAttendanceSummary,
//   options: EarnedLeaveCalculationOptions = {}
// ): LeaveRuleResult {
//   /* ==========================================================
//      INITIAL DATA
//   ========================================================== */
//   const {
//     probationEarnedEL = 0,
//   } = options;
//   const safeProbationEarnedEL =
//     Math.max(
//       0,
//       Number(probationEarnedEL) || 0
//     );
//   const presentDays =
//     Number(attendance.presentDays) || 0;
//   const year =
//     attendance.year;
//   const month =
//     attendance.month;
//   const joiningDate =
//     employee.joining_date;
//   const employmentType =
//     employee.employee.employment_type;
//   const leaveStatus =
//     employee.leave_status;
//   const probationEndDate =
//     employee.probation.probation_end_date;
//   /* ==========================================================
//      DEBUG
//   ========================================================== */
//   console.log("");
//   console.log(
//     "=================================================="
//   );
//   console.log(
//     "[EL RULE] EARNED LEAVE CALCULATION"
//   );
//   console.log(
//     "=================================================="
//   );
//   console.log(
//     "[EL RULE] Employee ID:",
//     employee.employee.id
//   );
//   console.log(
//     "[EL RULE] Employee Code:",
//     employee.employee.employee_code
//   );
//   console.log(
//     "[EL RULE] Employee Name:",
//     employee.employee.full_name
//   );
//   console.log(
//     "[EL RULE] Employment Type:",
//     employmentType
//   );
//   console.log(
//     "[EL RULE] Leave Status:",
//     leaveStatus
//   );
//   console.log(
//     "[EL RULE] Joining Date:",
//     joiningDate
//   );
//   console.log(
//     "[EL RULE] Processing Year:",
//     year
//   );
//   console.log(
//     "[EL RULE] Processing Month:",
//     month
//   );
//   console.log(
//     "[EL RULE] Present Days:",
//     presentDays
//   );
//   console.log(
//     "[EL RULE] Probation End Date:",
//     probationEndDate
//   );
//   console.log(
//     "[EL RULE] Previous Probation EL:",
//     safeProbationEarnedEL
//   );
//   /* ==========================================================
//      COMMON ATTENDANCE CONDITION
//   ========================================================== */
//   const attendanceEligible =
//     presentDays >= 20;
//   console.log("");
//   console.log(
//     "[EL RULE] Attendance Check"
//   );
//   console.log(
//     "[EL RULE] Present Days:",
//     presentDays
//   );
//   console.log(
//     "[EL RULE] Required Present Days: 20"
//   );
//   console.log(
//     "[EL RULE] Attendance Eligible:",
//     attendanceEligible
//   );
//   /* ==========================================================
//      RULE 2A — NEW JOINING
//   ========================================================== */
//   const joiningMonth =
//     isJoiningMonth(
//       joiningDate,
//       year,
//       month
//     );
//   console.log("");
//   console.log(
//     "[EL RULE] New Joining Check"
//   );
//   console.log(
//     "[EL RULE] Is Joining Month:",
//     joiningMonth
//   );

//   if (joiningMonth) {
//     const joiningDay =
//       new Date(joiningDate!).getDate();
//     console.log(
//       "[EL RULE] Joining Day:",
//       joiningDay
//     );
//     /*
//      * According to the provided policy:
//      *
//      * New Joining (>15)      → EL 0
//      * New Joining (2–15)     → EL 0
//      *
//      * Therefore EL remains 0 for the joining month.
//      *
//      * The 0.5 shown for New Joining (0.5)
//      * belongs to CL, not EL.
//      */
//     console.log(
//       "[EL RULE] Employee is in joining month."
//     );
//     console.log(
//       "[EL RULE] New Joining EL = 0"
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       probation_el_earned: 0,
//       rule:
//         "New joining month = 0 EL",
//       reason:
//         `Employee joined in the current month (joining day ${joiningDay}). As per the leave policy, EL credit for the joining month is 0.`,
//     };
//   }
//   /* ==========================================================
//      RULE 2B — PROBATION
//   ========================================================== */
//   const probationMonth =
//     isProbationMonth(
//       employee,
//       year,
//       month
//     );
//   console.log("");
//   console.log(
//     "[EL RULE] Probation Check"
//   );
//   console.log(
//     "[EL RULE] Is Probation Month:",
//     probationMonth
//   );
//   if (probationMonth) {
//     console.log(
//       "[EL RULE] Employee is currently in probation."
//     );
//     /*
//      * Policy:
//      *
//      * Probation
//      * Working Days >= 20
//      *
//      * Probation EL Account = 1.25
//      * Normal EL = 0
//      */
//     if (attendanceEligible) {
//       console.log(
//         "[EL RULE] Probation attendance eligible."
//       );
//       console.log(
//         "[EL RULE] Normal EL Credit: 0"
//       );
//       console.log(
//         "[EL RULE] Probation EL Account Credit: 1.25"
//       );
//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         /*
//          * This is deliberately 0 because
//          * probation EL is stored separately.
//          */
//         earned_days: 0,
//         probation_el_earned: 1.25,
//         rule:
//           "Probation + 20 or more present days = 1.25 Probation EL Account",
//         reason:
//           `Employee is on probation and has ${presentDays} present days. Minimum requirement is 20 present days. 1.25 EL is credited to the Probation EL Account; normal EL remains 0.`,
//       };
//     }
//     console.log(
//       "[EL RULE] Probation attendance NOT eligible."
//     );
//     console.log(
//       "[EL RULE] Normal EL Credit: 0"
//     );
//     console.log(
//       "[EL RULE] Probation EL Account Credit: 0"
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       probation_el_earned: 0,
//       rule:
//         "Probation + less than 20 present days = 0 EL",
//       reason:
//         `Employee is on probation and has only ${presentDays} present days. Minimum 20 present days are required. No EL is credited to the Probation EL Account.`,
//     };
//   }

//   /* ==========================================================
//      RULE 2C — CONTRACTUAL
//   ========================================================== */
//   if (
//     employmentType === "Contractual"
//   ) {
//     console.log("");
//     console.log(
//       "[EL RULE] Contractual Employee"
//     );
//     if (attendanceEligible) {
//       console.log(
//         "[EL RULE] Contractual attendance eligible."
//       );
//       console.log(
//         "[EL RULE] EL Credit: 1.25"
//       );
//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: 1.25,
//         probation_el_earned: 0,
//         rule:
//           "Contractual + 20 or more present days = 1.25 EL",
//         reason:
//           `Employee is contractual and has ${presentDays} present days. Minimum requirement is 20 present days. Employee earns 1.25 EL.`,
//       };
//     }
//     console.log(
//       "[EL RULE] Contractual attendance NOT eligible."
//     );
//     console.log(
//       "[EL RULE] EL Credit: 0"
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       probation_el_earned: 0,
//       rule:
//         "Contractual + less than 20 present days = 0 EL",
//       reason:
//         `Employee is contractual and has ${presentDays} present days. Minimum 20 present days are required. Employee does not earn EL.`,
//     };
//   }
//   /* ==========================================================
//      RULE 2D — REGULAR AFTER PROBATION
//   ========================================================== */
//   const afterProbation =
//     employee.probation_completed === true;
//   const firstMonthAfterProbation =
//     isFirstMonthAfterProbation(
//       employee,
//       year,
//       month
//     );
//   console.log("");
//   console.log(
//     "[EL RULE] Regular After Probation Check"
//   );
//   console.log(
//     "[EL RULE] Probation Completed:",
//     afterProbation
//   );
//   console.log(
//     "[EL RULE] First Month After Probation:",
//     firstMonthAfterProbation
//   );
//   /*
//    * If probation is completed and this is
//    * the first regular month after probation,
//    * apply the "After Probation" rule.
//    */
//   if (
//     afterProbation &&
//     firstMonthAfterProbation
//   ) {
//     console.log(
//       "[EL RULE] Applying REGULAR AFTER PROBATION rule."
//     );
//     console.log(
//       "[EL RULE] Previous Probation EL:",
//       safeProbationEarnedEL
//     );

//     if (attendanceEligible) {
//       const earnedDays =
//         1.25 +
//         safeProbationEarnedEL;
//       console.log(
//         "[EL RULE] Current Month EL: 1.25"
//       );
//       console.log(
//         "[EL RULE] Probation EL:",
//         safeProbationEarnedEL
//       );
//       console.log(
//         "[EL RULE] Final EL:",
//         earnedDays
//       );
//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: earnedDays,
//         probation_el_earned: 0,
//         rule:
//           "After probation + 20 or more present days = 1.25 + Total EL Earned During Probation",
//         reason:
//           `Employee has completed probation and has ${presentDays} present days. Current month EL is 1.25 plus ${safeProbationEarnedEL} EL accumulated during probation. Total EL credited is ${earnedDays}.`,
//       };
//     }
//     /*
//      * Attendance < 20
//      *
//      * Current month EL = 0
//      *
//      * But previously accumulated probation EL
//      * remains available.
//      */
//     console.log(
//       "[EL RULE] Current month attendance below requirement."
//     );
//     console.log(
//       "[EL RULE] Current Month EL: 0"
//     );
//     console.log(
//       "[EL RULE] Previous Probation EL:",
//       safeProbationEarnedEL
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days:
//         safeProbationEarnedEL,
//       probation_el_earned: 0,
//       rule:
//         "After probation + less than 20 present days = Total EL Earned During Probation",
//       reason:
//         `Employee has completed probation but has only ${presentDays} present days. Current month EL credit is 0. Previously accumulated probation EL of ${safeProbationEarnedEL} remains.`,
//     };
//   }
//   /* ==========================================================
//      RULE 2E — REGULAR CONTINUING
//   ========================================================== */
//   if (
//     afterProbation
//   ) {
//     console.log("");
//     console.log(
//       "[EL RULE] Applying REGULAR CONTINUING rule."
//     );
//     if (attendanceEligible) {
//       console.log(
//         "[EL RULE] Regular attendance eligible."
//       );
//       console.log(
//         "[EL RULE] EL Credit: 1.25"
//       );
//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: 1.25,
//         probation_el_earned: 0,
//         rule:
//           "Regular Continuing + 20 or more present days = 1.25 EL",
//         reason:
//           `Employee is continuing under the regular scheme and has ${presentDays} present days. Minimum requirement is 20 present days. Employee earns 1.25 EL.`,
//       };
//     }
//     console.log(
//       "[EL RULE] Regular attendance NOT eligible."
//     );
//     console.log(
//       "[EL RULE] EL Credit: 0"
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       probation_el_earned: 0,
//       rule:
//         "Regular Continuing + less than 20 present days = 0 EL",
//       reason:
//         `Employee is continuing under the regular scheme and has ${presentDays} present days. Minimum 20 present days are required. Employee does not earn EL.`,
//     };
//   }
//   /* ==========================================================
//      FALLBACK
//   ========================================================== */
//   console.warn("");
//   console.warn(
//     "[EL RULE] No EL policy condition matched."
//   );
//   console.warn(
//     "[EL RULE] Employment Type:",
//     employmentType
//   );
//   console.warn(
//     "[EL RULE] Leave Status:",
//     leaveStatus
//   );
//   return {
//     leave_type_code: "EL",
//     leave_type_name: "Earned Leave",
//     eligible: false,
//     earned_days: 0,
//     probation_el_earned: 0,
//     rule:
//       "No matching EL policy condition",
//     reason:
//       `No Earned Leave rule matched for employee status "${leaveStatus}" and employment type "${employmentType}". No EL has been credited.`,
//   };
// }




// import {
//   EmployeeLeaveInformation,
//   MonthlyAttendanceSummary,
// } from "../leave.service";

// import { LeaveRuleResult } from "../leaveRuleEngine.service";

/* ============================================================
   RULE 2 — EARNED LEAVE
============================================================ */

/**
 * Earned Leave Policy
 *
 * 1. New Joining
 *    - No EL is earned.
 *
 * 2. Probation
 *    - >= 20 present days:
 *        EL Credit = 0
 *        Probation EL Account = 1.25
 *
 *    - < 20 present days:
 *        EL Credit = 0
 *        Probation EL Account = 0
 *
 * 3. Regular - After Probation Completion
 *    - >= 20 present days:
 *        EL = 1.25 + EL earned during probation
 *
 *    - < 20 present days:
 *        EL = 0 + EL earned during probation
 *
 * 4. Regular - Continuing
 *    - >= 20 present days:
 *        EL = 1.25
 *
 *    - < 20 present days:
 *        EL = 0
 *
 * 5. Contractual
 *    - >= 20 present days:
 *        EL = 1.25
 *
 *    - < 20 present days:
 *        EL = 0
 *
 * NOTE:
 * The actual accumulated "EL earned during probation"
 * will later come from the leave balance/database.
 * For now we keep it as 0 because that historical
 * accumulation has not yet been connected.
 */

// export function calculateEarnedLeave(
//   employee: EmployeeLeaveInformation,
//   attendance: MonthlyAttendanceSummary,
//   year: number,
//   month: number
// ): LeaveRuleResult {
//   console.log("");
//   console.log("==================================================");
//   console.log("[EL RULE] EARNED LEAVE CALCULATION");
//   console.log("==================================================");

//   console.log("[EL RULE] Employee ID       :", employee.employee.id);
//   console.log("[EL RULE] Employee Name     :", employee.employee.full_name);
//   console.log("[EL RULE] Employment Type   :", employee.employee.employment_type);
//   console.log("[EL RULE] Leave Status      :", employee.leave_status);
//   console.log("[EL RULE] Joining Date      :", employee.joining_date);
//   console.log("[EL RULE] Probation End     :", employee.probation.probation_end_date);
//   console.log("[EL RULE] Probation Complete:", employee.probation_completed);
//   console.log("[EL RULE] Year              :", year);
//   console.log("[EL RULE] Month             :", month);
//   console.log("[EL RULE] Present Days      :", attendance.presentDays);

//   const presentDays = Number(attendance.presentDays || 0);

//   const minimumPresentDays = 20;

//   const eligibleByAttendance =
//     presentDays >= minimumPresentDays;

//   console.log("");
//   console.log("[EL RULE] Attendance Check");
//   console.log("----------------------------------------");
//   console.log("[EL RULE] Present Days     :", presentDays);
//   console.log("[EL RULE] Required Days    :", minimumPresentDays);
//   console.log("[EL RULE] Attendance Pass  :", eligibleByAttendance);

//   /* ==========================================================
//      NEW JOINING
//   ========================================================== */

//   if (isNewJoining(employee, year, month)) {
//     console.log("");
//     console.log("[EL RULE] CASE: NEW JOINING");
//     console.log("----------------------------------------");

//     console.log(
//       "[EL RULE] Employee joined during the processing month."
//     );

//     console.log("[EL RULE] EL Credit: 0");

//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       rule: "New joining = 0 EL",
//       reason:
//         `Employee joined during ${year}-${String(month).padStart(2, "0")}. ` +
//         `No Earned Leave is credited in the joining month.`,
//     };
//   }

//   /* ==========================================================
//      PROBATION
//   ========================================================== */

//   if (
//     employee.leave_status === "PROBATION" &&
//     !employee.probation_completed
//   ) {
//     console.log("");
//     console.log("[EL RULE] CASE: PROBATION");
//     console.log("----------------------------------------");

//     if (eligibleByAttendance) {
//       console.log(
//         "[EL RULE] Attendance >= 20"
//       );

//       console.log(
//         "[EL RULE] Normal EL Credit : 0"
//       );

//       console.log(
//         "[EL RULE] Probation EL Account: 1.25"
//       );

//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: 1.25,
//         rule:
//           "During probation, 20+ present days = 1.25 EL in Probation EL Account",
//         reason:
//           `Employee is on probation and has ${presentDays} present days. ` +
//           `Minimum requirement is 20 present days. ` +
//           `1.25 EL is earned into the probation EL account.`,
//       };
//     }

//     console.log(
//       "[EL RULE] Attendance < 20"
//     );

//     console.log(
//       "[EL RULE] Probation EL Account: 0"
//     );

//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       rule:
//         "During probation, less than 20 present days = 0 EL",
//       reason:
//         `Employee is on probation and has ${presentDays} present days. ` +
//         `Minimum requirement is 20 present days. ` +
//         `No EL is earned this month.`,
//     };
//   }

//   /* ==========================================================
//      REGULAR — AFTER PROBATION
//   ========================================================== */

//   if (
//     employee.leave_status === "REGULAR_AFTER_PROBATION"
//   ) {
//     console.log("");
//     console.log("[EL RULE] CASE: REGULAR AFTER PROBATION");
//     console.log("----------------------------------------");

//     /*
//      * IMPORTANT:
//      *
//      * The policy says:
//      *
//      * 1.25 + Total of Earning EL during Probation
//      *
//      * We currently do not have the historical probation
//      * EL accumulation connected here.
//      *
//      * Therefore:
//      *
//      * probationEarnedEL = 0
//      *
//      * Later this value should come from the database.
//      */

//     const probationEarnedEL = 0;

//     console.log(
//       "[EL RULE] Historical Probation EL:",
//       probationEarnedEL
//     );

//     if (eligibleByAttendance) {
//       const earnedDays =
//         1.25 + probationEarnedEL;

//       console.log(
//         "[EL RULE] Current Month EL:",
//         1.25
//       );

//       console.log(
//         "[EL RULE] Probation EL:",
//         probationEarnedEL
//       );

//       console.log(
//         "[EL RULE] Total EL:",
//         earnedDays
//       );

//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: earnedDays,
//         rule:
//           "After probation completion, 20+ present days = 1.25 EL + total EL earned during probation",
//         reason:
//           `Employee has completed probation and has ${presentDays} present days. ` +
//           `Employee earns 1.25 EL for the month. ` +
//           `${probationEarnedEL} EL was earned during probation and is included.`,
//       };
//     }

//     const earnedDays =
//       probationEarnedEL;

//     console.log(
//       "[EL RULE] Attendance < 20"
//     );

//     console.log(
//       "[EL RULE] Current Month EL: 0"
//     );

//     console.log(
//       "[EL RULE] Probation EL:",
//       probationEarnedEL
//     );

//     console.log(
//       "[EL RULE] Total EL:",
//       earnedDays
//     );

//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: earnedDays,
//       rule:
//         "After probation completion, less than 20 present days = 0 current EL + total EL earned during probation",
//       reason:
//         `Employee has completed probation but has only ${presentDays} present days. ` +
//         `No current-month EL is earned. ` +
//         `${probationEarnedEL} EL from probation is retained.`,
//     };
//   }

//   /* ==========================================================
//      CONTRACTUAL
//   ========================================================== */

//   if (
//     employee.leave_status === "CONTRACTUAL" ||
//     employee.employee.employment_type === "Contractual"
//   ) {
//     console.log("");
//     console.log("[EL RULE] CASE: CONTRACTUAL");
//     console.log("----------------------------------------");

//     if (eligibleByAttendance) {
//       console.log(
//         "[EL RULE] Attendance >= 20"
//       );

//       console.log(
//         "[EL RULE] EL Credit: 1.25"
//       );

//       return {
//         leave_type_code: "EL",
//         leave_type_name: "Earned Leave",
//         eligible: true,
//         earned_days: 1.25,
//         rule:
//           "Contractual employee with 20+ present days = 1.25 EL",
//         reason:
//           `Contractual employee has ${presentDays} present days. ` +
//           `Minimum requirement is 20 present days. ` +
//           `Employee earns 1.25 EL.`,
//       };
//     }

//     console.log(
//       "[EL RULE] Attendance < 20"
//     );

//     console.log(
//       "[EL RULE] EL Credit: 0"
//     );

//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       rule:
//         "Contractual employee with less than 20 present days = 0 EL",
//       reason:
//         `Contractual employee has ${presentDays} present days. ` +
//         `Minimum 20 present days are required. ` +
//         `Employee does not earn EL this month.`,
//     };
//   }

//   /* ==========================================================
//      REGULAR — CONTINUING
//   ========================================================== */

//   console.log("");
//   console.log("[EL RULE] CASE: REGULAR CONTINUING");
//   console.log("----------------------------------------");

//   if (eligibleByAttendance) {
//     console.log(
//       "[EL RULE] Attendance >= 20"
//     );

//     console.log(
//       "[EL RULE] EL Credit: 1.25"
//     );

//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: true,
//       earned_days: 1.25,
//       rule:
//         "Regular employee with 20+ present days = 1.25 EL",
//       reason:
//         `Regular employee has ${presentDays} present days. ` +
//         `Minimum requirement is 20 present days. ` +
//         `Employee earns 1.25 EL.`,
//     };
//   }

//   console.log(
//     "[EL RULE] Attendance < 20"
//   );

//   console.log(
//     "[EL RULE] EL Credit: 0"
//   );

//   return {
//     leave_type_code: "EL",
//     leave_type_name: "Earned Leave",
//     eligible: false,
//     earned_days: 0,
//     rule:
//       "Regular employee with less than 20 present days = 0 EL",
//     reason:
//       `Regular employee has ${presentDays} present days. ` +
//       `Minimum 20 present days are required. ` +
//       `Employee does not earn EL this month.`,
//   };
// }

// /* ============================================================
//    HELPER — NEW JOINING
// ============================================================ */

// /**
//  * Determines whether the employee joined during
//  * the month currently being processed.
//  *
//  * Example:
//  *
//  * Joining Date: 2026-08-10
//  * Processing:  August 2026
//  *
//  * => true
//  *
//  * Joining Date: 2026-07-10
//  * Processing:  August 2026
//  *
//  * => false
//  */
// function isNewJoining(
//   employee: EmployeeLeaveInformation,
//   year: number,
//   month: number
// ): boolean {
//   if (!employee.joining_date) {
//     console.log(
//       "[EL RULE] No joining date available."
//     );
//     return false;
//   }
//   const joiningDate = new Date(
//     employee.joining_date
//   );
//   if (Number.isNaN(joiningDate.getTime())) {
//     console.warn(
//       "[EL RULE] Invalid joining date:",
//       employee.joining_date
//     );
//     return false;
//   }
//   const joiningYear =
//     joiningDate.getFullYear();
//   const joiningMonth =
//     joiningDate.getMonth() + 1;
//   console.log("");
//   console.log("[EL RULE] JOINING DATE CHECK");
//   console.log("----------------------------------------");
//   console.log(
//     "[EL RULE] Joining Date:",
//     employee.joining_date
//   );
//   console.log(
//     "[EL RULE] Joining Year:",
//     joiningYear
//   );
//   console.log(
//     "[EL RULE] Joining Month:",
//     joiningMonth
//   );
//   console.log(
//     "[EL RULE] Processing Year:",
//     year
//   );
//   console.log(
//     "[EL RULE] Processing Month:",
//     month
//   );
//   const result =
//     joiningYear === year &&
//     joiningMonth === month;
//   console.log(
//     "[EL RULE] New Joining:",
//     result
//   );
//   return result;
// }







// import { EmployeeLeaveInformation, MonthlyAttendanceSummary } from "../leave.service";
// import { LeaveRuleResult } from "../leaveRuleEngine.service";

// /* ============================================================
//    RULE 2 — EARNED LEAVE
// ============================================================ */

// /**
//  * Earned Leave Rule
//  *
//  * Current Policy:
//  *
//  * 1. Employee on probation:
//  *    → Earn 1.25 EL per eligible month.
//  *    → This amount will later be added to
//  *      employee_commitment_probation.probation_el_credit
//  *
//  * 2. Employee who has completed probation:
//  *    → Do NOT add probation EL.
//  *    → Regular EL calculation will be handled separately.
//  *
//  * IMPORTANT:
//  * This function ONLY calculates the entitlement.
//  * It does NOT update the database.
//  */
// export function calculateEarnedLeave(
//   employee: EmployeeLeaveInformation,
//   attendance: MonthlyAttendanceSummary,
//   year: number,
//   month: number
// ): LeaveRuleResult {

//   console.log("");
//   console.log("==================================================");
//   console.log("[EL RULE] EARNED LEAVE RULE");
//   console.log("==================================================");

//   console.log("[EL RULE] Employee ID:", employee.employee.id);
//   console.log("[EL RULE] Employee Name:", employee.employee.full_name);
//   console.log("[EL RULE] Year:", year);
//   console.log("[EL RULE] Month:", month);

//   console.log("");
//   console.log("[EL RULE] EMPLOYEE STATUS");
//   console.log("--------------------------------------------------");

//   console.log(
//     "[EL RULE] Employment Type:",
//     employee.employee.employment_type
//   );

//   console.log(
//     "[EL RULE] Joining Date:",
//     employee.joining_date
//   );

//   console.log(
//     "[EL RULE] Leave Status:",
//     employee.leave_status
//   );

//   console.log(
//     "[EL RULE] Probation Exists:",
//     employee.probation.exists
//   );

//   console.log(
//     "[EL RULE] On Probation:",
//     employee.probation.on_probation
//   );

//   console.log(
//     "[EL RULE] Probation Completed:",
//     employee.probation_completed
//   );

//   console.log(
//     "[EL RULE] Probation End Date:",
//     employee.probation.probation_end_date
//   );

//   console.log(
//     "[EL RULE] Confirmation Status:",
//     employee.probation.confirmation_status
//   );

//   console.log("");
//   console.log("[EL RULE] ATTENDANCE");
//   console.log("--------------------------------------------------");
//   console.log(
//     "[EL RULE] Present Days:",
//     attendance.presentDays
//   );
//   console.log(
//     "[EL RULE] Working Days:",
//     attendance.workingDays
//   );
//   console.log(
//     "[EL RULE] Absent Days:",
//     attendance.absentDays
//   );
//   console.log(
//     "[EL RULE] Leave Days:",
//     attendance.leaveDays
//   );
//   /* ==========================================================
//      BASIC CONSTANTS
//   ========================================================= */
//   const PROBATION_EL_PER_MONTH = 1.25;
//   console.log("");
//   console.log("[EL RULE] POLICY");
//   console.log("--------------------------------------------------");
//   console.log(
//     "[EL RULE] Probation EL / Month:",
//     PROBATION_EL_PER_MONTH
//   );
//   /* ==========================================================
//      CHECK 1 — PROBATION
//   ========================================================== */
//   console.log("");
//   console.log("[EL RULE] CHECKING PROBATION STATUS");
//   console.log("--------------------------------------------------");
//   const isOnProbation =
//     employee.probation.exists === true &&
//     employee.probation.on_probation === true &&
//     employee.probation_completed === false;
//   console.log(
//     "[EL RULE] Is employee currently on probation?:",
//     isOnProbation
//   );
//   /* ==========================================================
//      PROBATION EMPLOYEE
//   ========================================================= */
//   if (isOnProbation) {
//     console.log("");
//     console.log("[EL RULE] RESULT: EMPLOYEE IS ON PROBATION");
//     console.log("--------------------------------------------------");
//     console.log(
//       "[EL RULE] Employee earns:",
//       PROBATION_EL_PER_MONTH,
//       "EL"
//     );
//     console.log(
//       "[EL RULE] Destination:",
//       "employee_commitment_probation.probation_el_credit"
//     );
//     console.log(
//       "[EL RULE] NOTE: Database update should be performed by"
//     );
//     console.log(
//       "[EL RULE] monthly processor / cron, NOT inside this rule."
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: true,
//       earned_days: PROBATION_EL_PER_MONTH,
//       rule:
//         "Employee on probation earns 1.25 EL per eligible month.",
//    reason:
//         `Employee is currently on probation and is eligible to earn ${PROBATION_EL_PER_MONTH} EL for ${year}-${String(month).padStart(2, "0")}. The ${PROBATION_EL_PER_MONTH} EL should be credited to probation_el_credit.`,
//     };
//   }
//   /* ==========================================================
//      PROBATION COMPLETED
//   ========================================================== */
//   console.log("");
//   console.log("[EL RULE] EMPLOYEE IS NOT CURRENTLY ON PROBATION");
//   console.log("--------------------------------------------------");
//   if (employee.probation_completed) {
//     console.log(
//       "[EL RULE] Probation has been completed."
//     );
//     console.log(
//       "[EL RULE] Probation EL accumulation will NOT happen here."
//     );
//     console.log(
//       "[EL RULE] Regular EL calculation should be handled separately."
//     );
//     return {
//       leave_type_code: "EL",
//       leave_type_name: "Earned Leave",
//       eligible: false,
//       earned_days: 0,
//       rule:
//         "Probation EL is applicable only while the employee is on probation.",
//       reason:
//         `Employee completed probation. No probation EL is added for ${year}-${String(month).padStart(2, "0")}. Regular Earned Leave processing will apply.`,
//     };
//   }
//   /* ==========================================================
//      NO PROBATION RECORD
//   ========================================================== */
//   console.log("");
//   console.log("[EL RULE] NO ACTIVE PROBATION");
//   console.log("--------------------------------------------------");
//   console.log(
//     "[EL RULE] Employee is not eligible for probation EL."
//   );
//   return {
//     leave_type_code: "EL",
//     leave_type_name: "Earned Leave",
//     eligible: false,
//     earned_days: 0,
//     rule:
//       "Probation EL requires an active probation period.",
//     reason:
//       `Employee does not have an active probation period for ${year}-${String(month).padStart(2, "0")}. No probation EL is credited.`,
//   };
// }













import {
  EmployeeLeaveInformation,
  MonthlyAttendanceSummary,
} from "../leave.service";

import { LeaveRuleResult } from "../leaveRuleEngine.service";

/* ============================================================
   CONSTANTS
============================================================ */

const MONTHLY_EL = 1.25;
const MIN_PRESENT_DAYS = 20;

/* ============================================================
   HELPERS
============================================================ */

/**
 * Returns YYYY-MM for a date.
 */
function getYearMonth(dateValue: string | Date | null): string | null {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

/**
 * Returns YYYY-MM for the processing month.
 */
function getProcessingYearMonth(
  year: number,
  month: number
): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/* ============================================================
   RULE 2 — EARNED LEAVE
============================================================ */

/**
 * EARNED LEAVE POLICY
 *
 * ------------------------------------------------------------
 * CASE 1 — EMPLOYEE IS ON PROBATION
 * ------------------------------------------------------------
 *
 * Employee earns:
 *
 *      1.25 EL / month
 *
 * This amount belongs to:
 *
 *      employee_commitment_probation.probation_el_credit
 *
 *
 * ------------------------------------------------------------
 * CASE 2 — TRANSITION MONTH
 * ------------------------------------------------------------
 *
 * After probation is completed, the first month after
 * probation is the transition month.
 *
 * Example:
 *
 * Probation ends:
 *      30 June 2026
 *
 * Confirmation:
 *      01 July 2026
 *
 * July = transition month
 *
 * In transition month:
 *
 *      Previous probation EL
 *             +
 *      1.25 EL if 20+ present days
 *
 *
 * Example:
 *
 *      probation_el_credit = 7.50
 *      presentDays = 21
 *
 *      7.50 + 1.25
 *      = 8.75 EL
 *
 *
 * If present days are below 20:
 *
 *      7.50 + 0
 *      = 7.50 EL
 *
 *
 * ------------------------------------------------------------
 * CASE 3 — NORMAL POST-PROBATION
 * ------------------------------------------------------------
 *
 * After the transition month:
 *
 *      20+ present days → 1.25 EL
 *      <20 present days  → 0 EL
 *
 * ------------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This rule ONLY calculates the result.
 *
 * Database updates should be handled by the monthly
 * leave processor / cron.
 */
export function calculateEarnedLeave(
  employee: EmployeeLeaveInformation,
  attendance: MonthlyAttendanceSummary,
  year: number,
  month: number
): LeaveRuleResult {

  console.log("");
  console.log("==================================================");
  console.log("[EL RULE] EARNED LEAVE RULE");
  console.log("==================================================");

  console.log("[EL RULE] Employee ID:", employee.employee.id);
  console.log("[EL RULE] Employee Name:", employee.employee.full_name);
  console.log("[EL RULE] Processing Year:", year);
  console.log("[EL RULE] Processing Month:", month);

  /* ==========================================================
     BASIC INFORMATION
  ========================================================== */

  console.log("");
  console.log("[EL RULE] EMPLOYEE INFORMATION");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Employment Type:",
    employee.employee.employment_type
  );

  console.log(
    "[EL RULE] Joining Date:",
    employee.joining_date
  );

  console.log(
    "[EL RULE] Leave Status:",
    employee.leave_status
  );

  console.log(
    "[EL RULE] Probation Exists:",
    employee.probation.exists
  );

  console.log(
    "[EL RULE] On Probation:",
    employee.probation.on_probation
  );

  console.log(
    "[EL RULE] Probation Completed:",
    employee.probation_completed
  );

  console.log(
    "[EL RULE] Probation End Date:",
    employee.probation.probation_end_date
  );

  console.log(
    "[EL RULE] Confirmation Date:",
    employee.probation.confirmed_on
  );

  /* ==========================================================
     PROBATION EL DATA
  ========================================================== */

  const probationElCredit = Number(
    employee.probation.probation_el_credit ?? 0
  );

  const transferredProbationElCredit = Number(
    employee.probation.probation_el_transferred ?? 0
  );

  console.log("");
  console.log("[EL RULE] PROBATION EL BALANCE");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Current Probation EL Credit:",
    probationElCredit
  );

  console.log(
    "[EL RULE] Already Transferred Probation EL:",
    transferredProbationElCredit
  );

  /* ==========================================================
     ATTENDANCE
  ========================================================== */

  console.log("");
  console.log("[EL RULE] ATTENDANCE");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Present Days:",
    attendance.presentDays
  );

  console.log(
    "[EL RULE] Required Present Days:",
    MIN_PRESENT_DAYS
  );

  const attendanceEligible =
    Number(attendance.presentDays) >= MIN_PRESENT_DAYS;

  console.log(
    "[EL RULE] Attendance Eligible:",
    attendanceEligible
  );

  /* ==========================================================
     PROCESSING MONTH
  ========================================================== */

  const processingYearMonth =
    getProcessingYearMonth(year, month);

  console.log("");
  console.log("[EL RULE] PROCESSING MONTH");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Processing Year-Month:",
    processingYearMonth
  );

  /* ==========================================================
     CASE 1 — CURRENTLY ON PROBATION
  ========================================================== */

  const isCurrentlyOnProbation =
    employee.probation.exists === true &&
    employee.probation.on_probation === true &&
    employee.probation_completed === false;

  if (isCurrentlyOnProbation) {

    console.log("");
    console.log("==================================================");
    console.log("[EL RULE] CASE 1 — ACTIVE PROBATION");
    console.log("==================================================");

    console.log(
      "[EL RULE] Employee is currently on probation."
    );

    console.log(
      "[EL RULE] Monthly probation EL:",
      MONTHLY_EL
    );

    console.log(
      "[EL RULE] Destination: probation_el_credit"
    );

    return {
      leave_type_code: "EL",
      leave_type_name: "Earned Leave",
      eligible: true,
      earned_days: MONTHLY_EL,

      rule:
        "Employee on probation earns 1.25 EL per month.",

      reason:
        `Employee is currently on probation. ${MONTHLY_EL} EL is earned for ${processingYearMonth} and should be added to probation_el_credit.`,
    };
  }

  /* ==========================================================
     CASE 2 — TRANSITION MONTH
  ========================================================== */

  /**
   * The transition month is the month immediately after
   * probation_end_date.
   *
   * Example:
   *
   * probation_end_date = 2026-06-30
   *
   * transition month = 2026-07
   */

  const probationEndYearMonth =
    getYearMonth(
      employee.probation.probation_end_date
    );

  let transitionYearMonth: string | null = null;

  if (employee.probation.probation_end_date) {

    const probationEndDate =
      new Date(employee.probation.probation_end_date);

    if (!Number.isNaN(probationEndDate.getTime())) {

      const transitionDate = new Date(
        probationEndDate.getFullYear(),
        probationEndDate.getMonth() + 1,
        1
      );

      transitionYearMonth =
        `${transitionDate.getFullYear()}-${String(
          transitionDate.getMonth() + 1
        ).padStart(2, "0")}`;
    }
  }

  console.log("");
  console.log("[EL RULE] TRANSITION MONTH CHECK");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Probation End Month:",
    probationEndYearMonth
  );

  console.log(
    "[EL RULE] Transition Month:",
    transitionYearMonth
  );

  console.log(
    "[EL RULE] Current Processing Month:",
    processingYearMonth
  );

  const isTransitionMonth =
    employee.probation_completed === true &&
    transitionYearMonth === processingYearMonth;

  console.log(
    "[EL RULE] Is Transition Month:",
    isTransitionMonth
  );

  if (isTransitionMonth) {

    console.log("");
    console.log("==================================================");
    console.log("[EL RULE] CASE 2 — TRANSITION MONTH");
    console.log("==================================================");

    console.log(
      "[EL RULE] Employee has completed probation."
    );

    console.log(
      "[EL RULE] This is the first month after probation."
    );

    console.log(
      "[EL RULE] Accumulated Probation EL:",
      probationElCredit
    );

    console.log(
      "[EL RULE] Present Days:",
      attendance.presentDays
    );

    let currentMonthEL = 0;

    if (attendanceEligible) {

      currentMonthEL = MONTHLY_EL;

      console.log(
        "[EL RULE] Employee has 20+ present days."
      );

      console.log(
        "[EL RULE] Current month EL:",
        currentMonthEL
      );

    } else {

      console.log(
        "[EL RULE] Employee has less than 20 present days."
      );

      console.log(
        "[EL RULE] Current month EL: 0"
      );
    }

    const totalEL =
      probationElCredit + currentMonthEL;

    console.log("");
    console.log("[EL RULE] TRANSITION CALCULATION");
    console.log("--------------------------------------------------");

    console.log(
      "[EL RULE] Probation EL:",
      probationElCredit
    );

    console.log(
      "[EL RULE] Current Month EL:",
      currentMonthEL
    );

    console.log(
      "[EL RULE] Total EL:",
      totalEL
    );

    console.log(
      "[EL RULE] Destination:",
      "Regular Earned Leave"
    );

    return {
      leave_type_code: "EL",
      leave_type_name: "Earned Leave",
      eligible: totalEL > 0,
      earned_days: totalEL,

      rule:
        "On transition month, accumulated probation EL is transferred and current month earns 1.25 EL when employee has 20+ present days.",

      reason:
        attendanceEligible
          ? `Employee completed probation and this is the transition month. ${probationElCredit} probation EL + ${MONTHLY_EL} current month EL = ${totalEL} EL.`
          : `Employee completed probation and this is the transition month. ${probationElCredit} probation EL is transferred, but the employee has only ${attendance.presentDays} present days, so no additional ${MONTHLY_EL} EL is earned.`,
    };
  }

  /* ==========================================================
     CASE 3 — NORMAL POST-PROBATION
  ========================================================== */

  console.log("");
  console.log("==================================================");
  console.log("[EL RULE] CASE 3 — NORMAL POST-PROBATION");
  console.log("==================================================");

  if (employee.probation_completed === true) {

    console.log(
      "[EL RULE] Employee completed probation."
    );

    console.log(
      "[EL RULE] This is NOT the transition month."
    );

    if (attendanceEligible) {

      console.log(
        "[EL RULE] Employee has 20+ present days."
      );

      console.log(
        "[EL RULE] Current month EL:",
        MONTHLY_EL
      );

      return {
        leave_type_code: "EL",
        leave_type_name: "Earned Leave",
        eligible: true,
        earned_days: MONTHLY_EL,

        rule:
          "After probation, employee earns 1.25 EL when present for 20+ days in the month.",

        reason:
          `Employee has completed probation and has ${attendance.presentDays} present days. Minimum requirement is ${MIN_PRESENT_DAYS}. Employee earns ${MONTHLY_EL} EL.`,
      };

    }

    console.log(
      "[EL RULE] Employee has less than 20 present days."
    );

    console.log(
      "[EL RULE] Current month EL: 0"
    );

    return {
      leave_type_code: "EL",
      leave_type_name: "Earned Leave",
      eligible: false,
      earned_days: 0,

      rule:
        "After probation, employee must have 20+ present days to earn 1.25 EL.",

      reason:
        `Employee has completed probation but has only ${attendance.presentDays} present days. Minimum ${MIN_PRESENT_DAYS} present days are required. No EL is earned.`,
    };
  }

  /* ==========================================================
     FALLBACK
  ========================================================== */

  console.log("");
  console.log("[EL RULE] FALLBACK");
  console.log("--------------------------------------------------");

  console.log(
    "[EL RULE] Employee does not satisfy any EL condition."
  );

  return {
    leave_type_code: "EL",
    leave_type_name: "Earned Leave",
    eligible: false,
    earned_days: 0,

    rule:
      "Employee does not currently satisfy the Earned Leave conditions.",

    reason:
      `No Earned Leave is calculated for ${processingYearMonth}.`,
  };
}
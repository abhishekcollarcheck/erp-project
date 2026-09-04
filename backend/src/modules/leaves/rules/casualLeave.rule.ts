import { MonthlyAttendanceSummary } from "../leave.service";
import { LeaveRuleResult } from "../leaveRuleEngine.service";

export function calculateCasualLeave(
  attendance: MonthlyAttendanceSummary
): LeaveRuleResult {

  console.log("");
  console.log("--------------------------------------------------");
  console.log("              CL RULE CALCULATION");
  console.log("--------------------------------------------------");

  console.log("[CL] Attendance Input:");
  console.log("[CL] Employee ID   :", attendance.employeeId);
  console.log("[CL] Year          :", attendance.year);
  console.log("[CL] Month         :", attendance.month);
  console.log("[CL] Present Days  :", attendance.presentDays);
  console.log("[CL] Working Days  :", attendance.workingDays);
  console.log("[CL] Absent Days   :", attendance.absentDays);
  console.log("[CL] Half Days     :", attendance.halfDays);
  console.log("[CL] WFH Days      :", attendance.wfhDays);
  console.log("[CL] Leave Days    :", attendance.leaveDays);

  // --------------------------------------------------
  // CL POLICY
  // --------------------------------------------------

  const requiredPresentDays = 20;
  const earnedLeaveDays = 1;

  console.log("");
  console.log("[CL] Policy:");
  console.log(
    `[CL] Minimum Present Days Required : ${requiredPresentDays}`
  );
  console.log(
    `[CL] Leave Earned If Eligible     : ${earnedLeaveDays}`
  );

  // --------------------------------------------------
  // ELIGIBILITY
  // --------------------------------------------------

  const eligible =
    attendance.presentDays >= requiredPresentDays;

  console.log("");
  console.log("[CL] Eligibility Calculation:");
  console.log(
    `[CL] ${attendance.presentDays} >= ${requiredPresentDays}`
  );
  console.log("[CL] Eligible:", eligible);

  // --------------------------------------------------
  // EARNED DAYS
  // --------------------------------------------------

  const earned_days =
    eligible ? earnedLeaveDays : 0;

  console.log("[CL] Earned Days:", earned_days);

  // --------------------------------------------------
  // REASON
  // --------------------------------------------------

  const reason = eligible
    ? `Employee has ${attendance.presentDays} present days. Minimum requirement is ${requiredPresentDays} present days. Employee is eligible for ${earnedLeaveDays} CL.`
    : `Employee has ${attendance.presentDays} present days. Minimum ${requiredPresentDays} present days are required. Employee is not eligible for CL.`;

  console.log("[CL] Reason:", reason);

  console.log("--------------------------------------------------");
  console.log("              CL RULE COMPLETE");
  console.log("--------------------------------------------------");

  return {
    leave_type_code: "CL",
    leave_type_name: "Casual Leave",
    eligible,
    earned_days,
    rule: "20+ present days in a month = 1 CL",
    reason,
  };
}
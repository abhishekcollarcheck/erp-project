import { MonthlyAttendanceSummary } from "../leave.service";
import { LeaveRuleResult } from "../leaveRuleEngine.service";

export function calculateCasualLeave(
  attendance: MonthlyAttendanceSummary
): LeaveRuleResult {
  // --------------------------------------------------
  // CL POLICY
  // --------------------------------------------------

  const requiredPresentDays = 20;
  const earnedLeaveDays = 1;

  // --------------------------------------------------
  // ELIGIBILITY
  // --------------------------------------------------

  const eligible =
    attendance.presentDays >= requiredPresentDays;

  // --------------------------------------------------
  // EARNED DAYS
  // --------------------------------------------------

  const earned_days =
    eligible ? earnedLeaveDays : 0;

  // --------------------------------------------------
  // REASON
  // --------------------------------------------------

  const reason = eligible
    ? `Employee has ${attendance.presentDays} present days. Minimum requirement is ${requiredPresentDays} present days. Employee is eligible for ${earnedLeaveDays} CL.`
    : `Employee has ${attendance.presentDays} present days. Minimum ${requiredPresentDays} present days are required. Employee is not eligible for CL.`;

  return {
    leave_type_code: "CL",
    leave_type_name: "Casual Leave",
    eligible,
    earned_days,
    rule: "20+ present days in a month = 1 CL",
    reason,
  };
}
import { calculateMonthlyLeave } from "./leaveRuleEngine.service";
import { postMonthlyLeaveCalculation } from "./monthlyLeavePosting.service";

export async function processMonthlyLeave(
  employeeId: number,
  year: number,
  month: number
) {
  const calculation =
    await calculateMonthlyLeave(
      employeeId,
      year,
      month
    );

  const postingResults =
    await postMonthlyLeaveCalculation(
      calculation
    );

  // ==================================================
  // FINAL
  // ==================================================

  return {
    calculation,
    postingResults,
  };
}
import { calculateMonthlyLeave } from "./leaveRuleEngine.service";
import { postMonthlyLeaveCalculation } from "./monthlyLeavePosting.service";

export async function processMonthlyLeave(
  employeeId: number,
  year: number,
  month: number
) {
  console.log('');
  console.log('==================================================');
  console.log('        MONTHLY LEAVE PROCESS');
  console.log('==================================================');

  console.log('[PROCESS] Employee:', employeeId);
  console.log('[PROCESS] Year:', year);
  console.log('[PROCESS] Month:', month);

  // ==================================================
  // STEP 1 - CALCULATE
  // ==================================================

  console.log('');
  console.log('[PROCESS] STEP 1 - RULE ENGINE');

  const calculation =
    await calculateMonthlyLeave(
      employeeId,
      year,
      month
    );

  console.log(
    '[PROCESS] Rule calculation completed'
  );

  // ==================================================
  // STEP 2 - POST
  // ==================================================

  console.log('');
  console.log('[PROCESS] STEP 2 - POST CALCULATION');

  const postingResults =
    await postMonthlyLeaveCalculation(
      calculation
    );

  console.log(
    '[PROCESS] Monthly leave posting completed'
  );

  // ==================================================
  // FINAL
  // ==================================================

  console.log('');
  console.log('==================================================');
  console.log('        MONTHLY LEAVE PROCESS COMPLETE');
  console.log('==================================================');

  return {
    calculation,
    postingResults,
  };
}
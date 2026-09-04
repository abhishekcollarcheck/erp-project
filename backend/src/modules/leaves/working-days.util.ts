/**
 * working-days.util.ts
 *
 * Working days for a calendar month = count(Full Day Present) +
 * 0.5 × count(First/Second Half Present). Holiday and Weekly Off
 * contribute ZERO, per your confirmation — they don't help clear the
 * ≥20 threshold, they just don't count against it either.
 *
 * Place at: backend/src/modules/leaves/working-days.util.ts
 */

import { attendanceCombinedService } from '../attendance/attendance-combined.service';

export async function getWorkingDaysInMonth(
  employeeId: number,
  companyId: number,
  year: number,
  month: number, // 1-indexed (1 = January)
): Promise<number> {
  const paddedMonth = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = `${year}-${paddedMonth}-01`;
  const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

  const rows = await attendanceCombinedService.getCombinedForEmployee(employeeId, startDate, endDate, companyId);

  let workingDays = 0;
  for (const row of rows) {
    if (row.finalStatus === 'PRESENT') workingDays += 1;
    else if (row.finalStatus === 'FIRST_HALF_PRESENT' || row.finalStatus === 'SECOND_HALF_PRESENT') workingDays += 0.5;
    // Full Day Absent, Holiday, Weekly Off, Unclassified, null → 0, no contribution
  }
  return workingDays;
}
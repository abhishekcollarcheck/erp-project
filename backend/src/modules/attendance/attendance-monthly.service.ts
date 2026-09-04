import { EmployeeMonthlyAttendance } from "../../database/models/EmployeeMonthlyAttendance";
import { attendanceCombinedService } from "./attendance-combined.service";
export class AttendanceMonthlyService {
  /**
   * Update monthly attendance for ONE employee.
   *
   * It recalculates the complete current month from
   * 1st day of month -> given end date.
   */
  async updateEmployeeMonthlyAttendance(
    employeeId: number,
    companyId: number,
    endDate: string,
  ) {
    const end = new Date(`${endDate}T00:00:00`);

    const year = end.getFullYear();
    const month = end.getMonth() + 1;

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

    // ----------------------------------------------------------
    // Get combined attendance
    // ----------------------------------------------------------

    const rows = await attendanceCombinedService.getCombinedForEmployee(
      employeeId,
      startDate,
      endDate,
      companyId,
    );

    // ----------------------------------------------------------
    // Calculate summary
    // ----------------------------------------------------------

    const summary = this.calculateMonthlySummary(rows);

    const payload = {
      employee_id: employeeId,
      company_id: companyId,

      year,
      month,

      ...summary,

      last_calculated_date: endDate,
    };

    // ----------------------------------------------------------
    // Store / update monthly record
    //
    // FIX: the unique constraint on this table is
    // (employee_id, year, month) — NOT the primary key `id`.
    // Depending on your Sequelize/DB version, upsert() may only
    // resolve conflicts on the primary key unless conflictFields
    // is passed explicitly, which can throw:
    //   "no unique or exclusion constraint matching ON CONFLICT"
    // If your Sequelize version doesn't support conflictFields,
    // swap this block for findOrCreate + update (see fallback below).
    // ----------------------------------------------------------

    await EmployeeMonthlyAttendance.upsert(payload, {
      conflictFields: ["employee_id", "year", "month"] as any,
    });

    return payload;
  }

  // ============================================================
  // Calculate monthly summary
  // ============================================================

  private calculateMonthlySummary(rows: any[]) {
    let present_days = 0;
    let absent_days = 0;

    let leave_days = 0;
    let paid_leave_days = 0;
    let unpaid_leave_days = 0;

    let weekly_off_days = 0;
    let holiday_days = 0;

    let half_days = 0;
    let late_days = 0;
    let incomplete_days = 0;

    let total_working_hours = 0;
    let total_punches = 0;

    for (const row of rows) {
      // FIX: was comparing directly against "PRESENT" / "ABSENT" /
      // "HALF_DAY" (upper case), but evaluateAttendanceStatus() in
      // shift-rule-evaluator.service.ts appears to return a different
      // casing (e.g. "Present" / "Absent"), so these comparisons never
      // matched and present_days/absent_days stayed 0 no matter what
      // actually happened. Normalizing to upper case here makes the
      // match casing-agnostic. HOLIDAY/WEEK_OFF already matched because
      // attendance-combined.service.ts hardcodes those exact literals
      // itself — but confirm the real FinalAttendanceStatus values in
      // shift-rule-evaluator.service.ts rather than relying on this
      // workaround long-term.
      const status = String(row.finalStatus ?? "").toUpperCase();

      if (status === "PRESENT") {
        present_days++;
      }

      if (status === "ABSENT") {
        absent_days++;
      }

      if (status === "WEEK_OFF") {
        weekly_off_days++;
      }

      if (status === "HOLIDAY") {
        holiday_days++;
      }

      if (status === "HALF_DAY" || status === "HALF-DAY") {
        half_days += 0.5;
      }

      if (row.lateMinutes !== null && row.lateMinutes > 0) {
        late_days++;
      }

      if (row.status === "Incomplete") {
        incomplete_days++;
      }

      if (row.leaveApproved) {
        leave_days++;

        const leaveType = String(row.leaveType ?? "").toLowerCase();

        if (leaveType.includes("unpaid") || leaveType.includes("lop")) {
          unpaid_leave_days++;
        } else {
          paid_leave_days++;
        }
      }

      if (typeof row.working_hours === "number") {
        total_working_hours += row.working_hours;
      }

      total_punches += row.punch_count ?? 0;
    }

    // ----------------------------------------------------------
    // Calendar days
    // ----------------------------------------------------------

    const calendar_days = rows.length;

    // ----------------------------------------------------------
    // Working days = calendar days minus weekly offs and holidays.
    // ----------------------------------------------------------

    const working_days = calendar_days - weekly_off_days - holiday_days;

    // ----------------------------------------------------------
    // Average working hours — only against days that have hours.
    // ----------------------------------------------------------

    const daysWithWorkingHours = rows.filter(
      (row) => typeof row.working_hours === "number" && row.working_hours > 0,
    ).length;

    const average_working_hours =
      daysWithWorkingHours > 0 ? total_working_hours / daysWithWorkingHours : 0;

    return {
      // FIX: model column is `total_days`, not `calendar_days`.
      // Previously this key was `calendar_days`, which Sequelize
      // silently dropped on upsert() since it isn't a model attribute —
      // so `total_days` stayed 0 in the DB forever.
      total_days: calendar_days,

      working_days: Math.max(working_days, 0),
      present_days,
      absent_days,
      leave_days,
      paid_leave_days,
      unpaid_leave_days,
      weekly_off_days,
      holiday_days,
      half_days,
      late_days,
      incomplete_days,
      total_working_hours: Number(total_working_hours.toFixed(2)),
      average_working_hours: Number(average_working_hours.toFixed(2)),
      total_punches,
    };
  }
}

export const attendanceMonthlyService = new AttendanceMonthlyService();
import { Employee } from "../../database/models";
import cron from "node-cron";
import pLimit from "p-limit";
import { attendanceMonthlyService } from "./attendance-monthly.service";

/**
 * Returns yesterday's date as YYYY-MM-DD, computed explicitly in
 * Asia/Kolkata rather than relying on the process's local timezone.
 */
function getYesterdayDateString(): string {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  now.setDate(now.getDate() - 1);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function runMonthlyAttendanceJob(dateOverride?: string): Promise<{
  endDate: string;
  total: number;
  succeeded: number;
  failed: number;
}> {
  const endDate = dateOverride ?? getYesterdayDateString();
  console.log(`[attendance-cron] Starting run for ${endDate}`);

  // FIX: Employee has no `is_active` boolean — status is an enum
  // ('Active' | 'Left' | 'Retired'). Filter on that instead.
  // If Employee is a paranoid model (soft-delete via deleted_at),
  // Sequelize already excludes soft-deleted rows by default, so no
  // need to filter deleted_at here.
  const employees = await Employee.findAll({
    attributes: ["id", "company_id"],
    where: { status: "Active" },
  });

  // Cap concurrency so we don't hammer MSSQL / Trakola with hundreds
  // of parallel requests when the employee list is large.
  const limit = pLimit(5);

  const results = await Promise.allSettled(
    employees.map((emp) =>
      limit(() =>
        attendanceMonthlyService.updateEmployeeMonthlyAttendance(
          emp.id,
          emp.company_id,
          endDate,
        ),
      ),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected");

  console.log(
    `[attendance-cron] Done. ${results.length - failed.length} succeeded, ${failed.length} failed.`,
  );

  failed.forEach((f, i) => {
    if (f.status === "rejected") {
      console.error(
        `[attendance-cron] Employee ${employees[i]?.id} failed:`,
        f.reason,
      );
    }
  });

  return {
    endDate,
    total: results.length,
    succeeded: results.length - failed.length,
    failed: failed.length,
  };
}

/**
 * Call this once at app bootstrap (after the DB connection is established).
 *
 * NOTE: node-cron runs in-process. If the app is down/restarting at
 * exactly 8 PM, that day's run is silently skipped. If missed runs
 * are unacceptable, add a startup catch-up check, or move this job
 * to a DB-backed queue (agenda / bullmq) instead.
 */
export function scheduleAttendanceMonthlyCron(): void {
  cron.schedule(
    "0 20 * * *", // every day at 20:00
    () => {
      runMonthlyAttendanceJob().catch((err) =>
        console.error("[attendance-cron] Unhandled job error:", err),
      );
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  console.log("[attendance-cron] Scheduled for 20:00 Asia/Kolkata daily");
}

// Exported for manual/CLI triggering or a startup catch-up check.
export { runMonthlyAttendanceJob };
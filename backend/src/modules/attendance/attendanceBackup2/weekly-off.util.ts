/**
 * weekly-off.util.ts
 *
 * Place at: backend/src/modules/attendance/weekly-off.util.ts
 *
 * Sunday is unconditionally off for everyone. Saturday depends on
 * Employee.saturday_off, whose exact type/enum values are NOT YET
 * CONFIRMED — see isSaturdayOff() below. Every branch there is a guess;
 * correct it once the real field shape is known.
 */

export function isWeeklyOff(dateStr: string, saturdayOff: unknown): { isOff: boolean; reason: string | null } {
  const day = new Date(dateStr + 'T00:00:00').getDay(); // 0 = Sunday, 6 = Saturday

  if (day === 0) {
    return { isOff: true, reason: 'WEEKLY_OFF_SUNDAY' };
  }

  if (day === 6) {
    const off = isSaturdayOff(dateStr, saturdayOff);
    return { isOff: off, reason: off ? 'WEEKLY_OFF_SATURDAY' : null };
  }

  return { isOff: false, reason: null };
}

/**
 * ⚠️ UNCONFIRMED — Employee.saturday_off's real type/values are not known.
 * Handles the shapes that seem plausible given SATURDAY_OFF_OPTIONS being
 * a multi-choice options array (not a simple checkbox):
 *   - boolean: true = every Saturday off, false = every Saturday working
 *   - 'ALL' / 'NONE' strings
 *   - comma-separated week-of-month numbers, e.g. "1,3" = 1st & 3rd Saturday off
 * If the real field doesn't match any of these, this function needs to be
 * rewritten to match — do not trust this logic against real payroll data
 * until confirmed.
 */
function isSaturdayOff(dateStr: string, saturdayOff: unknown): boolean {
  if (typeof saturdayOff === 'boolean') {
    return saturdayOff;
  }

  if (typeof saturdayOff === 'string') {
    const normalized = saturdayOff.trim().toUpperCase();
    if (normalized === 'ALL' || normalized === 'ALL SATURDAYS') return true;
    if (normalized === 'NONE' || normalized === '') return false;

    // "1,3" style — which occurrence of Saturday in the month is this?
    const weekNumbers = normalized.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    if (weekNumbers.length > 0) {
      const date = new Date(dateStr + 'T00:00:00');
      const occurrence = Math.ceil(date.getDate() / 7); // 1st/2nd/3rd/4th/5th Saturday of the month
      return weekNumbers.includes(occurrence);
    }
  }

  // Unrecognized shape — fail safe to "not off" rather than silently
  // marking someone absent-exempt incorrectly. Surface this loudly.
  console.warn(
    `[weekly-off] Could not interpret Employee.saturday_off value: ${JSON.stringify(saturdayOff)} — treating Saturday as a working day. Confirm the real field shape.`,
  );
  return false;
}
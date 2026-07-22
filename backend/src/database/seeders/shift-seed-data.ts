/**
 * shift-seed-data.ts
 *
 * Shift seed data + label parser, kept separate from seeder.ts so the main
 * seeder file only needs one import + one function call — minimizes the
 * chance of a copy-paste error in a file that already runs a lot of other
 * seeding logic.
 *
 * Place at: backend/src/database/seeders/shift-seed-data.ts
 * (adjust the two relative imports below if your actual folder depth differs)
 */

import { Transaction } from 'sequelize';
import { Shift, ShiftCategory } from '../models/Shift';
import { logger } from '../../config/logger';

const RAW_SHIFTS: Array<{ label: string; value: number }> = [
  { label: 'Shift (7.0 A - 3.0 P)', value: 1 },
  { label: 'Shift (8.0 A - 2.0 P)', value: 2 },
  { label: 'Shift (8.0 A - 4.3 P)', value: 3 },
  { label: 'Shift (8.0 A - 5.0 P)', value: 4 },
  { label: 'Shift (9.0 A - 5.3 P)', value: 5 },
  { label: 'Shift (9.0 A - 6.0 P)', value: 6 },
  { label: 'Shift (9.0 A - 7.0 P)', value: 7 },
  { label: 'Shift (9.15 A - 7.0 P)', value: 8 },
  { label: 'Shift (10.0 A - 6.0 P)', value: 9 },
  { label: 'Shift (10.0 A - 6.3 P)', value: 10 },
  { label: 'Shift (10.0 A -7.0 P)', value: 11 },
  { label: 'Shift (10.3 A - 7.3 P)', value: 12 },
  { label: 'Shift (11.0 A - 7.0 P)', value: 13 },
  { label: 'Shift (11.0 A - 8.0 P)', value: 14 },
  { label: 'Shift (11.3 A - 8.0 P)', value: 15 },
  { label: 'Shift (12.3 P - 9.0 P)', value: 16 },
  { label: 'Shift (1.0 P - 9.0 P)', value: 17 },
  { label: 'Shift (1.0 P - 9.3 P)', value: 18 },
  { label: 'Shift (2.0 P - 8.0 P)', value: 19 },
  { label: 'Shift (2.0 P - 9.0 P)', value: 20 },
  { label: 'Shift (2.0 P - 10.0 P)', value: 21 },
  { label: 'Shift (3.0 P - 11.0 P)', value: 22 },
  { label: 'Shift (5.0 P - 9.0 A)', value: 23 },
  { label: 'Shift (8.0 P - 6.0 A)', value: 24 },
  { label: 'Shift (8.0 P - 8.0 A)', value: 25 },
  { label: 'Shift (9.0 P - 5.3 A)', value: 26 },
  { label: 'Shift (11.0 P - 7.0 A)', value: 27 },

  { label: 'NAT (7.0 A - 3.0 P)', value: 28 },
  { label: 'NAT (8.0 A - 2.0 P)', value: 29 },
  { label: 'NAT (8.0 A - 4.3 P)', value: 30 },
  { label: 'NAT (8.0 A - 5.0 P)', value: 31 },
  { label: 'NAT (9.0 A - 5.3 P)', value: 32 },
  { label: 'NAT (9.0 A - 6.0 P)', value: 33 },
  { label: 'NAT (9.0 A - 7.0 P)', value: 34 },
  { label: 'NAT (9.15 A - 7.0 P)', value: 35 },
  { label: 'NAT (10.0 A - 6.0 P)', value: 36 },
  { label: 'NAT (10.0 A - 6.3 P)', value: 37 },
  { label: 'NAT (10.0 A -7.0 P)', value: 38 },
  { label: 'NAT (10.3 A - 7.3 P)', value: 39 },
  { label: 'NAT (11.0 A - 7.0 P)', value: 40 },
  { label: 'NAT (11.0 A - 8.0 P)', value: 41 },
  { label: 'NAT (11.3 A - 8.0 P)', value: 42 },
  { label: 'NAT (12.3 P - 9.0 P)', value: 43 },
  { label: 'NAT (1.0 P - 9.0 P)', value: 44 },
  { label: 'NAT (1.0 P - 9.3 P)', value: 45 },
  { label: 'NAT (2.0 P - 8.0 P)', value: 46 },
  { label: 'NAT (2.0 P - 9.0 P)', value: 47 },
  { label: 'NAT (2.0 P - 10.0 P)', value: 48 },
  { label: 'NAT (3.0 P - 11.0 P)', value: 49 },
  { label: 'NAT (5.0 P - 9.0 A)', value: 50 },
  { label: 'NAT (8.0 P - 6.0 A)', value: 51 },
  { label: 'NAT (8.0 P - 8.0 A)', value: 52 },
  { label: 'NAT (9.0 P - 5.3 A)', value: 53 },
  { label: 'NAT (11.0 P - 7.0 A)', value: 54 },

  { label: 'NAT (7.0 A - 5.0 P)', value: 55 },
  { label: 'Shift (7.0 A - 5.0 P)', value: 56 },
  { label: 'NAT (9.45 A - 7.0 P)', value: 57 },
  { label: 'Shift (9.45 A - 7.0 P)', value: 58 },
  { label: 'Shift (9.0 A - 9.0 P)', value: 59 },
  { label: 'NAT (9.0 A - 9.0 P)', value: 60 },
  { label: 'Shift (9.0 A - 5.0 P)', value: 61 },
  { label: 'NAT (9.0 A - 5.0 P)', value: 62 },
  { label: 'Shift (12.0 P - 8.0 P)', value: 63 },
  { label: 'NAT (12.0 P - 8.0 P)', value: 64 },
];

interface ParsedTime {
  hour24: number;
  minute: number;
}

/**
 * Decoding rule for "10.3 A" / "9.15 A" style tokens, verified against all
 * 64 labels with no exceptions:
 *   - 1 digit after the dot  → digit × 10 = minutes  (".0"→:00, ".3"→:30)
 *   - 2 digits after the dot → used as-is              (".15"→:15, ".45"→:45)
 */
function parseTimeToken(hourPart: string, minutePart: string, meridiem: 'A' | 'P'): ParsedTime {
  let hour = parseInt(hourPart, 10);
  const minute = minutePart.length === 1 ? parseInt(minutePart, 10) * 10 : parseInt(minutePart, 10);
  if (meridiem === 'P' && hour !== 12) hour += 12;
  if (meridiem === 'A' && hour === 12) hour = 0;
  return { hour24: hour, minute };
}

function toTimeString(t: ParsedTime): string {
  return `${String(t.hour24).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}:00`;
}

function parseLabel(label: string): { category: ShiftCategory; start: ParsedTime; end: ParsedTime } {
  const match = label.match(
    /^(Shift|NAT)\s*\((\d{1,2})\.(\d{1,2})\s*([AP])\s*-\s*(\d{1,2})\.(\d{1,2})\s*([AP])\)$/,
  );
  if (!match) throw new Error(`Could not parse shift label: "${label}"`);
  const [, prefix, sh, sm, sMeridiem, eh, em, eMeridiem] = match;
  return {
    category: prefix === 'NAT' ? 'NAT' : 'STANDARD',
    start: parseTimeToken(sh, sm, sMeridiem as 'A' | 'P'),
    end: parseTimeToken(eh, em, eMeridiem as 'A' | 'P'),
  };
}

function computeDuration(start: ParsedTime, end: ParsedTime): { duration: number; crossesMidnight: boolean } {
  const startTotal = start.hour24 * 60 + start.minute;
  const endTotal = end.hour24 * 60 + end.minute;
  const crossesMidnight = endTotal <= startTotal;
  const duration = crossesMidnight ? (24 * 60 - startTotal) + endTotal : endTotal - startTotal;
  return { duration, crossesMidnight };
}

/**
 * Seeds all 64 legacy shift definitions with their EXACT original IDs
 * preserved (Employee.shift_id already references these numbers).
 * Idempotent — safe to run on every seed via updateOnDuplicate.
 */
export async function seedShifts(transaction?: Transaction): Promise<void> {
  const rows = RAW_SHIFTS.map(({ label, value }) => {
    const { category, start, end } = parseLabel(label);
    const { duration, crossesMidnight } = computeDuration(start, end);
    return {
      id: value,
      label,
      category,
      start_time: toTimeString(start),
      end_time: toTimeString(end),
      crosses_midnight: crossesMidnight,
      duration_minutes: duration,
      is_active: true,
    };
  });

  await Shift.bulkCreate(rows, {
    transaction,
    updateOnDuplicate: ['label', 'category', 'start_time', 'end_time', 'crosses_midnight', 'duration_minutes'],
  });

  logger.info(`✅ Shifts seeded (${rows.length} definitions)`);
}
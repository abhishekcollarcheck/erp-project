/**
 * seed-holidays.ts
 *
 * Source: "UNISON NARULA GROUP — LIST OF HOLIDAYS IN 2026" circular
 * (No. UNG/HR/2026/1106, dated 01.01.2026), applying to Narula Exports,
 * Med Freshe Pvt. Ltd, Greenvac Solutions Pvt Ltd, and Collar Check Pvt Ltd.
 *
 * company_id left null on every row — the circular applies group-wide.
 *
 * Place at: backend/src/database/seeders/seed-holidays.ts
 */

import { Holiday } from '../models/Holiday';
import { logger } from '../../config/logger';

const HOLIDAYS_2026: Array<{ date: string; name: string }> = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-02-15', name: 'Maha Shivaratri' },
  { date: '2026-03-04', name: 'Holi' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-08-28', name: 'Raksha Bandhan' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti' },
  { date: '2026-10-20', name: 'Dussehra' },
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-11-10', name: 'Bhai Dooj' },
];

export async function seedHolidays(): Promise<void> {
  const rows = HOLIDAYS_2026.map((h) => ({
    date: h.date,
    name: h.name,
    company_id: null,
    is_active: true,
  }));

  await Holiday.bulkCreate(rows, {
    updateOnDuplicate: ['name', 'is_active'],
  });

  logger.info(`✅ Holidays seeded (${rows.length} entries for 2026)`);
}
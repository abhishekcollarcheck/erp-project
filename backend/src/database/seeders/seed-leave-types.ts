/**
 * seed-leave-types.ts
 *
 * The 3 real leave types, per your specification. Global across all
 * companies (company_id: null) — same pattern as Holiday, not seeded
 * per-company:
 *   - Short Leave: 1 hour/month, resets monthly, never carries forward,
 *     used for late-arrival/early-departure offsets (Attendance
 *     integration deferred — decide later).
 *   - Earned Leave: 15 days/year, accrues progressively (1.25/month),
 *     carries forward.
 *   - Casual Leave: 12 days/year, accrues progressively (1/month),
 *     carries forward.
 *
 * Place at: backend/src/database/seeders/seed-leave-types.ts
 */

import { LeaveType } from '../models/LeaveModels';
import { logger } from '../../config/logger';

// ✅ FIX: Accept optional transaction parameter
export async function seedLeaveTypes(transaction?: any): Promise<void> {
  const rows = [
    {
      company_id: null,
      name: 'Short Leave',
      code: 'ShL',
      days_per_year: 1,               // 1 HOUR per month — accrual_unit clarifies the unit
      accrual_unit: 'hours' as const,
      accrual_period: 'monthly_reset' as const,
      is_paid: true,                  // ASSUMPTION — confirm; not explicitly stated
      carry_forward: false,
      max_carry_days: 0,
      is_active: true,
    },
    {
      company_id: null,
      name: 'Earned Leave',
      code: 'EL',
      days_per_year: 15,
      accrual_unit: 'days' as const,
      accrual_period: 'annual_progressive' as const,
      is_paid: true,                  // ASSUMPTION — confirm
      carry_forward: true,
      max_carry_days: 15,             // ASSUMPTION — no cap was given; defaulted to the annual total. Confirm.
      is_active: true,
    },
    {
      company_id: null,
      name: 'Casual Leave',
      code: 'CL',
      days_per_year: 12,
      accrual_unit: 'days' as const,
      accrual_period: 'annual_progressive' as const,
      is_paid: true,                  // ASSUMPTION — confirm
      carry_forward: true,
      max_carry_days: 12,             // ASSUMPTION — same as above. Confirm.
      is_active: true,
    },
  ];

  // ✅ FIX: Pass transaction to bulkCreate
  await LeaveType.bulkCreate(rows, {
    updateOnDuplicate: ['days_per_year', 'accrual_unit', 'accrual_period', 'is_paid', 'carry_forward', 'max_carry_days', 'is_active'],
    transaction,  // Added transaction support
  });

  logger.info(`✅ Leave types seeded (global): Short Leave, Earned Leave, Casual Leave`);
}
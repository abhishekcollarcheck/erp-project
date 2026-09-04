/**
 * seed-leave-types.ts
 *
 * Seeds the 3 standard leave types (Casual, Earned, Short) for every
 * active company. `code: 'ShL'` matches the vocabulary already used by
 * leave-accrual.service.ts — do not rename to 'SL'.
 *
 * Place at: backend/src/database/seeders/leave-type-seed-data.ts
 */

import { LeaveType } from '../models/LeaveModels';
import { Company } from '../models/Company';
import { logger } from '../../config/logger';

const LEAVE_TYPES: Array<{ name: string; code: string; days_per_year: number; carry_forward: boolean }> = [
  { name: 'Casual Leave', code: 'CL',  days_per_year: 12, carry_forward: false },
  { name: 'Earned Leave', code: 'EL',  days_per_year: 15, carry_forward: true },
  { name: 'Short Leave',  code: 'ShL', days_per_year: 0,  carry_forward: false },
];

export async function seedLeaveTypes(): Promise<void> {
  const companies = await Company.findAll({ where: { is_active: true } });

  for (const company of companies) {
    for (const lt of LEAVE_TYPES) {
      await LeaveType.findOrCreate({
        where: { company_id: company.id, code: lt.code },
        defaults: {
          company_id: company.id,
          name: lt.name,
          code: lt.code,
          days_per_year: lt.days_per_year,
          is_paid: true,
          carry_forward: lt.carry_forward,
          max_carry_days: 0,
          is_active: true,
        },
      });
    }
  }

  logger.info(`✅ Leave types seeded (${LEAVE_TYPES.length} types × ${companies.length} companies)`);
}

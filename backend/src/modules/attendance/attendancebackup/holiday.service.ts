import { Op } from 'sequelize';
import { Holiday } from '../../database/models/Holiday';

export class HolidayService {
  /**
   * Returns a Map<date, holidayName> for every holiday in [startDate, endDate]
   * that applies to this company — either company-specific (company_id
   * matches) or group-wide (company_id is null). One query for the whole
   * range, not one per day.
   */
  async getHolidaysInRange(startDate: string, endDate: string, companyId: number): Promise<Map<string, string>> {
    const holidays = await Holiday.findAll({
      where: {
        date: { [Op.between]: [startDate, endDate] },
        is_active: true,
        [Op.or]: [{ company_id: null }, { company_id: companyId }],
      },
      attributes: ['date', 'name'],
    });

    const map = new Map<string, string>();
    for (const h of holidays) {
      map.set(h.date, h.name);
    }
    return map;
  }
}

export const holidayService = new HolidayService();
import { Op } from 'sequelize';
import { AppError } from '../../middleware/errorHandler.middleware';
import { Holiday } from '../../database/models/Holiday';
// import { Holiday } from '@/database/models/Holiday';


export interface HolidayQueryParams {
  activeOnly?: boolean;
  upcomingOnly?: boolean;
}

export interface CreateHolidayDto {
  date: string;
  name: string;
  // Only a super admin may pass company_id: null to create a GLOBAL holiday
  // (visible to every company). Anyone else creating a holiday gets it
  // scoped to their own company regardless of what they pass here.
  company_id?: number | null;
}

export interface UpdateHolidayDto {
  date?: string;
  name?: string;
  is_active?: boolean;
}

export class HolidayService {
  // A holiday is "visible" to a company if it's global (company_id IS NULL)
  // or scoped specifically to that company.
  async getAll(companyId: number, params: HolidayQueryParams = {}) {
    const where: Record<string, unknown> = {
      [Op.or]: [{ company_id: null }, { company_id: companyId }],
    };
    if (params.activeOnly) where.is_active = true;
    if (params.upcomingOnly) where.date = { [Op.gte]: new Date().toISOString().slice(0, 10) };

    return Holiday.findAll({ where, order: [['date', 'ASC']] });
  }

  async getById(id: number, companyId: number) {
    const holiday = await Holiday.findOne({
      where: { id, [Op.or]: [{ company_id: null }, { company_id: companyId }] },
    });
    if (!holiday) throw new AppError('Holiday not found', 404);
    return holiday;
  }

  async create(dto: CreateHolidayDto, companyId: number, isSuperAdmin: boolean) {
    if (!dto.date || !dto.name?.trim()) {
      throw new AppError('date and name are required', 400);
    }

    // Only a super admin can create a global holiday (company_id: null).
    // Everyone else's holidays are forced to their own company, regardless
    // of what company_id (if any) was passed in the body.
    const targetCompanyId = isSuperAdmin && dto.company_id === null ? null : companyId;

    const existing = await Holiday.findOne({ where: { date: dto.date, company_id: targetCompanyId } });
    if (existing) {
      throw new AppError(
        `A ${targetCompanyId === null ? 'global' : 'company'} holiday already exists on ${dto.date}`,
        409,
      );
    }

    return Holiday.create({ date: dto.date, name: dto.name.trim(), company_id: targetCompanyId });
  }

  async update(id: number, dto: UpdateHolidayDto, companyId: number, isSuperAdmin: boolean) {
    const holiday = await this.getById(id, companyId);
    this.assertCanManage(holiday, companyId, isSuperAdmin);

    const patch: Record<string, unknown> = {};
    if (dto.date !== undefined) patch.date = dto.date;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;

    await holiday.update(patch);
    return holiday;
  }

  async remove(id: number, companyId: number, isSuperAdmin: boolean) {
    const holiday = await this.getById(id, companyId);
    this.assertCanManage(holiday, companyId, isSuperAdmin);
    await holiday.destroy();
  }

  // A global holiday (company_id: null) can only be edited/removed by a
  // super admin — an HR user at one company shouldn't be able to delete a
  // holiday shared across every other company too.
  private assertCanManage(holiday: Holiday, companyId: number, isSuperAdmin: boolean) {
    if (holiday.company_id === null && !isSuperAdmin) {
      throw new AppError('Only a super admin can modify a global holiday', 403);
    }
    if (holiday.company_id !== null && holiday.company_id !== companyId) {
      throw new AppError('Holiday not found', 404);
    }
  }
}
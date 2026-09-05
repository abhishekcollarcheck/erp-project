import { Request, Response, NextFunction } from 'express';
import { sendResponse, sendError } from '../../utils/response';
import { HolidayService } from './holiday.service';

const holidayService = new HolidayService();

// Same permission this module's frontend (HolidaysSpecialTab in the Leave
// Management page) already gates on — `canManage={hasApprovePermission}`,
// i.e. 'leaves:approve'. Kept as its own constant here in case Holidays
// end up needing a separate permission later.
const HOLIDAY_MANAGE_PERM = 'leaves:approve';

function canManage(req: Request): boolean {
  const permissions = req.user!.permissions ?? [];
  return Boolean(req.user!.isSuperAdmin) || permissions.includes('*') || permissions.includes(HOLIDAY_MANAGE_PERM);
}

function requireManage(req: Request, res: Response): boolean {
  if (!canManage(req)) {
    sendError(res, 'Forbidden: holiday management permission required', 403);
    return false;
  }
  return true;
}

// GET /api/holidays?activeOnly=1&upcomingOnly=1
export async function getHolidays(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const holidays = await holidayService.getAll(req.user!.companyId, {
      activeOnly: req.query.activeOnly === '1' || req.query.activeOnly === 'true',
      upcomingOnly: req.query.upcomingOnly === '1' || req.query.upcomingOnly === 'true',
    });
    sendResponse(res, { data: holidays, message: 'Holidays fetched' });
  } catch (e) { next(e); }
}

// GET /api/holidays/:id
export async function getHolidayById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    const holiday = await holidayService.getById(id, req.user!.companyId);
    sendResponse(res, { data: holiday, message: 'Holiday fetched' });
  } catch (e) { next(e); }
}

// POST /api/holidays — { date, name, company_id? } (company_id: null requires super admin)
export async function createHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const holiday = await holidayService.create(req.body, req.user!.companyId, Boolean(req.user!.isSuperAdmin));
    sendResponse(res, { data: holiday, message: 'Holiday created', statusCode: 201 });
  } catch (e) { next(e); }
}

// PUT /api/holidays/:id — { date?, name?, is_active? }
export async function updateHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const id = parseInt(req.params.id, 10);
    const holiday = await holidayService.update(id, req.body, req.user!.companyId, Boolean(req.user!.isSuperAdmin));
    sendResponse(res, { data: holiday, message: 'Holiday updated' });
  } catch (e) { next(e); }
}

// DELETE /api/holidays/:id
export async function deleteHoliday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!requireManage(req, res)) return;
    const id = parseInt(req.params.id, 10);
    await holidayService.remove(id, req.user!.companyId, Boolean(req.user!.isSuperAdmin));
    sendResponse(res, { data: null, message: 'Holiday deleted' });
  } catch (e) { next(e); }
}
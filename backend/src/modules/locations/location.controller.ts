import { Request, Response } from 'express';
import { cityService, countryService, payRegisterService, siteService, stateService } from './location.service';
// import {
//   countryService,
//   stateService,
//   cityService,
//   siteService,
//   payRegisterService,
// } from '../services/location.service';

/**
 * Pagination is opt-in. These are small lookup tables and every caller (the
 * Location master list, the Employee wizard's location dropdowns) needs the
 * full set — a hard-coded default limit silently hid every row past the 10th,
 * so newly-created States/Cities/Sites never showed up after a refetch.
 * Returns null when the request carries no `page`/`limit` → fetch everything.
 */
const getPaginationOptions = (req: Request) => {
  if (req.query.page === undefined && req.query.limit === undefined) return null;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

const getUserId = (req: Request): number | undefined =>
  (req as any).user?.employeeId ?? (req as any).user?.id;

/**
 * Build a `where` clause from whitelisted query-string filters so callers can do
 * `GET /states?country_id=1` / `GET /cities?state_id=14` (used by the cascading
 * State→City dropdowns in the Employee wizard and the Add-Candidate modal).
 * `is_active` accepts true/false/all; the rest are numeric FK columns.
 */
const buildWhere = (req: Request, allowed: string[]): Record<string, unknown> => {
  const where: Record<string, unknown> = {};
  for (const key of allowed) {
    const raw = req.query[key];
    if (raw === undefined || raw === '') continue;
    if (key === 'is_active') {
      if (raw === 'all') continue;
      where.is_active = raw === 'true' || raw === '1';
    } else {
      const n = Number(raw);
      if (Number.isInteger(n) && n > 0) where[key] = n;
    }
  }
  return where;
};

// Generic helper to generate standard CRUD controllers
const createCrudController = (service: any, filterKeys: string[] = []) => ({
  create: async (req: Request, res: Response) => {
    try {
      const data = await service.create(req.body, getUserId(req));
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const pg = getPaginationOptions(req);
      const findOpts: any = { order: [['id', 'ASC']] };
      const where = buildWhere(req, filterKeys);
      if (Object.keys(where).length) findOpts.where = where;
      if (pg) { findOpts.limit = pg.limit; findOpts.offset = pg.offset; }
      const result = await service.findAll(findOpts);
      return res.status(200).json({
        success: true,
        data: result.rows,
        meta: { total: result.count, page: pg?.page ?? 1, limit: pg?.limit ?? result.count },
      });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const data = await service.findById(Number(req.params.id));
      if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const data = await service.update(Number(req.params.id), req.body, getUserId(req));
      if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const success = await service.delete(Number(req.params.id), getUserId(req));
      if (!success) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, message: 'Record deleted successfully' });
    } catch (err: any) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },
});

export const countryController = createCrudController(countryService, ['is_active']);
export const stateController = createCrudController(stateService, ['country_id', 'is_active']);
export const cityController = createCrudController(cityService, ['state_id', 'is_active']);
export const siteController = createCrudController(siteService, ['company_id', 'city_id', 'is_active']);
export const payRegisterController = createCrudController(payRegisterService, ['company_id', 'state_id', 'is_active']);
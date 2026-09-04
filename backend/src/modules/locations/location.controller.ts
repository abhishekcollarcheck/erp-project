import { Request, Response } from 'express';
import { cityService, countryService, payRegisterService, siteService, stateService } from './location.service';
// import {
//   countryService,
//   stateService,
//   cityService,
//   siteService,
//   payRegisterService,
// } from '../services/location.service';

const getPaginationOptions = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

const getUserId = (req: Request): number | undefined => (req as any).user?.id;

// Generic helper to generate standard CRUD controllers
const createCrudController = (service: any) => ({
  create: async (req: Request, res: Response) => {
    try {
      const data = await service.create(req.body, getUserId(req));
      return res.status(201).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const { limit, offset, page } = getPaginationOptions(req);
      const result = await service.findAll({ limit, offset });
      return res.status(200).json({
        success: true,
        data: result.rows,
        meta: { total: result.count, page, limit },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const data = await service.findById(Number(req.params.id));
      if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const data = await service.update(Number(req.params.id), req.body, getUserId(req));
      if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const success = await service.delete(Number(req.params.id), getUserId(req));
      if (!success) return res.status(404).json({ success: false, message: 'Record not found' });
      return res.status(200).json({ success: true, message: 'Record deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
});

export const countryController = createCrudController(countryService);
export const stateController = createCrudController(stateService);
export const cityController = createCrudController(cityService);
export const siteController = createCrudController(siteService);
export const payRegisterController = createCrudController(payRegisterService);
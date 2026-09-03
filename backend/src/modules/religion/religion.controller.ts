import { Request, Response } from 'express';
import { religionService } from './religion.service';

export const religionController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await religionService.getAllReligions();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createReligion(req: Request, res: Response): Promise<void> {
    try {
      const data = await religionService.createReligion(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateReligion(req: Request, res: Response): Promise<void> {
    try {
      const data = await religionService.updateReligion(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteReligion(req: Request, res: Response): Promise<void> {
    try {
      await religionService.deleteReligion(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
import { Request, Response } from 'express';
import { nationalityService } from './nationality.service';

export const nationalityController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await nationalityService.getAllNationalities();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createNationality(req: Request, res: Response): Promise<void> {
    try {
      const data = await nationalityService.createNationality(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateNationality(req: Request, res: Response): Promise<void> {
    try {
      const data = await nationalityService.updateNationality(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteNationality(req: Request, res: Response): Promise<void> {
    try {
      await nationalityService.deleteNationality(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
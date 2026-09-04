import { Request, Response } from 'express';
import { genderService } from './gender.service';

export const genderController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await genderService.getAllGenders();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createGender(req: Request, res: Response): Promise<void> {
    try {
      const data = await genderService.createGender(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateGender(req: Request, res: Response): Promise<void> {
    try {
      const data = await genderService.updateGender(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteGender(req: Request, res: Response): Promise<void> {
    try {
      await genderService.deleteGender(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
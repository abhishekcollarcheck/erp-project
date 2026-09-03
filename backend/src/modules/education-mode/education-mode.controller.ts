import { Request, Response } from 'express';
import { educationModeService } from './education-mode.service';

export const educationModeController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await educationModeService.getAllEducationModes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createEducationMode(req: Request, res: Response): Promise<void> {
    try {
      const data = await educationModeService.createEducationMode(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateEducationMode(req: Request, res: Response): Promise<void> {
    try {
      const data = await educationModeService.updateEducationMode(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteEducationMode(req: Request, res: Response): Promise<void> {
    try {
      await educationModeService.deleteEducationMode(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
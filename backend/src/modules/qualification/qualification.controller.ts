import { Request, Response } from 'express';
import { qualificationService } from './qualification.service';

export const qualificationController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await qualificationService.getAllQualifications();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createQualification(req: Request, res: Response): Promise<void> {
    try {
      const data = await qualificationService.createQualification(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateQualification(req: Request, res: Response): Promise<void> {
    try {
      const data = await qualificationService.updateQualification(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteQualification(req: Request, res: Response): Promise<void> {
    try {
      await qualificationService.deleteQualification(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
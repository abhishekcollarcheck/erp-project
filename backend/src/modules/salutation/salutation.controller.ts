import { Request, Response } from 'express';
import { salutationService } from './salutation.service';

export const salutationController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await salutationService.getAllSalutations();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createSalutation(req: Request, res: Response): Promise<void> {
    try {
      const data = await salutationService.createSalutation(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateSalutation(req: Request, res: Response): Promise<void> {
    try {
      const data = await salutationService.updateSalutation(
        Number(req.params.id),
        req.body.name
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteSalutation(req: Request, res: Response): Promise<void> {
    try {
      await salutationService.deleteSalutation(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
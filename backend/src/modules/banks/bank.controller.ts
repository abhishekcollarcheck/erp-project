import { Request, Response } from 'express';
import { bankService } from './bank.service';

export const bankController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await bankService.getAllBanks();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createBank(req: Request, res: Response): Promise<void> {
    try {
      const data = await bankService.createBank(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateBank(req: Request, res: Response): Promise<void> {
    try {
      const data = await bankService.updateBank(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteBank(req: Request, res: Response): Promise<void> {
    try {
      await bankService.deleteBank(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
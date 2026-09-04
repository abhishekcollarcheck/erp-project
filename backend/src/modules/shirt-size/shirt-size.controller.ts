import { Request, Response } from 'express';
import { shirtSizeService } from './shirt-size.service';

export const shirtSizeController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await shirtSizeService.getAllShirtSizes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createShirtSize(req: Request, res: Response): Promise<void> {
    try {
      const data = await shirtSizeService.createShirtSize(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateShirtSize(req: Request, res: Response): Promise<void> {
    try {
      const data = await shirtSizeService.updateShirtSize(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteShirtSize(req: Request, res: Response): Promise<void> {
    try {
      await shirtSizeService.deleteShirtSize(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
import { Request, Response } from 'express';
import { modeOfPaymentService } from './mode-of-payment.service';

export const modeOfPaymentController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await modeOfPaymentService.getAllModesOfPayment();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createModeOfPayment(req: Request, res: Response): Promise<void> {
    try {
      const data = await modeOfPaymentService.createModeOfPayment(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateModeOfPayment(req: Request, res: Response): Promise<void> {
    try {
      const data = await modeOfPaymentService.updateModeOfPayment(
        Number(req.params.id),
        req.body.name
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteModeOfPayment(req: Request, res: Response): Promise<void> {
    try {
      await modeOfPaymentService.deleteModeOfPayment(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
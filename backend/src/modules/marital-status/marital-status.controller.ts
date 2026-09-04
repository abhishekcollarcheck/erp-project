import { Request, Response } from 'express';
import { maritalStatusService } from './marital-status.service';

export const maritalStatusController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await maritalStatusService.getAllMaritalStatuses();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createMaritalStatus(req: Request, res: Response): Promise<void> {
    try {
      const data = await maritalStatusService.createMaritalStatus(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateMaritalStatus(req: Request, res: Response): Promise<void> {
    try {
      const data = await maritalStatusService.updateMaritalStatus(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteMaritalStatus(req: Request, res: Response): Promise<void> {
    try {
      await maritalStatusService.deleteMaritalStatus(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
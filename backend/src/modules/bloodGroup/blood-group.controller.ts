import { Request, Response } from 'express';
import { bloodGroupService } from './blood-group.service';

export const bloodGroupController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await bloodGroupService.getAllBloodGroups();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createBloodGroup(req: Request, res: Response): Promise<void> {
    try {
      const data = await bloodGroupService.createBloodGroup(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateBloodGroup(req: Request, res: Response): Promise<void> {
    try {
      const data = await bloodGroupService.updateBloodGroup(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteBloodGroup(req: Request, res: Response): Promise<void> {
    try {
      await bloodGroupService.deleteBloodGroup(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
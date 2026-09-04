import { Request, Response } from 'express';
import { houseTypeService } from './house-type.service';

export const houseTypeController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await houseTypeService.getAllHouseTypes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createHouseType(req: Request, res: Response): Promise<void> {
    try {
      const data = await houseTypeService.createHouseType(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateHouseType(req: Request, res: Response): Promise<void> {
    try {
      const data = await houseTypeService.updateHouseType(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteHouseType(req: Request, res: Response): Promise<void> {
    try {
      await houseTypeService.deleteHouseType(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
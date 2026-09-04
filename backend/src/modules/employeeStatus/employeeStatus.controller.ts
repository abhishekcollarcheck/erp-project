import { Request, Response } from 'express';
import { employeeStatusService } from './employeeStatus.service';

export const employeeStatusController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await employeeStatusService.getAll();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const data = await employeeStatusService.getById(Number(req.params.id));
      if (!data) {
        res.status(404).json({ success: false, message: 'Employee status not found' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const data = await employeeStatusService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await employeeStatusService.update(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { ordered_ids } = req.body;
      if (!Array.isArray(ordered_ids)) {
        res.status(400).json({ success: false, message: 'ordered_ids array is required' });
        return;
      }
      await employeeStatusService.updateOrder(ordered_ids);
      res.status(200).json({ success: true, message: 'Order updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await employeeStatusService.delete(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Employee status deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
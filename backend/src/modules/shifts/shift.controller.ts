import { Request, Response } from 'express';
import { shiftService } from './shift.service';

export const shiftController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await shiftService.getAllShifts();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await shiftService.getShiftById(id);
      if (!data) {
        res.status(404).json({ success: false, message: 'Shift not found' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { label, start_time, end_time, half_day_time, day_span } = req.body;

      if (!label) {
        res.status(400).json({ success: false, message: 'Shift label is required' });
        return;
      }

      const data = await shiftService.createShift({
        label,
        start_time,
        end_time,
        half_day_time,
        day_span,
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await shiftService.updateShift(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      const statusCode = error.message === 'Shift not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await shiftService.deleteShift(id);
      res.status(200).json({ success: true, message: 'Shift deleted successfully' });
    } catch (error: any) {
      const statusCode = error.message === 'Shift not found' ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  },
};
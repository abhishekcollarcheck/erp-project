import { Request, Response } from 'express';
import { weeklyOffPresetService } from './weeklyOffPreset.service';

export const weeklyOffPresetController = {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await weeklyOffPresetService.getAllPresets();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await weeklyOffPresetService.getPresetById(id);
      if (!data) {
        res.status(404).json({ success: false, message: 'Preset not found' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, always_off, nth_off_rules } = req.body;

      if (!name) {
        res.status(400).json({ success: false, message: 'Preset name is required' });
        return;
      }

      const data = await weeklyOffPresetService.createPreset({
        name,
        always_off,
        nth_off_rules,
      });

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await weeklyOffPresetService.updatePreset(id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      await weeklyOffPresetService.deletePreset(id);
      res.status(200).json({ success: true, message: 'Preset deleted successfully' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
  },
};
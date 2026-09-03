import { Request, Response } from 'express';
import { probationService, ProbationType } from './probation.service';

export const probationController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      const data = await probationService.getAll(type);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      const data = await probationService.getById(type, Number(req.params.id));
      if (!data) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      if (!req.body.name) {
        res.status(400).json({ success: false, message: 'Name is required' });
        return;
      }
      const data = await probationService.create(type, req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      const id = Number(req.params.id);
      const data = await probationService.update(type, id, req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      const { ordered_ids } = req.body;
      if (!Array.isArray(ordered_ids)) {
        res.status(400).json({ success: false, message: 'ordered_ids array is required' });
        return;
      }
      await probationService.updateOrder(type, ordered_ids);
      res.status(200).json({ success: true, message: 'Order updated successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as ProbationType;
      await probationService.delete(type, Number(req.params.id));
      res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
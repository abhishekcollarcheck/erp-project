import { Request, Response } from 'express';
import { insuredAmountService } from './insuredAmount.service';

export const insuredAmountController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const masters = await insuredAmountService.getAllMaster();
      const brackets = await insuredAmountService.getAllBrackets();
      res.status(200).json({ success: true, data: { masters, brackets } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createMaster(req: Request, res: Response): Promise<void> {
    try {
      const data = await insuredAmountService.createMaster(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateMaster(req: Request, res: Response): Promise<void> {
    try {
      const data = await insuredAmountService.updateMaster(Number(req.params.id), req.body.name);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteMaster(req: Request, res: Response): Promise<void> {
    try {
      await insuredAmountService.deleteMaster(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createBracket(req: Request, res: Response): Promise<void> {
    try {
      const { min_salary, max_salary, insured_amount_id } = req.body;
      const data = await insuredAmountService.createBracket(min_salary, max_salary, insured_amount_id);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateBracket(req: Request, res: Response): Promise<void> {
    try {
      const data = await insuredAmountService.updateBracket(Number(req.params.id), req.body);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteBracket(req: Request, res: Response): Promise<void> {
    try {
      await insuredAmountService.deleteBracket(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Bracket deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
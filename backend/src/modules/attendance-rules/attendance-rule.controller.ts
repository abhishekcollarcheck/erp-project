import { Request, Response } from 'express';
import { attendanceRulesService } from './attendance-rules.service';

export const attendanceRulesController = {
  // ─── SATURDAY RULES CONTROLLERS ────────────────────────────────────────────
  async getAllSaturdayRules(req: Request, res: Response): Promise<void> {
    try {
      const data = await attendanceRulesService.getAllSaturdayRules();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createSaturdayRule(req: Request, res: Response): Promise<void> {
    try {
      const data = await attendanceRulesService.createSaturdayRule(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateSaturdayRule(req: Request, res: Response): Promise<void> {
    try {
      const data = await attendanceRulesService.updateSaturdayRule(
        Number(req.params.id),
        req.body.name
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteSaturdayRule(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteSaturdayRule(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAllSaturdayRules(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteAllSaturdayRules();
      res.status(200).json({ success: true, message: 'All Saturday rules deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ─── GRACE MINUTES CONTROLLERS ─────────────────────────────────────────────
  async getAllGraceMinutes(req: Request, res: Response): Promise<void> {
    try {
      const data = await attendanceRulesService.getAllGraceMinutes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createGraceMinute(req: Request, res: Response): Promise<void> {
    try {
      const { name, minutes } = req.body;
      const data = await attendanceRulesService.createGraceMinute(name, minutes);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateGraceMinute(req: Request, res: Response): Promise<void> {
    try {
      const { name, minutes } = req.body;
      const data = await attendanceRulesService.updateGraceMinute(
        Number(req.params.id),
        name,
        minutes
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteGraceMinute(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteGraceMinute(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAllGraceMinutes(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteAllGraceMinutes();
      res.status(200).json({ success: true, message: 'All Grace minutes deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ─── ATTENDANCE TYPES CONTROLLERS ──────────────────────────────────────────
  async getAllAttendanceTypes(req: Request, res: Response): Promise<void> {
    try {
      const data = await attendanceRulesService.getAllAttendanceTypes();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createAttendanceType(req: Request, res: Response): Promise<void> {
    try {
      const { name, code } = req.body;
      const data = await attendanceRulesService.createAttendanceType(name, code);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateAttendanceType(req: Request, res: Response): Promise<void> {
    try {
      const { name, code } = req.body;
      const data = await attendanceRulesService.updateAttendanceType(
        Number(req.params.id),
        name,
        code
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAttendanceType(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteAttendanceType(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteAllAttendanceTypes(req: Request, res: Response): Promise<void> {
    try {
      await attendanceRulesService.deleteAllAttendanceTypes();
      res.status(200).json({ success: true, message: 'All Attendance types deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
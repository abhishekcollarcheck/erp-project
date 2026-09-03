import { Request, Response } from 'express';
import { emergencyRelationshipService } from './emergency-relationship.service';

export const emergencyRelationshipController = {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await emergencyRelationshipService.getAllEmergencyRelationships();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createEmergencyRelationship(req: Request, res: Response): Promise<void> {
    try {
      const data = await emergencyRelationshipService.createEmergencyRelationship(req.body.name);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateEmergencyRelationship(req: Request, res: Response): Promise<void> {
    try {
      const data = await emergencyRelationshipService.updateEmergencyRelationship(
        Number(req.params.id),
        req.body.name
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteEmergencyRelationship(req: Request, res: Response): Promise<void> {
    try {
      await emergencyRelationshipService.deleteEmergencyRelationship(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
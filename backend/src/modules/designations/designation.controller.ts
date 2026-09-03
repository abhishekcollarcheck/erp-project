// import { Request, Response, NextFunction } from 'express';
// import { DesignationService } from './designation.service';
// import { sendResponse } from '../../utils/response';

// const designationService = new DesignationService();

// // GET /api/designations
// export async function getDesignations(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.getAll(req.query as any);
//     sendResponse(res, { data, message: 'Designations fetched' });
//   } catch (e) { next(e); }
// }

// // GET /api/designations/stats
// export async function getDesignationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.getStats();
//     sendResponse(res, { data, message: 'Designation stats' });
//   } catch (e) { next(e); }
// }

// // GET /api/designations/:id
// export async function getDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.getById(parseInt(req.params.id, 10), req.user!.companyId);
//     sendResponse(res, { data, message: 'Designation fetched' });
//   } catch (e) { next(e); }
// }

// // POST /api/designations
// export async function createDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.create(req.user!.companyId, req.body, req.user!.employeeId);
//     sendResponse(res, { data, message: 'Designation created', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// // PUT /api/designations/:id
// export async function updateDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.update(
//       parseInt(req.params.id, 10),
//       req.user!.companyId,
//       req.body,
//       req.user!.employeeId,
//     );
//     sendResponse(res, { data, message: 'Designation updated' });
//   } catch (e) { next(e); }
// }

// // PATCH /api/designations/:id/toggle
// export async function toggleDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await designationService.toggleActive(
//       parseInt(req.params.id, 10),
//       req.user!.companyId,
//       req.user!.employeeId,
//     );
//     sendResponse(res, { data, message: `Designation ${data.is_active ? 'activated' : 'deactivated'}` });
//   } catch (e) { next(e); }
// }

// // DELETE /api/designations/:id
// export async function deleteDesignation(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     await designationService.delete(parseInt(req.params.id, 10), req.user!.companyId, req.user!.employeeId);
//     sendResponse(res, { data: null, message: 'Designation deleted' });
//   } catch (e) { next(e); }
// }







// import { Request, Response } from 'express';
// import { DesignationService } from './designation.service';

// const designationService = new DesignationService();

// export class DesignationController {
//   // ==========================================
//   // DESIGNATION CONTROLLERS
//   // ==========================================

//   public async createDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const designation = await designationService.createDesignation({
//         ...req.body,
//         created_by: req.user?.id, // Assuming user context from auth middleware
//       });
//       res.status(201).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async getAllDesignations(req: Request, res: Response): Promise<void> {
//     try {
//       const includeInactive = req.query.include_inactive === 'true';
//       const designations = await designationService.getAllDesignations(includeInactive);
//       res.status(200).json({ success: true, data: designations });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async getDesignationById(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const designation = await designationService.getDesignationById(id);

//       if (!designation) {
//         res.status(404).json({ success: false, message: 'Designation not found' });
//         return;
//       }

//       res.status(200).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async updateDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const designation = await designationService.updateDesignation(id, {
//         ...req.body,
//         updated_by: req.user?.id,
//       });
//       res.status(200).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async deleteDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const deletedBy = req.user?.id;
//       await designationService.deleteDesignation(id, deletedBy);
//       res.status(200).json({ success: true, message: 'Designation deleted successfully' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   // ==========================================
//   // SUB-DESIGNATION CONTROLLERS
//   // ==========================================

//   public async getAllSubDesignations(req: Request, res: Response): Promise<void> {
//     try {
//       const filters = {
//         designation_id: req.query.designation_id ? Number(req.query.designation_id) : undefined,
//         is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
//         search: req.query.search ? String(req.query.search) : undefined,
//       };

//       const subDesignations = await designationService.getAllSubDesignations(filters);
//       res.status(200).json({ success: true, data: subDesignations });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async getSubDesignationById(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const subDesignation = await designationService.getSubDesignationById(id);

//       if (!subDesignation) {
//         res.status(404).json({ success: false, message: 'Sub-Designation not found' });
//         return;
//       }

//       res.status(200).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async createSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const subDesignation = await designationService.createSubDesignation({
//         ...req.body,
//         created_by: req.user?.id,
//       });
//       res.status(201).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async updateSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const subDesignation = await designationService.updateSubDesignation(id, {
//         ...req.body,
//         updated_by: req.user?.id,
//       });
//       res.status(200).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async deleteSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const deletedBy = req.user?.id;
//       await designationService.deleteSubDesignation(id, deletedBy);
//       res.status(200).json({ success: true, message: 'Sub-Designation deleted successfully' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }
// }













// import { Request, Response } from 'express';
// import { DesignationService } from './designation.service';

// const designationService = new DesignationService();

// export class DesignationController {
//   // ==========================================
//   // DESIGNATION CONTROLLERS
//   // ==========================================

//   public async createDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const designation = await designationService.createDesignation(req.body);
//       res.status(201).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async getAllDesignations(req: Request, res: Response): Promise<void> {
//     try {
//       const includeInactive = req.query.include_inactive === 'true';
//       const designations = await designationService.getAllDesignations(includeInactive);
//       res.status(200).json({ success: true, data: designations });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async getDesignationById(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const designation = await designationService.getDesignationById(id);

//       if (!designation) {
//         res.status(404).json({ success: false, message: 'Designation not found' });
//         return;
//       }

//       res.status(200).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async updateDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const designation = await designationService.updateDesignation(id, req.body);
//       res.status(200).json({ success: true, data: designation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async deleteDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       await designationService.deleteDesignation(id);
//       res.status(200).json({ success: true, message: 'Designation deleted successfully' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   // ==========================================
//   // SUB-DESIGNATION CONTROLLERS
//   // ==========================================

//   public async getAllSubDesignations(req: Request, res: Response): Promise<void> {
//     try {
//       const filters = {
//         designation_id: req.query.designation_id ? Number(req.query.designation_id) : undefined,
//         is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
//         search: req.query.search ? String(req.query.search) : undefined,
//       };

//       const subDesignations = await designationService.getAllSubDesignations(filters);
//       res.status(200).json({ success: true, data: subDesignations });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async getSubDesignationById(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const subDesignation = await designationService.getSubDesignationById(id);

//       if (!subDesignation) {
//         res.status(404).json({ success: false, message: 'Sub-Designation not found' });
//         return;
//       }

//       res.status(200).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }

//   public async createSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const subDesignation = await designationService.createSubDesignation(req.body);
//       res.status(201).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async updateSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       const subDesignation = await designationService.updateSubDesignation(id, req.body);
//       res.status(200).json({ success: true, data: subDesignation });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }

//   public async deleteSubDesignation(req: Request, res: Response): Promise<void> {
//     try {
//       const id = Number(req.params.id);
//       await designationService.deleteSubDesignation(id);
//       res.status(200).json({ success: true, message: 'Sub-Designation deleted successfully' });
//     } catch (error: any) {
//       res.status(400).json({ success: false, message: error.message });
//     }
//   }
// }


























// import { Request, Response, NextFunction } from 'express';
// import { DesignationService } from './designation.service';

// const designationService = new DesignationService();

// export class DesignationController {
//   // ─── Designation Handlers ─────────────────────────────────────────────────
//   async getAll(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.getAll(req.query);
//       res.status(200).json({ success: true, data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getById(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.getById(Number(req.params.id));
//       res.status(200).json({ success: true, data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async create(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.create(req.body);
//       res.status(201).json({ success: true, message: 'Designation created successfully', data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async update(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.update(Number(req.params.id), req.body);
//       res.status(200).json({ success: true, message: 'Designation updated successfully', data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async delete(req: Request, res: Response, next: NextFunction) {
//     try {
//       await designationService.delete(Number(req.params.id));
//       res.status(200).json({ success: true, message: 'Designation deleted successfully' });
//     } catch (error) {
//       next(error);
//     }
//   }

//   // ─── Sub-Designation Handlers ─────────────────────────────────────────────
//   async getAllSubDesignations(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.getAllSubDesignations({
//         ...req.query,
//         designation_id: req.query.designation_id ? Number(req.query.designation_id) : undefined,
//       });
//       res.status(200).json({ success: true, data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async createSubDesignation(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.createSubDesignation(req.body);
//       res.status(201).json({ success: true, message: 'Sub-Designation created successfully', data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async updateSubDesignation(req: Request, res: Response, next: NextFunction) {
//     try {
//       const data = await designationService.updateSubDesignation(Number(req.params.id), req.body);
//       res.status(200).json({ success: true, message: 'Sub-Designation updated successfully', data });
//     } catch (error) {
//       next(error);
//     }
//   }

//   async deleteSubDesignation(req: Request, res: Response, next: NextFunction) {
//     try {
//       await designationService.deleteSubDesignation(Number(req.params.id));
//       res.status(200).json({ success: true, message: 'Sub-Designation deleted successfully' });
//     } catch (error) {
//       next(error);
//     }
//   }
// }




import { Request, Response, NextFunction } from 'express';
import { DesignationService } from './designation.service';

const designationService = new DesignationService();

export class DesignationController {
  // ─── Designation Handlers ─────────────────────────────────────────────────
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.getAll(req.query);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.getById(Number(req.params.id));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.create(req.body);
      res.status(201).json({ success: true, message: 'Designation created successfully', data });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.update(Number(req.params.id), req.body);
      res.status(200).json({ success: true, message: 'Designation updated successfully', data });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await designationService.delete(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Designation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ─── Sub-Designation Handlers ─────────────────────────────────────────────
  
  async getAllSubDesignations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.getAllSubDesignations({
        ...req.query,
        designation_id: req.query.designation_id ? Number(req.query.designation_id) : undefined,
      });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSubDesignationById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.getSubDesignationById(Number(req.params.id));
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createSubDesignation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.createSubDesignation(req.body);
      res.status(201).json({ success: true, message: 'Sub-Designation created successfully', data });
    } catch (error) {
      next(error);
    }
  }

  async updateSubDesignation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await designationService.updateSubDesignation(Number(req.params.id), req.body);
      res.status(200).json({ success: true, message: 'Sub-Designation updated successfully', data });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubDesignation(req: Request, res: Response, next: NextFunction) {
    try {
      await designationService.deleteSubDesignation(Number(req.params.id));
      res.status(200).json({ success: true, message: 'Sub-Designation deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
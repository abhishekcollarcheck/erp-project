// import { Request, Response, NextFunction } from 'express';
// import { SubDepartmentService } from './subDepartment.service';
// import { sendResponse } from '../../utils/response';

// const subdepartmentService = new SubDepartmentService();

// export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.getAll(req.query as any);
//     sendResponse(res, { data, message: 'Departments fetched' });
//   } catch (e) { next(e); }
// }

// export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.getById(parseInt(req.params.id, 10));
//     sendResponse(res, { data, message: 'Department fetched' });
//   } catch (e) { next(e); }
// }

// export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.create(req.body, req.user!.employeeId);
//     sendResponse(res, { data, message: 'Department created successfully', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.update(
//       parseInt(req.params.id, 10),
//       req.user!.companyId,
//       req.body,
//       req.user!.employeeId,
//     );
//     sendResponse(res, { data, message: 'Department updated' });
//   } catch (e) { next(e); }
// }

// export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     await subdepartmentService.delete(parseInt(req.params.id, 10), req.user!.companyId, req.user!.employeeId);
//     sendResponse(res, { data: null, message: 'Department deleted' });
//   } catch (e) { next(e); }
// }


// import { Request, Response, NextFunction } from 'express';
// import { SubDepartmentService } from './subDepartment.service';
// import { sendResponse } from '../../utils/response';
// import { AppError } from '../../middleware/errorHandler.middleware';

// const subdepartmentService = new SubDepartmentService();

// export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     // FIX: Pass companyId first
//     const data = await subdepartmentService.getAll(req.user!.companyId, req.query as any);
//     sendResponse(res, { data, message: 'Sub-departments fetched successfully' });
//   } catch (e) { next(e); }
// }

// export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     // FIX: Pass companyId for tenant isolation
//     const data = await subdepartmentService.getById(id, req.user!.companyId);
//     sendResponse(res, { data, message: 'Sub-department fetched successfully' });
//   } catch (e) { next(e); }
// }

// export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     // FIX: Match parameter order (dto, companyId, employeeId)
//     const data = await subdepartmentService.create(
//       req.body,
//       req.user!.companyId,
//       req.user!.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department created successfully', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const data = await subdepartmentService.update(
//       id,
//       req.user!.companyId,
//       req.body,
//       req.user!.employeeId,
//     );
//     sendResponse(res, { data, message: 'Sub-department updated successfully' });
//   } catch (e) { next(e); }
// }

// export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     await subdepartmentService.delete(id, req.user!.companyId, req.user!.employeeId);
//     sendResponse(res, { data: null, message: 'Sub-department deleted successfully' });
//   } catch (e) { next(e); }
// }



// import { Request, Response, NextFunction } from 'express';
// import { SubDepartmentService } from './subDepartment.service';
// import { sendResponse } from '../../utils/response';
// import { AppError } from '../../middleware/errorHandler.middleware';

// const subdepartmentService = new SubDepartmentService();

// export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const companyId = req.user?.companyId;
//     if (!companyId) throw new AppError('Unauthorized: Company context missing', 401);

//     const data = await subdepartmentService.getAll(companyId, req.query as any);
//     sendResponse(res, { data, message: 'Sub-departments fetched successfully' });
//   } catch (e) {
//      next(e); }
// }

// export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId;
//     if (!companyId) throw new AppError('Unauthorized: Company context missing', 401);

//     const data = await subdepartmentService.getById(id, companyId);
//     sendResponse(res, { data, message: 'Sub-department fetched successfully' });
//   } catch (e) { next(e); }
// }

// export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {

//     console.log(req.body);
//     const companyId = req.user?.companyId;
//     if (!companyId) throw new AppError('Unauthorized: Company context missing', 401);

//     const data = await subdepartmentService.create(
//       req.body,
//       companyId,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department created successfully', statusCode: 201 });
//   } catch (e) { next(e); }
// }

// export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId;
//     if (!companyId) throw new AppError('Unauthorized: Company context missing', 401);

//     const data = await subdepartmentService.update(
//       id,
//       companyId,
//       req.body,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department updated successfully' });
//   } catch (e) { next(e); }
// }

// export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId;
//     if (!companyId) throw new AppError('Unauthorized: Company context missing', 401);

//     await subdepartmentService.delete(id, companyId, req.user?.employeeId);
//     sendResponse(res, { data: null, message: 'Sub-department deleted successfully' });
//   } catch (e) { next(e); }
// }




// import { Request, Response, NextFunction } from 'express';
// import { SubDepartmentService } from './subDepartment.service';
// import { sendResponse } from '../../utils/response';
// import { AppError } from '../../middleware/errorHandler.middleware';

// const subdepartmentService = new SubDepartmentService();

// export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.getAll(req.query as any);
//     sendResponse(res, { data, message: 'Sub-departments fetched successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const data = await subdepartmentService.getById(id);
//     sendResponse(res, { data, message: 'Sub-department fetched successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const companyId = req.user?.companyId ?? null;

//     const data = await subdepartmentService.create(
//       req.body,
//       companyId,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department created successfully', statusCode: 201 });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId ?? null;

//     const data = await subdepartmentService.update(
//       id,
//       req.body,
//       companyId,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department updated successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId ?? null;

//     await subdepartmentService.delete(id, companyId, req.user?.employeeId);
//     sendResponse(res, { data: null, message: 'Sub-department deleted successfully' });
//   } catch (e) {
//     next(e);
//   }
// }










// import { Request, Response, NextFunction } from 'express';
// import { SubDepartmentService } from './subDepartment.service';
// import { sendResponse } from '../../utils/response';
// import { AppError } from '../../middleware/errorHandler.middleware';

// const subdepartmentService = new SubDepartmentService();

// export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const data = await subdepartmentService.getAll(req.query as any);
//     sendResponse(res, { data, message: 'Sub-departments fetched successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const data = await subdepartmentService.getById(id);
//     sendResponse(res, { data, message: 'Sub-department fetched successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const companyId = req.user?.companyId ?? null;

//     const data = await subdepartmentService.create(
//       req.body,
//       companyId,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department created successfully', statusCode: 201 });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId ?? null;

//     const data = await subdepartmentService.update(
//       id,
//       req.body,
//       companyId,
//       req.user?.employeeId
//     );
//     sendResponse(res, { data, message: 'Sub-department updated successfully' });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
//   try {
//     const id = parseInt(req.params.id, 10);
//     if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

//     const companyId = req.user?.companyId ?? null;

//     await subdepartmentService.delete(id, companyId, req.user?.employeeId);
//     sendResponse(res, { data: null, message: 'Sub-department deleted successfully' });
//   } catch (e) {
//     next(e);
//   }
// }


import { Request, Response, NextFunction } from 'express';
import { SubDepartmentService } from './subDepartment.service';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/errorHandler.middleware';

const subdepartmentService = new SubDepartmentService();

export async function getSubDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await subdepartmentService.getAll(req.query as any);
    sendResponse(res, { data, message: 'Sub-departments fetched successfully' });
  } catch (e) {
    next(e);
  }
}

export async function getSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

    const data = await subdepartmentService.getById(id);
    sendResponse(res, { data, message: 'Sub-department fetched successfully' });
  } catch (e) {
    next(e);
  }
}

// NOTE: req.body now follows CreateSubDepartmentDto — { name, code?, description?,
// is_all_departments?, department_ids?, head_id? } — instead of the old
// single `department_id`. No controller change needed; the service validates
// the new shape.
export async function createSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {

    console.log(req.body);
    const companyId = req.user?.companyId ?? null;

    const data = await subdepartmentService.create(
      req.body,
      companyId,
      req.user?.employeeId
    );
    sendResponse(res, { data, message: 'Sub-department created successfully', statusCode: 201 });
  } catch (e) {
    console.log(e);
    next(e);
  }
}

// NOTE: req.body now follows UpdateSubDepartmentDto — send `department_ids`
// (even as []) to replace the linked departments, or omit it entirely to
// leave existing links untouched. Send `is_all_departments: true` to clear
// explicit links and apply to every department.
export async function updateSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

    const companyId = req.user?.companyId ?? null;

    const data = await subdepartmentService.update(
      id,
      req.body,
      companyId,
      req.user?.employeeId
    );
    sendResponse(res, { data, message: 'Sub-department updated successfully' });
  } catch (e) {
    next(e);
  }
}

export async function deleteSubDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new AppError('Invalid ID provided', 400);

    const companyId = req.user?.companyId ?? null;

    await subdepartmentService.delete(id, companyId, req.user?.employeeId);
    sendResponse(res, { data: null, message: 'Sub-department deleted successfully' });
  } catch (e) {
    next(e);
  }
}
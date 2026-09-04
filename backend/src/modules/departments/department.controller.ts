// import { Request, Response, NextFunction } from 'express';
// import { DepartmentService } from './department.service';
// import { sendResponse } from '../../utils/response';

// const departmentService = new DepartmentService();

// /** Helper to convert and validate numeric IDs safely */
// function parseId(value: unknown): number | undefined {
//   const parsed = Number(value);
//   return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
// }

// /** Helper to parse single or array of company IDs */
// function parseCompanyIds(value: unknown): number[] {
//   if (Array.isArray(value)) {
//     return value.map((v) => parseId(v)).filter((v): v is number => v !== undefined);
//   }
//   const single = parseId(value);
//   return single ? [single] : [];
// }

// // export async function getDepartments(
// //   req: Request,
// //   res: Response,
// //   next: NextFunction,
// // ): Promise<void> {
// //   try {
// //     const companyId = parseId(req.query.company_id);
// //     if (!companyId) {
// //       res.status(400).json({ message: 'Valid company_id is required' });
// //       return;
// //     }

// //     const data = await departmentService.getAll(companyId, req.query);

// //     sendResponse(res, {
// //       data,
// //       message: 'Departments fetched successfully',
// //     });
// //   } catch (e) {
// //     next(e);
// //   }
// // }

// export async function getDepartments(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     let companyIds: number[] = [];

//     // ?company_ids=1,2,3
//     if (typeof req.query.company_ids === 'string') {
//       companyIds = req.query.company_ids
//         .split(',')
//         .map((id) => parseId(id))
//         .filter((id): id is number => id !== undefined);
//     }

//     // ?company_id=1&company_id=2
//     else if (Array.isArray(req.query.company_id)) {
//       companyIds = parseCompanyIds(req.query.company_id);
//     }

//     // ?company_id=1
//     else if (req.query.company_id !== undefined) {
//       companyIds = parseCompanyIds(req.query.company_id);
//     }

//     // Remove duplicates
//     companyIds = Array.from(new Set(companyIds));

//     if (companyIds.length === 0) {
//       res.status(400).json({
//         message: 'At least one valid company_id is required',
//       });
//       return;
//     }

//     const data = await departmentService.getAll(companyIds, req.query);

//     sendResponse(res, {
//       data,
//       message: 'Departments fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getDepartmentStats(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyId = parseId(req.query.company_id);
//     if (!companyId) {
//       res.status(400).json({ message: 'Valid company_id is required' });
//       return;
//     }

//     const data = await departmentService.getStats(companyId);

//     sendResponse(res, {
//       data,
//       message: 'Department stats fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const companyId = parseId(req.query.company_id);

//     if (!departmentId || !companyId) {
//       res.status(400).json({ message: 'Valid department ID and company_id are required' });
//       return;
//     }

//     const data = await departmentService.getById(departmentId, companyId);

//     sendResponse(res, {
//       data,
//       message: 'Department fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function createDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = parseCompanyIds(req.body.company_ids ?? req.body.company_id);
//     const employeeId = req.user?.employeeId;

//     if (companyIds.length === 0 || !employeeId) {
//       res.status(400).json({ message: 'At least one valid company_id and authenticated user are required' });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       company_ids: companyIds,
//     };

//     const data = await departmentService.create(payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department created successfully across selected companies',
//       statusCode: 201,
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function updateDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const currentCompanyId = parseId(req.body.current_company_id ?? req.body.company_id);
//     const companyIds = req.body.company_ids ? parseCompanyIds(req.body.company_ids) : undefined;
//     const employeeId = req.user?.employeeId;

//     if (!departmentId || !currentCompanyId || !employeeId) {
//       res.status(400).json({ message: 'Valid parameters and user context are required' });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       ...(companyIds && { company_ids: companyIds }),
//     };

//     const data = await departmentService.update(
//       departmentId,
//       currentCompanyId,
//       payload,
//       employeeId,
//     );

//     sendResponse(res, {
//       data,
//       message: 'Department updated successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function deleteDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const companyId = parseId(req.query.company_id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId || !companyId || !employeeId) {
//       res.status(400).json({ message: 'Valid parameters and user context are required' });
//       return;
//     }

//     await departmentService.delete(departmentId, companyId, employeeId);

//     sendResponse(res, {
//       data: null,
//       message: 'Department deleted successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }


// import { Request, Response, NextFunction } from 'express';
// import { DepartmentService } from './department.service';
// import { sendResponse } from '../../utils/response';

// const departmentService = new DepartmentService();

// /**
//  * Convert a value to a positive integer.
//  */
// function parseId(value: unknown): number | undefined {
//   const parsed = Number(value);

//   return Number.isInteger(parsed) && parsed > 0
//     ? parsed
//     : undefined;
// }

// /**
//  * Parse company IDs from:
//  *
//  * ?company_ids=1,2,3
//  *
//  * ?company_id=1&company_id=2
//  *
//  * ?company_id[]=1&company_id[]=2
//  */
// function parseCompanyIds(value: unknown): number[] {
//   if (Array.isArray(value)) {
//     return Array.from(
//       new Set(
//         value
//           .map((v) => parseId(v))
//           .filter((v): v is number => v !== undefined),
//       ),
//     );
//   }

//   if (typeof value === 'string') {
//     return Array.from(
//       new Set(
//         value
//           .split(',')
//           .map((v) => parseId(v.trim()))
//           .filter((v): v is number => v !== undefined),
//       ),
//     );
//   }

//   const single = parseId(value);

//   return single ? [single] : [];
// }

// /**
//  * Extract company IDs from request query.
//  *
//  * Preferred:
//  * ?company_ids=1,2,3
//  *
//  * Also supports:
//  * ?company_id=1
//  * ?company_id=1&company_id=2
//  */
// function getCompanyIdsFromQuery(req: Request): number[] {
//   if (req.query.company_ids !== undefined) {
//     return parseCompanyIds(req.query.company_ids);
//   }

//   return parseCompanyIds(req.query.company_id);
// }

// /**
//  * GET /departments
//  *
//  * Examples:
//  *
//  * /departments?company_ids=1,2,3
//  * /departments?company_id=1
//  * /departments?company_id=1&company_id=2
//  */
// export async function getDepartments(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = getCompanyIdsFromQuery(req);

//     if (companyIds.length === 0) {
//       res.status(400).json({
//         message: 'At least one valid company_id is required',
//       });
//       return;
//     }

//     const data = await departmentService.getAll(
//       companyIds,
//       req.query,
//     );

//     sendResponse(res, {
//       data,
//       message: 'Departments fetched successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// /**
//  * GET /departments/stats
//  *
//  * Supports multiple companies as well.
//  */
// export async function getDepartmentStats(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = getCompanyIdsFromQuery(req);

//     if (companyIds.length === 0) {
//       res.status(400).json({
//         message: 'At least one valid company_id is required',
//       });
//       return;
//     }

//     const data = await departmentService.getStats(companyIds);

//     sendResponse(res, {
//       data,
//       message: 'Department stats fetched successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// /**
//  * GET /departments/:id
//  *
//  * A department ID belongs to one company record.
//  * current_company_id tells us which company record is being opened.
//  */
// export async function getDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);

//     const companyId = parseId(
//       req.query.company_id,
//     );

//     if (!departmentId || !companyId) {
//       res.status(400).json({
//         message:
//           'Valid department ID and company_id are required',
//       });
//       return;
//     }

//     const data = await departmentService.getById(
//       departmentId,
//       companyId,
//     );

//     sendResponse(res, {
//       data,
//       message: 'Department fetched successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// /**
//  * POST /departments
//  *
//  * Body:
//  * {
//  *   "company_ids": [1, 2, 3],
//  *   "department_name": "HR",
//  *   "department_code": "HR01",
//  *   "head_id": null
//  * }
//  */
// export async function createDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = parseCompanyIds(
//       req.body.company_ids ?? req.body.company_id,
//     );

//     const employeeId = req.user?.employeeId;

//     if (companyIds.length === 0) {
//       res.status(400).json({
//         message: 'At least one valid company_id is required',
//       });
//       return;
//     }

//     if (!employeeId) {
//       res.status(401).json({
//         message: 'Authenticated employee is required',
//       });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       company_ids: companyIds,
//     };

//     const data = await departmentService.create(
//       payload,
//       employeeId,
//     );

//     sendResponse(res, {
//       data,
//       message:
//         'Department created successfully for selected companies',
//       statusCode: 201,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// /**
//  * PUT /departments/:id
//  *
//  * Body:
//  * {
//  *   "current_company_id": 1,
//  *   "company_ids": [1, 3],
//  *   "department_name": "HR",
//  *   "department_code": "HR01"
//  * }
//  *
//  * company_ids is the FINAL company list.
//  */
// export async function updateDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);

//     const currentCompanyId = parseId(
//       req.body.current_company_id ??
//         req.body.company_id,
//     );

//     const companyIds =
//       req.body.company_ids !== undefined
//         ? parseCompanyIds(req.body.company_ids)
//         : undefined;

//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({
//         message: 'Valid department ID is required',
//       });
//       return;
//     }

//     if (!currentCompanyId) {
//       res.status(400).json({
//         message: 'Valid current_company_id is required',
//       });
//       return;
//     }

//     if (!employeeId) {
//       res.status(401).json({
//         message: 'Authenticated employee is required',
//       });
//       return;
//     }

//     if (
//       req.body.company_ids !== undefined &&
//       (!companyIds || companyIds.length === 0)
//     ) {
//       res.status(400).json({
//         message:
//           'Department must belong to at least one company',
//       });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       ...(companyIds !== undefined
//         ? { company_ids: companyIds }
//         : {}),
//     };

//     const data = await departmentService.update(
//       departmentId,
//       currentCompanyId,
//       payload,
//       employeeId,
//     );

//     sendResponse(res, {
//       data,
//       message: 'Department updated successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// /**
//  * DELETE /departments/:id?company_id=2
//  *
//  * Deletes department ONLY from the specified company.
//  */
// export async function deleteDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);

//     const companyId = parseId(
//       req.query.company_id,
//     );

//     const employeeId = req.user?.employeeId;

//     if (!departmentId || !companyId) {
//       res.status(400).json({
//         message:
//           'Valid department ID and company_id are required',
//       });
//       return;
//     }

//     if (!employeeId) {
//       res.status(401).json({
//         message: 'Authenticated employee is required',
//       });
//       return;
//     }

//     await departmentService.delete(
//       departmentId,
//       companyId,
//       employeeId,
//     );

//     sendResponse(res, {
//       data: null,
//       message:
//         'Department removed from the selected company successfully',
//     });
//   } catch (error) {
//     next(error);
//   }
// }




































// import { Request, Response, NextFunction } from 'express';
// import { DepartmentService } from './department.service';
// import { sendResponse } from '../../utils/response';

// const departmentService = new DepartmentService();

// function parseId(value: unknown): number | undefined {
//   const parsed = Number(value);
//   return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
// }

// function parseCompanyIds(value: unknown): number[] {
//   if (Array.isArray(value)) {
//     return value.map((v) => parseId(v)).filter((v): v is number => v !== undefined);
//   }
//   if (typeof value === 'string' && value.includes(',')) {
//     return value.split(',').map((v) => parseId(v)).filter((v): v is number => v !== undefined);
//   }
//   const single = parseId(value);
//   return single ? [single] : [];
// }

// export async function getDepartments(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = parseCompanyIds(req.query.company_ids ?? req.query.company_id);
//     const data = await departmentService.getAll(companyIds, req.query);

//     sendResponse(res, {
//       data,
//       message: 'Departments fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     const data = await departmentService.getById(departmentId);

//     sendResponse(res, {
//       data,
//       message: 'Department fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function createDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const { is_all_companies, department_name } = req.body;
//     const companyIds = parseCompanyIds(req.body.company_ids ?? req.body.company_id);
//     const employeeId = req.user?.employeeId;

//     if (!department_name?.trim()) {
//       res.status(400).json({ message: 'Department name is required' });
//       return;
//     }

//     if (!is_all_companies && companyIds.length === 0) {
//       res.status(400).json({ message: 'Select at least one company or enable All Companies' });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       company_ids: companyIds,
//       is_all_companies: Boolean(is_all_companies),
//     };

//     const data = await departmentService.create(payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department created successfully',
//       statusCode: 201,
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function updateDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     const companyIds = req.body.company_ids !== undefined 
//       ? parseCompanyIds(req.body.company_ids) 
//       : undefined;

//     const payload = {
//       ...req.body,
//       ...(companyIds !== undefined && { company_ids: companyIds }),
//     };

//     const data = await departmentService.update(departmentId, payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department updated successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function deleteDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     await departmentService.delete(departmentId, employeeId);

//     sendResponse(res, {
//       data: null,
//       message: 'Department deleted successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }


























// import { Request, Response, NextFunction } from 'express';
// import { DepartmentService } from './department.service';
// import { sendResponse } from '../../utils/response';

// const departmentService = new DepartmentService();

// function parseId(value: unknown): number | undefined {
//   const parsed = Number(value);
//   return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
// }

// function parseCompanyIds(value: unknown): number[] {
//   if (Array.isArray(value)) {
//     return value.map((v) => parseId(v)).filter((v): v is number => v !== undefined);
//   }
//   if (typeof value === 'string' && value.includes(',')) {
//     return value.split(',').map((v) => parseId(v)).filter((v): v is number => v !== undefined);
//   }
//   const single = parseId(value);
//   return single ? [single] : [];
// }

// export async function getDepartments(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const companyIds = parseCompanyIds(req.query.company_ids ?? req.query.company_id);
//     const data = await departmentService.getAll(companyIds, req.query);

//     sendResponse(res, {
//       data,
//       message: 'Departments fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function getDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     const data = await departmentService.getById(departmentId);

//     sendResponse(res, {
//       data,
//       message: 'Department fetched successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function createDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {

//   console.log("hitted");
//   console.log(req.body);
//   try {
//     const { is_all_companies, department_name } = req.body;
//     const companyIds = parseCompanyIds(req.body.company_ids ?? req.body.company_id);
//     const employeeId = req.user?.employeeId;

//     if (!department_name?.trim()) {
//       res.status(400).json({ message: 'Department name is required' });
//       return;
//     }

//     if (!is_all_companies && companyIds.length === 0) {
//       res.status(400).json({ message: 'Select at least one company or enable All Companies' });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       company_ids: companyIds,
//       is_all_companies: Boolean(is_all_companies),
//     };

//     const data = await departmentService.create(payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department created successfully',
//       statusCode: 201,
//     });
//   } catch (e) {
//     console.log(e);
//     next(e);
//   }
// }

// export async function updateDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     const companyIds = req.body.company_ids !== undefined 
//       ? parseCompanyIds(req.body.company_ids) 
//       : undefined;

//     const payload = {
//       ...req.body,
//       ...(companyIds !== undefined && { company_ids: companyIds }),
//     };

//     const data = await departmentService.update(departmentId, payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department updated successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }

// export async function deleteDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     await departmentService.delete(departmentId, employeeId);

//     sendResponse(res, {
//       data: null,
//       message: 'Department deleted successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }



import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { sendResponse } from '../../utils/response';

const departmentService = new DepartmentService();

function parseId(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseCompanyIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((v) => parseId(v)).filter((v): v is number => v !== undefined);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    if (value.includes(',')) {
      return value.split(',').map((v) => parseId(v)).filter((v): v is number => v !== undefined);
    }
    const single = parseId(value);
    return single ? [single] : [];
  }
  const single = parseId(value);
  return single ? [single] : [];
}

export async function getDepartments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyIds = parseCompanyIds(req.query.company_ids ?? req.query.company_id);
    const data = await departmentService.getAll(companyIds, req.query);

    sendResponse(res, {
      data,
      message: 'Departments fetched successfully',
    });
  } catch (e) {
    next(e);
  }
}

export async function getDepartment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const departmentId = parseId(req.params.id);
    if (!departmentId) {
      res.status(400).json({ message: 'Valid department ID is required' });
      return;
    }

    const data = await departmentService.getById(departmentId);

    sendResponse(res, {
      data,
      message: 'Department fetched successfully',
    });
  } catch (e) {
    next(e);
  }
}

export async function createDepartment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { is_all_companies, department_name } = req.body;
    const companyIds = parseCompanyIds(req.body.company_ids ?? req.body.company_id);
    const employeeId = req.user?.employeeId;

    if (!department_name?.trim()) {
      res.status(400).json({ message: 'Department name is required' });
      return;
    }

    if (!is_all_companies && companyIds.length === 0) {
      res.status(400).json({ message: 'Select at least one company or enable All Companies' });
      return;
    }

    const payload = {
      ...req.body,
      company_ids: companyIds,
      is_all_companies: Boolean(is_all_companies),
    };

    const data = await departmentService.create(payload, employeeId);

    sendResponse(res, {
      data,
      message: 'Department created successfully',
      statusCode: 201,
    });
  } catch (e) {
    next(e);
  }
}

// export async function updateDepartment(
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> {
//   try {
//     const departmentId = parseId(req.params.id);
//     const employeeId = req.user?.employeeId;

//     if (!departmentId) {
//       res.status(400).json({ message: 'Valid department ID is required' });
//       return;
//     }

//     const rawCompanyIds = req.body.company_ids ?? req.body.company_id;
//     const companyIds = rawCompanyIds !== undefined ? parseCompanyIds(rawCompanyIds) : undefined;
//     const isAllCompanies = req.body.is_all_companies !== undefined 
//       ? Boolean(req.body.is_all_companies) 
//       : undefined;

//     // Validation: Prevent removing all companies when is_all_companies is false
//     if (isAllCompanies === false && companyIds !== undefined && companyIds.length === 0) {
//       res.status(400).json({ message: 'Select at least one company or enable All Companies' });
//       return;
//     }

//     const payload = {
//       ...req.body,
//       ...(companyIds !== undefined && { company_ids: companyIds }),
//       ...(isAllCompanies !== undefined && { is_all_companies: isAllCompanies }),
//     };

//     const data = await departmentService.update(departmentId, payload, employeeId);

//     sendResponse(res, {
//       data,
//       message: 'Department updated successfully',
//     });
//   } catch (e) {
//     next(e);
//   }
// }


export async function updateDepartment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const departmentId = parseId(req.params.id);
    const employeeId = req.user?.employeeId;

    if (!departmentId) {
      res.status(400).json({ message: 'Valid department ID is required' });
      return;
    }

    const rawCompanyIds = req.body.company_ids ?? req.body.company_id;
    const companyIds = rawCompanyIds !== undefined ? parseCompanyIds(rawCompanyIds) : undefined;
    const isAllCompanies = req.body.is_all_companies !== undefined 
      ? Boolean(req.body.is_all_companies) 
      : undefined;

    // FIX: Only throw 400 if is_all_companies is explicitly FALSE (or remaining false) AND company_ids is empty.
    // If is_all_companies is TRUE, companyIds CAN be empty!
    if (isAllCompanies === false && companyIds !== undefined && companyIds.length === 0) {
      res.status(400).json({ message: 'Select at least one company or enable All Companies' });
      return;
    }

    const payload = {
      ...req.body,
      ...(companyIds !== undefined && { company_ids: companyIds }),
      ...(isAllCompanies !== undefined && { is_all_companies: isAllCompanies }),
    };

    const data = await departmentService.update(departmentId, payload, employeeId);

    sendResponse(res, {
      data,
      message: 'Department updated successfully',
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteDepartment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const departmentId = parseId(req.params.id);
    const employeeId = req.user?.employeeId;

    if (!departmentId) {
      res.status(400).json({ message: 'Valid department ID is required' });
      return;
    }

    await departmentService.delete(departmentId, employeeId);

    sendResponse(res, {
      data: null,
      message: 'Department deleted successfully',
    });
  } catch (e) {
    next(e);
  }
}
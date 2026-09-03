// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateDepartmentDto {
//   company_ids: number[];
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
// }

// export interface UpdateDepartmentDto {
//   company_ids?: number[];
//   department_name?: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
// }

// export class DepartmentService {

//   // ─── List (with employee count) ──────────────────────────────────────────
//   // async getAll(companyId: number, query: DepartmentQueryParams = {}) {
//   //   const where: WhereOptions = { company_id: companyId };

//   //   if (query.is_active === 'false' || query.is_active === false) {
//   //     where['is_active'] = 0;
//   //   } else if (query.is_active !== 'all') {
//   //     where['is_active'] = 1;
//   //   }

//   //   if (query.search) {
//   //     (where as any)[Op.or] = [
//   //       { department_name: { [Op.like]: `%${query.search}%` } },
//   //       { department_code: { [Op.like]: `%${query.search}%` } },
//   //     ];
//   //   }

//   //   const departments = await Department.findAll({
//   //     where,
//   //     order: [['department_name', 'ASC']],
//   //   });

//   //   if (departments.length === 0) return [];

//   //   const deptIds = departments.map((d) => d.id);
//   //   const empCounts = await Employee.findAll({
//   //     where: { department_id: deptIds, status: ['Active', 'On_Probation'] },
//   //     attributes: ['department_id', [fn('COUNT', col('id')), 'count']],
//   //     group: ['department_id'],
//   //     raw: true,
//   //   });

//   //   const countMap = new Map<number, number>(
//   //     empCounts.map((r: any) => [r.department_id, Number(r.count)]),
//   //   );

//   //   return departments.map((d) => ({
//   //     ...d.toJSON(),
//   //     employee_count: countMap.get(d.id) ?? 0,
//   //   }));
//   // }

//   async getAll(companyIds: number[], query: DepartmentQueryParams = {}) {
//     const uniqueCompanyIds = Array.from(new Set(companyIds));

//     const where: WhereOptions = {
//       company_id: {
//         [Op.in]: uniqueCompanyIds,
//       },
//     };

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = 0;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = 1;
//     }

//     if (query.search) {
//       (where as any)[Op.or] = [
//         {
//           department_name: {
//             [Op.like]: `%${query.search}%`,
//           },
//         },
//         {
//           department_code: {
//             [Op.like]: `%${query.search}%`,
//           },
//         },
//       ];
//     }

//     const departments = await Department.findAll({
//       where,
//       order: [
//         ['department_name', 'ASC'],
//         ['company_id', 'ASC'],
//       ],
//     });

//     if (departments.length === 0) {
//       return [];
//     }

//     const deptIds = departments.map((d) => d.id);

//     const empCounts = await Employee.findAll({
//       where: {
//         department_id: deptIds,
//         status: ['Active', 'On_Probation'],
//       },
//       attributes: [
//         'department_id',
//         [fn('COUNT', col('id')), 'count'],
//       ],
//       group: ['department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [
//         r.department_id,
//         Number(r.count),
//       ]),
//     );

//     return departments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Single ───────────────────────────────────────────────────────────────
//   async getById(id: number, companyId: number) {
//     const dept = await Department.findOne({
//       where: { id, company_id: companyId },
//       include: [
//         {
//           model: Employee,
//           as: 'head',
//           attributes: ['id', 'first_name', 'last_name', 'avatar_url'],
//           required: false,
//         },
//         {
//           model: Employee,
//           as: 'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//           where: { status: ['Active', 'On_Probation'] },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) throw new AppError('Department not found', 404);

//     // Fetch all connected company IDs for the same department name
//     const relatedDepts = await Department.findAll({
//       where: { department_name: dept.department_name },
//       attributes: ['company_id'],
//     });

//     const connectedCompanyIds = relatedDepts
//       .map((d) => d.company_id)
//       .filter((cid): cid is number => cid !== null);

//     return {
//       ...dept.toJSON(),
//       company_ids: connectedCompanyIds,
//     };
//   }

//   // ─── Summary stats ────────────────────────────────────────────────────────
//   async getStats(companyId: number) {
//     const [total, active] = await Promise.all([
//       Department.count({ where: { company_id: companyId } }),
//       Department.count({ where: { company_id: companyId, is_active: true } }),
//     ]);

//     const empCounts = await Employee.findAll({
//       where: { status: ['Active', 'On_Probation'] },
//       include: [{
//         model: Department,
//         as: 'department',
//         where: { company_id: companyId },
//         attributes: [],
//         required: true,
//       }],
//       attributes: ['department_id', [fn('COUNT', col('Employee.id')), 'count']],
//       group: ['department_id'],
//       raw: true,
//     });

//     const largest = empCounts.reduce(
//       (max: any, r: any) => (Number(r.count) > Number(max?.count ?? 0) ? r : max),
//       null,
//     );

//     return {
//       total,
//       active,
//       inactive: total - active,
//       largestDeptId: largest ? Number(largest.department_id) : null,
//       largestDeptCount: largest ? Number(largest.count) : 0,
//     };
//   }

//   // ─── Create (Supports Multiple Company IDs) ──────────────────────────────
//   async create(dto: CreateDepartmentDto, createdBy?: number) {
//     const name = dto.department_name.trim();
//     const companyIds = Array.from(new Set(dto.company_ids || []));

//     if (companyIds.length === 0) {
//       throw new AppError('At least one company_id must be provided', 400);
//     }

//     // Check existing records for duplicates
//     const existing = await Department.findAll({
//       where: {
//         company_id: { [Op.in]: companyIds },
//         department_name: name,
//       },
//     });

//     if (existing.length > 0) {
//       const existingCompanyIds = existing.map((e) => e.company_id);
//       throw new AppError(
//         `Department "${name}" already exists for company ID(s): ${existingCompanyIds.join(', ')}`,
//         409
//       );
//     }

//     const payload = companyIds.map((cId) => ({
//       company_id: cId,
//       department_name: name,
//       department_code: dto.department_code?.toUpperCase().trim() || null,
//       head_id: dto.head_id ?? null,
//       is_active: true,
//       created_by: createdBy ?? null,
//     }));

//     const createdDepartments = await Department.bulkCreate(payload);

//     for (const dept of createdDepartments) {
//       await logActivity({
//         companyId: dept.company_id!,
//         employeeId: createdBy,
//         action: 'DEPARTMENT_CREATED',
//         module: 'departments',
//         entityId: dept.id,
//         newValues: { department_name: dept.department_name, department_code: dept.department_code },
//       });
//     }

//     return createdDepartments;
//   }

//   // ─── Update (Supports Adding / Removing Companies) ──────────────────────
//   // async update(id: number, currentCompanyId: number, dto: UpdateDepartmentDto, updatedBy?: number) {
//   //   const currentDept = await Department.findOne({ where: { id, company_id: currentCompanyId } });
//   //   if (!currentDept) throw new AppError('Department not found', 404);

//   //   const oldName = currentDept.department_name;
//   //   const newName = dto.department_name?.trim() || oldName;

//   //   // Find all records belonging to this department group across companies
//   //   const existingGroup = await Department.findAll({
//   //     where: { department_name: oldName },
//   //   });

//   //   const existingCompanyMap = new Map<number, Department>();
//   //   existingGroup.forEach((d) => {
//   //     if (d.company_id) existingCompanyMap.set(d.company_id, d);
//   //   });

//   //   const targetCompanyIds = dto.company_ids ? Array.from(new Set(dto.company_ids)) : Array.from(existingCompanyMap.keys());

//   //   // Check duplicate name in companies where department is newly added
//   //   if (newName !== oldName || dto.company_ids) {
//   //     const duplicates = await Department.findAll({
//   //       where: {
//   //         company_id: { [Op.in]: targetCompanyIds },
//   //         department_name: newName,
//   //         id: { [Op.notIn]: existingGroup.map((g) => g.id) },
//   //       },
//   //     });

//   //     if (duplicates.length > 0) {
//   //       throw new AppError(
//   //         `Department "${newName}" already exists in company ID(s): ${duplicates.map((d) => d.company_id).join(', ')}`,
//   //         409
//   //       );
//   //     }
//   //   }

//   //   // 1. Remove departments for unchecked companies
//   //   for (const [cId, deptRecord] of existingCompanyMap.entries()) {
//   //     if (!targetCompanyIds.includes(cId)) {
//   //       const empCount = await Employee.count({
//   //         where: { department_id: deptRecord.id, status: ['Active', 'On_Probation'] },
//   //       });

//   //       if (empCount > 0) {
//   //         throw new AppError(
//   //           `Cannot remove company ID ${cId} from "${oldName}" — ${empCount} active employee(s) are assigned.`,
//   //           409
//   //         );
//   //       }

//   //       await deptRecord.update({ is_active: false, deleted_by: updatedBy ?? null });
//   //       await deptRecord.destroy();
//   //     }
//   //   }

//   //   // 2. Add or Update records
//   //   for (const cId of targetCompanyIds) {
//   //     const deptRecord = existingCompanyMap.get(cId);

//   //     if (deptRecord) {
//   //       // Update existing record
//   //       await deptRecord.update({
//   //         department_name: newName,
//   //         department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : deptRecord.department_code,
//   //         head_id: dto.head_id !== undefined ? dto.head_id : deptRecord.head_id,
//   //         is_active: dto.is_active !== undefined ? dto.is_active : deptRecord.is_active,
//   //         updated_by: updatedBy ?? null,
//   //       });
//   //     } else {
//   //       // Create new record for newly added company
//   //       await Department.create({
//   //         company_id: cId,
//   //         department_name: newName,
//   //         department_code: dto.department_code?.toUpperCase().trim() || currentDept.department_code,
//   //         head_id: dto.head_id ?? currentDept.head_id,
//   //         is_active: dto.is_active ?? currentDept.is_active,
//   //         created_by: updatedBy ?? null,
//   //       });
//   //     }
//   //   }

//   //   return this.getById(id, currentCompanyId);
//   // }

//   async update(
//     id: number,
//     currentCompanyId: number,
//     dto: UpdateDepartmentDto,
//     updatedBy?: number,
//   ) {
//     // --------------------------------------------------
//     // 1. Find the department being edited
//     // --------------------------------------------------
//     const currentDept = await Department.findOne({
//       where: {
//         id,
//         company_id: currentCompanyId,
//       },
//     });

//     if (!currentDept) {
//       throw new AppError('Department not found', 404);
//     }

//     const oldName = currentDept.department_name;
//     const newName = dto.department_name?.trim() || oldName;

//     // --------------------------------------------------
//     // 2. Find all department records belonging to the
//     //    same logical department
//     // --------------------------------------------------
//     const existingGroup = await Department.findAll({
//       where: {
//         department_name: oldName,
//       },
//     });

//     const existingCompanyMap = new Map<number, Department>();

//     for (const dept of existingGroup) {
//       if (dept.company_id !== null) {
//         existingCompanyMap.set(dept.company_id, dept);
//       }
//     }

//     // --------------------------------------------------
//     // 3. Determine final company list
//     //
//     // If company_ids is provided:
//     //   use it as the new final list
//     //
//     // If not provided:
//     //   keep existing companies
//     // --------------------------------------------------
//     const targetCompanyIds = dto.company_ids
//       ? Array.from(new Set(dto.company_ids))
//       : Array.from(existingCompanyMap.keys());

//     if (targetCompanyIds.length === 0) {
//       throw new AppError(
//         'At least one company must be selected',
//         400,
//       );
//     }

//     // --------------------------------------------------
//     // 4. Check duplicate departments
//     // --------------------------------------------------
//     const existingIds = existingGroup.map((d) => d.id);

//     const duplicates = await Department.findAll({
//       where: {
//         company_id: {
//           [Op.in]: targetCompanyIds,
//         },
//         department_name: newName,
//         ...(existingIds.length > 0 && {
//           id: {
//             [Op.notIn]: existingIds,
//           },
//         }),
//       },
//     });

//     if (duplicates.length > 0) {
//       const duplicateCompanyIds = duplicates
//         .map((d) => d.company_id)
//         .filter((id): id is number => id !== null);

//       throw new AppError(
//         `Department "${newName}" already exists for company ID(s): ${duplicateCompanyIds.join(', ')}`,
//         409,
//       );
//     }

//     // --------------------------------------------------
//     // 5. Find companies which need to be removed
//     // --------------------------------------------------
//     const companiesToRemove = Array.from(
//       existingCompanyMap.keys(),
//     ).filter(
//       (companyId) => !targetCompanyIds.includes(companyId),
//     );

//     // --------------------------------------------------
//     // 6. Remove department from unchecked companies
//     // --------------------------------------------------
//     for (const companyId of companiesToRemove) {
//       const deptRecord = existingCompanyMap.get(companyId);

//       if (!deptRecord) {
//         continue;
//       }

//       const empCount = await Employee.count({
//         where: {
//           department_id: deptRecord.id,
//           status: ['Active', 'On_Probation'],
//         },
//       });

//       if (empCount > 0) {
//         throw new AppError(
//           `Cannot remove department "${oldName}" from company ID ${companyId} — ${empCount} active employee(s) are assigned. Reassign them first.`,
//           409,
//         );
//       }

//       await deptRecord.update({
//         is_active: false,
//         deleted_by: updatedBy ?? null,
//       });

//       await deptRecord.destroy();
//     }

//     // --------------------------------------------------
//     // 7. Update existing records / create new records
//     // --------------------------------------------------
//     const updatedDepartments: Department[] = [];

//     for (const companyId of targetCompanyIds) {
//       const existingDept = existingCompanyMap.get(companyId);

//       if (existingDept) {
//         // ----------------------------------------------
//         // Existing company → UPDATE
//         // ----------------------------------------------
//         await existingDept.update({
//           department_name: newName,

//           department_code:
//             dto.department_code !== undefined
//               ? dto.department_code?.trim().toUpperCase() || null
//               : existingDept.department_code,

//           head_id:
//             dto.head_id !== undefined
//               ? dto.head_id
//               : existingDept.head_id,

//           is_active:
//             dto.is_active !== undefined
//               ? dto.is_active
//               : existingDept.is_active,

//           updated_by: updatedBy ?? null,
//         });

//         updatedDepartments.push(existingDept);
//       } else {
//         // ----------------------------------------------
//         // New company → CREATE
//         // ----------------------------------------------
//         const newDept = await Department.create({
//           company_id: companyId,
//           department_name: newName,

//           department_code:
//             dto.department_code !== undefined
//               ? dto.department_code?.trim().toUpperCase() || null
//               : currentDept.department_code,

//           head_id:
//             dto.head_id !== undefined
//               ? dto.head_id
//               : currentDept.head_id,

//           is_active:
//             dto.is_active !== undefined
//               ? dto.is_active
//               : currentDept.is_active,

//           created_by: updatedBy ?? null,
//         });

//         updatedDepartments.push(newDept);
//       }
//     }

//     // --------------------------------------------------
//     // 8. Return the department for the current company
//     // --------------------------------------------------
//     return this.getById(
//       updatedDepartments.find(
//         (d) => d.company_id === currentCompanyId,
//       )?.id ?? currentDept.id,
//       currentCompanyId,
//     );
//   }

//   // ─── Soft delete ──────────────────────────────────────────────────────────
//   async delete(id: number, companyId: number, deletedBy?: number) {
//     const dept = await Department.findOne({ where: { id, company_id: companyId } });
//     if (!dept) throw new AppError('Department not found', 404);

//     const empCount = await Employee.count({
//       where: { department_id: id, status: ['Active', 'On_Probation'] },
//     });
//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.department_name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409
//       );
//     }

//     await dept.update({ is_active: false, deleted_by: deletedBy ?? null });
//     await dept.destroy();

//     await logActivity({
//       companyId,
//       employeeId: deletedBy,
//       action: 'DEPARTMENT_DELETED',
//       module: 'departments',
//       entityId: id,
//       oldValues: { department_name: dept.department_name },
//     });
//   }
// }


// import {
//   Op,
//   WhereOptions,
//   fn,
//   col,
// } from 'sequelize';

// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateDepartmentDto {
//   company_ids: number[];
//   department_name: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface UpdateDepartmentDto {
//   current_company_id: number;
//   company_ids?: number[];
//   department_name?: string;
//   department_code?: string | null;
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
// }

// /**
//  * Shape returned to frontend when departments are
//  * fetched for multiple companies.
//  */
// export interface DepartmentListItem {
//   id: number;
//   company_id: number;
//   company_ids: number[];
//   department_name: string;
//   department_code: string | null;
//   head_id: number | null;
//   is_active: boolean;
//   created_by: number | null;
//   updated_by: number | null;
//   deleted_by: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   employee_count: number;
// }

// export class DepartmentService {

//   // ============================================================
//   // GET ALL
//   // ============================================================

//   async getAll(
//     companyIds: number[],
//     query: DepartmentQueryParams = {},
//   ): Promise<DepartmentListItem[]> {
//     const uniqueCompanyIds = Array.from(
//       new Set(
//         companyIds.filter(
//           (id) => Number.isInteger(id) && id > 0,
//         ),
//       ),
//     );

//     if (uniqueCompanyIds.length === 0) {
//       return [];
//     }

//     const where: WhereOptions = {
//       company_id: {
//         [Op.in]: uniqueCompanyIds,
//       },
//     };

//     // ----------------------------------------------------------
//     // Active / inactive filter
//     // ----------------------------------------------------------

//     if (
//       query.is_active === 'false' ||
//       query.is_active === false
//     ) {
//       where['is_active'] = 0;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = 1;
//     }

//     // ----------------------------------------------------------
//     // Search
//     // ----------------------------------------------------------

//     if (query.search?.trim()) {
//       const search = query.search.trim();

//       (where as any)[Op.or] = [
//         {
//           department_name: {
//             [Op.like]: `%${search}%`,
//           },
//         },
//         {
//           department_code: {
//             [Op.like]: `%${search}%`,
//           },
//         },
//       ];
//     }

//     // ----------------------------------------------------------
//     // Fetch records
//     // ----------------------------------------------------------

//     const departments = await Department.findAll({
//       where,
//       order: [
//         ['department_name', 'ASC'],
//         ['company_id', 'ASC'],
//       ],
//     });

//     if (departments.length === 0) {
//       return [];
//     }

//     // ----------------------------------------------------------
//     // Employee counts
//     // ----------------------------------------------------------

//     const departmentIds = departments.map(
//       (department) => department.id,
//     );

//     const empCounts = await Employee.findAll({
//       where: {
//         department_id: {
//           [Op.in]: departmentIds,
//         },
//         status: {
//           [Op.in]: ['Active', 'On_Probation'],
//         },
//       },

//       attributes: [
//         'department_id',
//         [
//           fn('COUNT', col('id')),
//           'count',
//         ],
//       ],

//       group: ['department_id'],

//       raw: true,
//     });

//     const employeeCountMap = new Map<
//       number,
//       number
//     >(
//       empCounts.map((row: any) => [
//         Number(row.department_id),
//         Number(row.count),
//       ]),
//     );

//     // ----------------------------------------------------------
//     // IMPORTANT:
//     //
//     // If:
//     //
//     // Company 1 -> HR
//     // Company 2 -> HR
//     // Company 3 -> HR
//     //
//     // return ONE HR row:
//     //
//     // {
//     //   id: 1,
//     //   company_id: 1,
//     //   company_ids: [1,2,3],
//     //   department_name: "HR"
//     // }
//     //
//     // This is what your UI needs.
//     // ----------------------------------------------------------

//     const grouped = new Map<
//       string,
//       {
//         records: Department[];
//       }
//     >();

//     for (const department of departments) {
//       const key =
//         department.department_name
//           .trim()
//           .toLowerCase();

//       const group = grouped.get(key);

//       if (group) {
//         group.records.push(department);
//       } else {
//         grouped.set(key, {
//           records: [department],
//         });
//       }
//     }

//     const result: DepartmentListItem[] = [];

//     for (const group of grouped.values()) {
//       const records = group.records;

//       const primary = records[0];

//       const companyIdsForDepartment =
//         records
//           .map((record) => record.company_id)
//           .filter(
//             (id): id is number => id !== null,
//           );

//       const employeeCount = records.reduce(
//         (total, record) =>
//           total +
//           (employeeCountMap.get(record.id) ?? 0),
//         0,
//       );

//       result.push({
//         ...primary.toJSON(),

//         // Company represented by the primary record.
//         company_id: primary.company_id!,

//         // All companies this department belongs to.
//         company_ids:
//           companyIdsForDepartment,

//         employee_count: employeeCount,
//       });
//     }

//     return result;
//   }

//   // ============================================================
//   // GET BY ID
//   // ============================================================

//   async getById(
//     id: number,
//     companyId: number,
//   ) {
//     const dept = await Department.findOne({
//       where: {
//         id,
//         company_id: companyId,
//       },

//       include: [
//         {
//           model: Employee,
//           as: 'head',
//           attributes: [
//             'id',
//             'first_name',
//             'last_name',
//             'avatar_url',
//           ],
//           required: false,
//         },

//         {
//           model: Employee,
//           as: 'employees',
//           attributes: [
//             'id',
//             'first_name',
//             'last_name',
//             'employee_code',
//             'status',
//             'avatar_url',
//             'designation_id',
//           ],

//           where: {
//             status: {
//               [Op.in]: [
//                 'Active',
//                 'On_Probation',
//               ],
//             },
//           },

//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError(
//         'Department not found',
//         404,
//       );
//     }

//     // ----------------------------------------------------------
//     // Find same department across companies
//     // ----------------------------------------------------------

//     const relatedDepartments =
//       await Department.findAll({
//         where: {
//           department_name:
//             dept.department_name,
//         },

//         attributes: [
//           'id',
//           'company_id',
//           'department_name',
//           'department_code',
//         ],
//       });

//     const companyIds =
//       relatedDepartments
//         .map((department) =>
//           department.company_id,
//         )
//         .filter(
//           (id): id is number =>
//             id !== null,
//         );

//     return {
//       ...dept.toJSON(),

//       company_ids: Array.from(
//         new Set(companyIds),
//       ),
//     };
//   }

//   // ============================================================
//   // STATS
//   // ============================================================

//   async getStats(
//     companyIds: number[],
//   ) {
//     const uniqueCompanyIds =
//       Array.from(
//         new Set(companyIds),
//       );

//     const [total, active] =
//       await Promise.all([
//         Department.count({
//           where: {
//             company_id: {
//               [Op.in]: uniqueCompanyIds,
//             },
//           },
//         }),

//         Department.count({
//           where: {
//             company_id: {
//               [Op.in]: uniqueCompanyIds,
//             },
//             is_active: true,
//           },
//         }),
//       ]);

//     const empCounts =
//       await Employee.findAll({
//         where: {
//           status: {
//             [Op.in]: [
//               'Active',
//               'On_Probation',
//             ],
//           },
//         },

//         include: [
//           {
//             model: Department,
//             as: 'department',

//             where: {
//               company_id: {
//                 [Op.in]: uniqueCompanyIds,
//               },
//             },

//             attributes: [],
//             required: true,
//           },
//         ],

//         attributes: [
//           'department_id',
//           [
//             fn(
//               'COUNT',
//               col('Employee.id'),
//             ),
//             'count',
//           ],
//         ],

//         group: ['department_id'],

//         raw: true,
//       });

//     const largest =
//       empCounts.reduce(
//         (
//           max: any,
//           row: any,
//         ) =>
//           Number(row.count) >
//           Number(max?.count ?? 0)
//             ? row
//             : max,
//         null,
//       );

//     return {
//       total,
//       active,
//       inactive: total - active,

//       largestDeptId: largest
//         ? Number(
//             largest.department_id,
//           )
//         : null,

//       largestDeptCount: largest
//         ? Number(largest.count)
//         : 0,
//     };
//   }

//   // ============================================================
//   // CREATE
//   // ============================================================

//   async create(
//     dto: CreateDepartmentDto,
//     createdBy?: number,
//   ) {
//     const name =
//       dto.department_name?.trim();

//     if (!name) {
//       throw new AppError(
//         'Department name is required',
//         400,
//       );
//     }

//     const companyIds =
//       Array.from(
//         new Set(
//           (dto.company_ids || []).filter(
//             (id) =>
//               Number.isInteger(id) &&
//               id > 0,
//           ),
//         ),
//       );

//     if (companyIds.length === 0) {
//       throw new AppError(
//         'At least one company_id must be provided',
//         400,
//       );
//     }

//     const normalizedCode =
//       dto.department_code
//         ?.trim()
//         .toUpperCase() || null;

//     // ----------------------------------------------------------
//     // Find both active AND soft-deleted records.
//     //
//     // This is important because your table has a unique index:
//     //
//     // company_id + department_name
//     //
//     // A soft deleted row still occupies that unique value.
//     // ----------------------------------------------------------

//     const existing =
//       await Department.findAll({
//         where: {
//           company_id: {
//             [Op.in]: companyIds,
//           },

//           department_name: name,
//         },

//         paranoid: false,
//       });

//     const existingMap =
//       new Map<number, Department>();

//     for (const department of existing) {
//       if (
//         department.company_id !== null
//       ) {
//         existingMap.set(
//           department.company_id,
//           department,
//         );
//       }
//     }

//     const createdDepartments: Department[] =
//       [];

//     // ----------------------------------------------------------
//     // Create / restore one record per company
//     // ----------------------------------------------------------

//     for (const companyId of companyIds) {
//       const existingDepartment =
//         existingMap.get(companyId);

//       if (existingDepartment) {
//         // ----------------------------------------------
//         // Existing ACTIVE record
//         // ----------------------------------------------

//         if (
//           !existingDepartment.deleted_at
//         ) {
//           throw new AppError(
//             `Department "${name}" already exists for company ID ${companyId}`,
//             409,
//           );
//         }

//         // ----------------------------------------------
//         // Existing SOFT-DELETED record
//         // Restore it instead of creating duplicate.
//         // ----------------------------------------------

//         await existingDepartment.restore();

//         await existingDepartment.update({
//           department_code:
//             normalizedCode,

//           head_id:
//             dto.head_id ?? null,

//           is_active:
//             dto.is_active ?? true,

//           updated_by:
//             createdBy ?? null,

//           deleted_by: null,
//         });

//         createdDepartments.push(
//           existingDepartment,
//         );

//         continue;
//       }

//       // ----------------------------------------------
//       // Create new record
//       // ----------------------------------------------

//       const department =
//         await Department.create({
//           company_id: companyId,
//           department_name: name,

//           department_code:
//             normalizedCode,

//           head_id:
//             dto.head_id ?? null,

//           is_active:
//             dto.is_active ?? true,

//           created_by:
//             createdBy ?? null,
//         });

//       createdDepartments.push(
//         department,
//       );
//     }

//     // ----------------------------------------------------------
//     // Activity log
//     // ----------------------------------------------------------

//     for (const department of createdDepartments) {
//       await logActivity({
//         companyId:
//           department.company_id!,

//         employeeId:
//           createdBy,

//         action:
//           'DEPARTMENT_CREATED',

//         module:
//           'departments',

//         entityId:
//           department.id,

//         newValues: {
//           department_name:
//             department.department_name,

//           department_code:
//             department.department_code,
//         },
//       });
//     }

//     return createdDepartments;
//   }

//   // ============================================================
//   // UPDATE
//   // ============================================================

//   async update(
//     id: number,
//     currentCompanyId: number,
//     dto: UpdateDepartmentDto,
//     updatedBy?: number,
//   ) {
//     // ----------------------------------------------------------
//     // 1. Find the current department
//     // ----------------------------------------------------------

//     const currentDept =
//       await Department.findOne({
//         where: {
//           id,
//           company_id:
//             currentCompanyId,
//         },
//       });

//     if (!currentDept) {
//       throw new AppError(
//         'Department not found',
//         404,
//       );
//     }

//     const oldName =
//       currentDept.department_name;

//     const newName =
//       dto.department_name !== undefined
//         ? dto.department_name.trim()
//         : oldName;

//     if (!newName) {
//       throw new AppError(
//         'Department name is required',
//         400,
//       );
//     }

//     // ----------------------------------------------------------
//     // 2. Find every active record with this department name
//     // ----------------------------------------------------------

//     const existingGroup =
//       await Department.findAll({
//         where: {
//           department_name:
//             oldName,
//         },
//       });

//     const existingCompanyMap =
//       new Map<number, Department>();

//     for (
//       const department of existingGroup
//     ) {
//       if (
//         department.company_id !== null
//       ) {
//         existingCompanyMap.set(
//           department.company_id,
//           department,
//         );
//       }
//     }

//     // ----------------------------------------------------------
//     // 3. Determine FINAL company list
//     //
//     // company_ids provided:
//     //     use it as final list
//     //
//     // company_ids not provided:
//     //     keep existing list
//     // ----------------------------------------------------------

//     const targetCompanyIds =
//       dto.company_ids !== undefined
//         ? Array.from(
//             new Set(
//               dto.company_ids.filter(
//                 (companyId) =>
//                   Number.isInteger(
//                     companyId,
//                   ) &&
//                   companyId > 0,
//               ),
//             ),
//           )
//         : Array.from(
//             existingCompanyMap.keys(),
//           );

//     if (
//       targetCompanyIds.length === 0
//     ) {
//       throw new AppError(
//         'Department must belong to at least one company',
//         400,
//       );
//     }

//     // ----------------------------------------------------------
//     // 4. Check duplicate departments
//     //
//     // Example:
//     //
//     // Company 1 -> HR
//     // Company 2 -> Finance
//     //
//     // Trying to rename HR -> Finance for company 1
//     // must fail.
//     // ----------------------------------------------------------

//     const existingIds =
//       existingGroup.map(
//         (department) =>
//           department.id,
//       );

//     const duplicateWhere: any = {
//       company_id: {
//         [Op.in]: targetCompanyIds,
//       },

//       department_name:
//         newName,
//     };

//     if (existingIds.length > 0) {
//       duplicateWhere.id = {
//         [Op.notIn]: existingIds,
//       };
//     }

//     const duplicates =
//       await Department.findAll({
//         where: duplicateWhere,
//       });

//     if (duplicates.length > 0) {
//       const duplicateCompanyIds =
//         duplicates
//           .map(
//             (department) =>
//               department.company_id,
//           )
//           .filter(
//             (companyId): companyId is number =>
//               companyId !== null,
//           );

//       throw new AppError(
//         `Department "${newName}" already exists for company ID(s): ${duplicateCompanyIds.join(', ')}`,
//         409,
//       );
//     }

//     // ----------------------------------------------------------
//     // 5. Determine companies to REMOVE
//     //
//     // Existing: [1,2,3]
//     // Target:   [1,3]
//     //
//     // Remove:   [2]
//     // ----------------------------------------------------------

//     const companiesToRemove =
//       Array.from(
//         existingCompanyMap.keys(),
//       ).filter(
//         (companyId) =>
//           !targetCompanyIds.includes(
//             companyId,
//           ),
//       );

//     // ----------------------------------------------------------
//     // 6. Remove department from unchecked companies
//     // ----------------------------------------------------------

//     for (
//       const companyId of companiesToRemove
//     ) {
//       const department =
//         existingCompanyMap.get(
//           companyId,
//         );

//       if (!department) {
//         continue;
//       }

//       // Do not allow removal when employees
//       // are still assigned.
//       const employeeCount =
//         await Employee.count({
//           where: {
//             department_id:
//               department.id,

//             status: {
//               [Op.in]: [
//                 'Active',
//                 'On_Probation',
//               ],
//             },
//           },
//         });

//       if (employeeCount > 0) {
//         throw new AppError(
//           `Cannot remove "${oldName}" from company ID ${companyId} — ${employeeCount} active employee(s) are assigned. Reassign them first.`,
//           409,
//         );
//       }

//       await department.update({
//         is_active: false,
//         deleted_by:
//           updatedBy ?? null,
//       });

//       await department.destroy();

//       await logActivity({
//         companyId,

//         employeeId:
//           updatedBy,

//         action:
//           'DEPARTMENT_REMOVED_FROM_COMPANY',

//         module:
//           'departments',

//         entityId:
//           department.id,

//         oldValues: {
//           department_name:
//             department.department_name,
//         },
//       });
//     }

//     // ----------------------------------------------------------
//     // 7. Update existing / create missing companies
//     // ----------------------------------------------------------

//     const updatedDepartments: Department[] =
//       [];

//     for (
//       const companyId of targetCompanyIds
//     ) {
//       const existingDepartment =
//         existingCompanyMap.get(
//           companyId,
//         );

//       // ========================================================
//       // EXISTING COMPANY
//       // ========================================================

//       if (existingDepartment) {
//         await existingDepartment.update({
//           department_name:
//             newName,

//           department_code:
//             dto.department_code !==
//             undefined
//               ? dto.department_code
//                   ?.trim()
//                   .toUpperCase() ||
//                 null
//               : existingDepartment.department_code,

//           head_id:
//             dto.head_id !== undefined
//               ? dto.head_id
//               : existingDepartment.head_id,

//           is_active:
//             dto.is_active !== undefined
//               ? dto.is_active
//               : existingDepartment.is_active,

//           updated_by:
//             updatedBy ?? null,
//         });

//         updatedDepartments.push(
//           existingDepartment,
//         );

//         continue;
//       }

//       // ========================================================
//       // NEW COMPANY
//       // ========================================================

//       // Check for a soft-deleted record first.
//       const deletedDepartment =
//         await Department.findOne({
//           where: {
//             company_id:
//               companyId,

//             department_name:
//               oldName,
//           },

//           paranoid: false,
//         });

//       if (
//         deletedDepartment &&
//         deletedDepartment.deleted_at
//       ) {
//         await deletedDepartment.restore();

//         await deletedDepartment.update({
//           department_name:
//             newName,

//           department_code:
//             dto.department_code !==
//             undefined
//               ? dto.department_code
//                   ?.trim()
//                   .toUpperCase() ||
//                 null
//               : currentDept.department_code,

//           head_id:
//             dto.head_id !== undefined
//               ? dto.head_id
//               : currentDept.head_id,

//           is_active:
//             dto.is_active !== undefined
//               ? dto.is_active
//               : true,

//           created_by:
//             deletedDepartment.created_by ??
//             updatedBy ??
//             null,

//           updated_by:
//             updatedBy ?? null,

//           deleted_by: null,
//         });

//         updatedDepartments.push(
//           deletedDepartment,
//         );

//         continue;
//       }

//       const newDepartment =
//         await Department.create({
//           company_id:
//             companyId,

//           department_name:
//             newName,

//           department_code:
//             dto.department_code !==
//             undefined
//               ? dto.department_code
//                   ?.trim()
//                   .toUpperCase() ||
//                 null
//               : currentDept.department_code,

//           head_id:
//             dto.head_id !== undefined
//               ? dto.head_id
//               : currentDept.head_id,

//           is_active:
//             dto.is_active !== undefined
//               ? dto.is_active
//               : true,

//           created_by:
//             updatedBy ?? null,
//         });

//       updatedDepartments.push(
//         newDepartment,
//       );
//     }

//     // ----------------------------------------------------------
//     // 8. Return current company record
//     // ----------------------------------------------------------

//     const currentResult =
//       updatedDepartments.find(
//         (department) =>
//           department.company_id ===
//           currentCompanyId,
//       );

//     if (!currentResult) {
//       throw new AppError(
//         'Current company is no longer assigned to this department',
//         409,
//       );
//     }

//     return this.getById(
//       currentResult.id,
//       currentCompanyId,
//     );
//   }

//   // ============================================================
//   // DELETE FROM ONE COMPANY
//   // ============================================================

//   async delete(
//     id: number,
//     companyId: number,
//     deletedBy?: number,
//   ) {
//     const department =
//       await Department.findOne({
//         where: {
//           id,
//           company_id:
//             companyId,
//         },
//       });

//     if (!department) {
//       throw new AppError(
//         'Department not found',
//         404,
//       );
//     }

//     const employeeCount =
//       await Employee.count({
//         where: {
//           department_id: id,

//           status: {
//             [Op.in]: [
//               'Active',
//               'On_Probation',
//             ],
//           },
//         },
//       });

//     if (employeeCount > 0) {
//       throw new AppError(
//         `Cannot remove "${department.department_name}" — ${employeeCount} active employee(s) are assigned. Reassign them first.`,
//         409,
//       );
//     }

//     await department.update({
//       is_active: false,
//       deleted_by:
//         deletedBy ?? null,
//     });

//     await department.destroy();

//     await logActivity({
//       companyId,

//       employeeId:
//         deletedBy,

//       action:
//         'DEPARTMENT_DELETED',

//       module:
//         'departments',

//       entityId:
//         id,

//       oldValues: {
//         department_name:
//           department.department_name,
//       },
//     });
//   }
// }



// import { Op, WhereOptions } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Department } from '../../database/models/Department';
// import { CompanyDepartment } from '../../database/models/Department';
// import { Company } from '../../database/models/Company';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateDepartmentDto {
//   department_name: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
// }

// export interface UpdateDepartmentDto {
//   department_name?: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
// }

// export class DepartmentService {

//   // ─── List Departments ─────────────────────────────────────────────────────
//   async getAll(companyIds: number[] = [], query: DepartmentQueryParams = {}) {
//     const where: WhereOptions = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = 0;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = 1;
//     }

//     if (query.search) {
//       (where as any)[Op.or] = [
//         { department_name: { [Op.like]: `%${query.search}%` } },
//         { department_code: { [Op.like]: `%${query.search}%` } },
//       ];
//     }

//     const includeOptions: any = [
//       {
//         model: CompanyDepartment,
//         as: 'company_mappings',
//         attributes: ['company_id'],
//         include: [
//           {
//             model: Company,
//             as: 'company',
//             attributes: ['id', 'name'],
//           },
//         ],
//       },
//     ];

//     // Filter by company IDs if supplied
//     if (companyIds.length > 0) {
//       where[Op.or] = [
//         { is_all_companies: true },
//         { '$company_mappings.company_id$': { [Op.in]: companyIds } },
//       ];
//     }

//     const departments = await Department.findAll({
//       where,
//       include: includeOptions,
//       order: [['department_name', 'ASC']],
//       distinct: true,
//     });

//     return departments.map((d) => {
//       const json = d.toJSON() as any;
//       const assignedCompanies = json.company_mappings?.map((m: any) => m.company) || [];
//       const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

//       delete json.company_mappings;
//       return {
//         ...json,
//         company_ids: assignedCompanyIds,
//         companies: assignedCompanies,
//       };
//     });
//   }

//   // ─── Get Single Department ────────────────────────────────────────────────
//   async getById(id: number) {
//     const dept = await Department.findByPk(id, {
//       include: [
//         {
//           model: CompanyDepartment,
//           as: 'company_mappings',
//           attributes: ['company_id'],
//           include: [
//             {
//               model: Company,
//               as: 'company',
//               attributes: ['id', 'name'],
//             },
//           ],
//         },
//       ],
//     });

//     if (!dept) throw new AppError('Department not found', 404);

//     const json = dept.toJSON() as any;
//     const assignedCompanies = json.company_mappings?.map((m: any) => m.company) || [];
//     const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

//     delete json.company_mappings;
//     return {
//       ...json,
//       company_ids: assignedCompanyIds,
//       companies: assignedCompanies,
//     };
//   }

//   // ─── Create Department ────────────────────────────────────────────────────
//   async create(dto: CreateDepartmentDto, createdBy?: number) {
//     const name = dto.department_name.trim();

//     const existing = await Department.findOne({ where: { department_name: name } });
//     if (existing) {
//       throw new AppError(`Department "${name}" already exists.`, 409);
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const department = await Department.create(
//         {
//           department_name: name,
//           department_code: dto.department_code?.toUpperCase().trim() || null,
//           is_all_companies: Boolean(dto.is_all_companies),
//           head_id: dto.head_id ?? null,
//           is_active: true,
//           created_by: createdBy ?? null,
//         },
//         { transaction }
//       );

//       // Link companies if not all companies
//       if (!dto.is_all_companies && dto.company_ids && dto.company_ids.length > 0) {
//         const companyMappings = dto.company_ids.map((companyId) => ({
//           department_id: department.id,
//           company_id: companyId,
//         }));

//         await CompanyDepartment.bulkCreate(companyMappings, { transaction });
//       }

//       await transaction.commit();

//       await logActivity({
//         companyId: dto.company_ids?.[0] ?? 0,
//         employeeId: createdBy,
//         action: 'DEPARTMENT_CREATED',
//         module: 'departments',
//         entityId: department.id,
//         newValues: { department_name: department.department_name },
//       });

//       return this.getById(department.id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Update Department ────────────────────────────────────────────────────
//   async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number) {
//     const department = await Department.findByPk(id);
//     if (!department) throw new AppError('Department not found', 404);

//     if (dto.department_name && dto.department_name.trim() !== department.department_name) {
//       const existing = await Department.findOne({
//         where: {
//           department_name: dto.department_name.trim(),
//           id: { [Op.ne]: id },
//         },
//       });

//       if (existing) {
//         throw new AppError(`Department "${dto.department_name}" already exists.`, 409);
//       }
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const isAllCompanies = dto.is_all_companies !== undefined 
//         ? Boolean(dto.is_all_companies) 
//         : department.is_all_companies;

//       await department.update(
//         {
//           department_name: dto.department_name?.trim() || department.department_name,
//           department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : department.department_code,
//           is_all_companies: isAllCompanies,
//           head_id: dto.head_id !== undefined ? dto.head_id : department.head_id,
//           is_active: dto.is_active !== undefined ? dto.is_active : department.is_active,
//           updated_by: updatedBy ?? null,
//         },
//         { transaction }
//       );

//       // Handle company association updates
//       if (isAllCompanies) {
//         // Clear pivot records if switched to All Companies
//         await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
//       } else if (dto.company_ids !== undefined) {
//         // Sync selected company IDs
//         await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

//         if (dto.company_ids.length > 0) {
//           const companyMappings = dto.company_ids.map((cId) => ({
//             department_id: id,
//             company_id: cId,
//           }));
//           await CompanyDepartment.bulkCreate(companyMappings, { transaction });
//         }
//       }

//       await transaction.commit();
//       return this.getById(id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Delete Department ────────────────────────────────────────────────────
//   async delete(id: number, deletedBy?: number) {
//     const department = await Department.findByPk(id);
//     if (!department) throw new AppError('Department not found', 404);

//     const transaction = await sequelize.transaction();

//     try {
//       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
//       await department.update({ is_active: false, deleted_by: deletedBy ?? null }, { transaction });
//       await department.destroy({ transaction });

//       await transaction.commit();
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }
// }



































// import { Op, WhereOptions } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Department, CompanyDepartment } from '../../database/models/Department'; // Ensure correct path or separate model files
// import { Company } from '../../database/models/Company';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateDepartmentDto {
//   department_name: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
// }

// export interface UpdateDepartmentDto {
//   department_name?: string;
//   department_code?: string | null;
//   is_all_companies?: boolean;
//   company_ids?: number[];
//   head_id?: number | null;
//   is_active?: boolean;
// }

// export interface DepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
// }

// export class DepartmentService {

//   // ─── List Departments ─────────────────────────────────────────────────────
//   async getAll(companyIds: number[] = [], query: DepartmentQueryParams = {}) {
//     const where: any = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where.is_active = 0;
//     } else if (query.is_active !== 'all') {
//       where.is_active = 1;
//     }

//     if (query.search) {
//       where[Op.or] = [
//         { department_name: { [Op.like]: `%${query.search}%` } },
//         { department_code: { [Op.like]: `%${query.search}%` } },
//       ];
//     }

//     let matchingDeptIds: number[] | null = null;
//     if (companyIds.length > 0) {
//       const mapped = await CompanyDepartment.findAll({
//         where: { company_id: { [Op.in]: companyIds } },
//         attributes: ['department_id'],
//         raw: true,
//       });
//       matchingDeptIds = mapped.map((m) => m.department_id);

//       const companyFilter = [
//         { is_all_companies: true },
//         { id: { [Op.in]: matchingDeptIds } },
//       ];

//       if (where[Op.or]) {
//         where[Op.and] = [{ [Op.or]: where[Op.or] }, { [Op.or]: companyFilter }];
//         delete where[Op.or];
//       } else {
//         where[Op.or] = companyFilter;
//       }
//     }

//     const departments = await Department.findAll({
//       where,
//       include: [
//         {
//           model: CompanyDepartment,
//           as: 'company_mappings',
//           attributes: ['company_id'],
//           include: [
//             {
//               model: Company,
//               as: 'company',
//               attributes: ['id', 'name'],
//             },
//           ],
//         },
//       ],
//       order: [['department_name', 'ASC']],
//     });

//     return departments.map((d) => {
//       const json = d.toJSON() as any;
//       const assignedCompanies = json.company_mappings?.map((m: any) => m.company).filter(Boolean) || [];
//       const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

//       delete json.company_mappings;
//       return {
//         ...json,
//         company_ids: assignedCompanyIds,
//         companies: assignedCompanies,
//       };
//     });
//   }

//   // ─── Get Single Department ────────────────────────────────────────────────
//   async getById(id: number) {
//     const dept = await Department.findByPk(id, {
//       include: [
//         {
//           model: CompanyDepartment,
//           as: 'company_mappings',
//           attributes: ['company_id'],
//           include: [
//             {
//               model: Company,
//               as: 'company',
//               attributes: ['id', 'name'],
//             },
//           ],
//         },
//       ],
//     });

//     if (!dept) throw new AppError('Department not found', 404);

//     const json = dept.toJSON() as any;
//     const assignedCompanies = json.company_mappings?.map((m: any) => m.company).filter(Boolean) || [];
//     const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

//     delete json.company_mappings;
//     return {
//       ...json,
//       company_ids: assignedCompanyIds,
//       companies: assignedCompanies,
//     };
//   }

//   // ─── Create Department ────────────────────────────────────────────────────
//   async create(dto: CreateDepartmentDto, createdBy?: number) {
//     const name = dto.department_name.trim();

//     const existing = await Department.findOne({ where: { department_name: name } });
//     if (existing) {
//       throw new AppError(`Department "${name}" already exists.`, 409);
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const department = await Department.create(
//         {
//           department_name: name,
//           department_code: dto.department_code?.toUpperCase().trim() || null,
//           is_all_companies: Boolean(dto.is_all_companies),
//           head_id: dto.head_id ?? null,
//           is_active: true,
//           created_by: createdBy ?? null,
//         },
//         { transaction }
//       );

//       if (!dto.is_all_companies && dto.company_ids && dto.company_ids.length > 0) {
//         const companyMappings = dto.company_ids.map((companyId) => ({
//           department_id: department.id,
//           company_id: companyId,
//         }));

//         await CompanyDepartment.bulkCreate(companyMappings, { transaction });
//       }

//       await transaction.commit();

//       await logActivity({
//         companyId: dto.company_ids?.[0] ?? 0,
//         employeeId: createdBy,
//         action: 'DEPARTMENT_CREATED',
//         module: 'departments',
//         entityId: department.id,
//         newValues: { department_name: department.department_name },
//       });

//       return this.getById(department.id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Update Department ────────────────────────────────────────────────────
//   async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number) {
//     const department = await Department.findByPk(id);
//     if (!department) throw new AppError('Department not found', 404);

//     if (dto.department_name && dto.department_name.trim() !== department.department_name) {
//       const existing = await Department.findOne({
//         where: {
//           department_name: dto.department_name.trim(),
//           id: { [Op.ne]: id },
//         },
//       });

//       if (existing) {
//         throw new AppError(`Department "${dto.department_name}" already exists.`, 409);
//       }
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const isAllCompanies = dto.is_all_companies !== undefined
//         ? Boolean(dto.is_all_companies)
//         : department.is_all_companies;

//       await department.update(
//         {
//           department_name: dto.department_name?.trim() || department.department_name,
//           department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : department.department_code,
//           is_all_companies: isAllCompanies,
//           head_id: dto.head_id !== undefined ? dto.head_id : department.head_id,
//           is_active: dto.is_active !== undefined ? dto.is_active : department.is_active,
//           updated_by: updatedBy ?? null,
//         },
//         { transaction }
//       );

//       if (isAllCompanies) {
//         await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
//       } else if (dto.company_ids !== undefined) {
//         await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

//         if (dto.company_ids.length > 0) {
//           const companyMappings = dto.company_ids.map((cId) => ({
//             department_id: id,
//             company_id: cId,
//           }));
//           await CompanyDepartment.bulkCreate(companyMappings, { transaction });
//         }
//       }

//       await transaction.commit();
//       return this.getById(id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Delete Department ────────────────────────────────────────────────────
//   async delete(id: number, deletedBy?: number) {
//     const department = await Department.findByPk(id);
//     if (!department) throw new AppError('Department not found', 404);

//     const transaction = await sequelize.transaction();

//     try {
//       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

//       // Update metadata and perform soft-delete correctly
//       await department.update({ is_active: false, deleted_by: deletedBy ?? null }, { transaction });
//       await department.destroy({ transaction });

//       await transaction.commit();
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }
// }





























import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Department, CompanyDepartment } from '../../database/models/Department';
import { Company } from '../../database/models/Company';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

export interface CreateDepartmentDto {
  department_name: string;
  department_code?: string | null;
  is_all_companies?: boolean;
  company_ids?: number[];
  head_id?: number | null;
}

export interface UpdateDepartmentDto {
  department_name?: string;
  department_code?: string | null;
  is_all_companies?: boolean;
  company_ids?: number[];
  head_id?: number | null;
  is_active?: boolean;
}

export interface DepartmentQueryParams {
  search?: string;
  is_active?: string | boolean;
}

export class DepartmentService {

  // ─── List Departments ─────────────────────────────────────────────────────
  async getAll(companyIds: number[] = [], query: DepartmentQueryParams = {}) {
    const andConditions: any[] = [];

    // Active Status Filter
    if (query.is_active === 'false' || query.is_active === false) {
      andConditions.push({ is_active: false });
    } else if (query.is_active !== 'all') {
      andConditions.push({ is_active: true });
    }

    // Search Filter
    if (query.search) {
      const searchClause = `%${query.search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { department_name: { [Op.like]: searchClause } },
          { department_code: { [Op.like]: searchClause } },
        ],
      });
    }

    // Company Filter
    if (companyIds.length > 0) {
      const mapped = await CompanyDepartment.findAll({
        where: { company_id: { [Op.in]: companyIds } },
        attributes: ['department_id'],
        raw: true,
      });
      const matchingDeptIds = mapped.map((m) => m.department_id);

      andConditions.push({
        [Op.or]: [
          { is_all_companies: true },
          { id: { [Op.in]: matchingDeptIds } },
        ],
      });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: CompanyDepartment,
          as: 'company_mappings',
          attributes: ['company_id'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['department_name', 'ASC']],
    });

    return departments.map((d) => {
      const json = d.toJSON() as any;
      const assignedCompanies = json.company_mappings?.map((m: any) => m.company).filter(Boolean) || [];
      const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

      delete json.company_mappings;
      return {
        ...json,
        company_ids: assignedCompanyIds,
        companies: assignedCompanies,
      };
    });
  }

  // ─── Get Single Department ────────────────────────────────────────────────
  async getById(id: number) {
    const dept = await Department.findByPk(id, {
      include: [
        {
          model: CompanyDepartment,
          as: 'company_mappings',
          attributes: ['company_id'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!dept) throw new AppError('Department not found', 404);

    const json = dept.toJSON() as any;
    const assignedCompanies = json.company_mappings?.map((m: any) => m.company).filter(Boolean) || [];
    const assignedCompanyIds = json.company_mappings?.map((m: any) => m.company_id) || [];

    delete json.company_mappings;
    return {
      ...json,
      company_ids: assignedCompanyIds,
      companies: assignedCompanies,
    };
  }

  // ─── Create Department ────────────────────────────────────────────────────
  async create(dto: CreateDepartmentDto, createdBy?: number) {
    const name = dto.department_name.trim();

    // Check existing active department
    const existing = await Department.findOne({
      where: {
        department_name: name,
        is_active: true
      }
    });

    if (existing) {
      throw new AppError(`Department "${name}" already exists.`, 409);
    }

    const transaction = await sequelize.transaction();

    try {
      const department = await Department.create(
        {
          department_name: name,
          department_code: dto.department_code?.toUpperCase().trim() || null,
          is_all_companies: Boolean(dto.is_all_companies),
          head_id: dto.head_id ?? null,
          is_active: true,
          created_by: createdBy ?? null,
        },
        { transaction }
      );

      if (!dto.is_all_companies && dto.company_ids && dto.company_ids.length > 0) {
        const companyMappings = dto.company_ids.map((companyId) => ({
          department_id: department.id,
          company_id: companyId,
        }));

        await CompanyDepartment.bulkCreate(companyMappings, { transaction });
      }

      await transaction.commit();

      // Safely log activity without breaking if company_ids is empty
      const primaryCompanyId = dto.company_ids?.[0] ?? null;
      if (primaryCompanyId) {
        await logActivity({
          companyId: primaryCompanyId,
          employeeId: createdBy,
          action: 'DEPARTMENT_CREATED',
          module: 'departments',
          entityId: department.id,
          newValues: { department_name: department.department_name },
        });
      }

      return this.getById(department.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Update Department ────────────────────────────────────────────────────
  // async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number) {
  //   const department = await Department.findByPk(id);
  //   if (!department) throw new AppError('Department not found', 404);

  //   if (dto.department_name && dto.department_name.trim() !== department.department_name) {
  //     const existing = await Department.findOne({
  //       where: {
  //         department_name: dto.department_name.trim(),
  //         id: { [Op.ne]: id },
  //         is_active: true,
  //       },
  //     });

  //     if (existing) {
  //       throw new AppError(`Department "${dto.department_name}" already exists.`, 409);
  //     }
  //   }

  //   const transaction = await sequelize.transaction();

  //   try {
  //     const isAllCompanies = dto.is_all_companies !== undefined
  //       ? Boolean(dto.is_all_companies)
  //       : department.is_all_companies;

  //     await department.update(
  //       {
  //         department_name: dto.department_name?.trim() || department.department_name,
  //         department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : department.department_code,
  //         is_all_companies: isAllCompanies,
  //         head_id: dto.head_id !== undefined ? dto.head_id : department.head_id,
  //         is_active: dto.is_active !== undefined ? dto.is_active : department.is_active,
  //         updated_by: updatedBy ?? null,
  //       },
  //       { transaction }
  //     );

  //     if (isAllCompanies) {
  //       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
  //     } else if (dto.company_ids !== undefined) {
  //       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

  //       if (dto.company_ids.length > 0) {
  //         const companyMappings = dto.company_ids.map((cId) => ({
  //           department_id: id,
  //           company_id: cId,
  //         }));
  //         await CompanyDepartment.bulkCreate(companyMappings, { transaction });
  //       }
  //     }

  //     await transaction.commit();
  //     return this.getById(id);
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }





  // async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number) {
  //   const department = await Department.findByPk(id);
  //   if (!department) throw new AppError('Department not found', 404);

  //   // 1. Name duplication validation
  //   if (dto.department_name && dto.department_name.trim() !== department.department_name) {
  //     const existing = await Department.findOne({
  //       where: {
  //         department_name: dto.department_name.trim(),
  //         id: { [Op.ne]: id },
  //         is_active: true,
  //       },
  //     });

  //     if (existing) {
  //       throw new AppError(`Department "${dto.department_name}" already exists.`, 409);
  //     }
  //   }

  //   const transaction = await sequelize.transaction();

  //   try {
  //     const isAllCompanies = dto.is_all_companies !== undefined
  //       ? Boolean(dto.is_all_companies)
  //       : department.is_all_companies;

  //     // 2. Core department entity update
  //     await department.update(
  //       {
  //         department_name: dto.department_name?.trim() || department.department_name,
  //         department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : department.department_code,
  //         is_all_companies: isAllCompanies,
  //         head_id: dto.head_id !== undefined ? dto.head_id : department.head_id,
  //         is_active: dto.is_active !== undefined ? dto.is_active : department.is_active,
  //         updated_by: updatedBy ?? null,
  //       },
  //       { transaction }
  //     );

  //     // 3. Pivot table mapping sync (removes deselected companies, inserts new selections)
  //     if (isAllCompanies) {
  //       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
  //     } else if (dto.company_ids !== undefined) {
  //       // Purge existing mappings for this department
  //       await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

  //       // Bulk insert only selected companies
  //       if (dto.company_ids.length > 0) {
  //         const companyMappings = dto.company_ids.map((cId) => ({
  //           department_id: id,
  //           company_id: cId,
  //         }));
  //         await CompanyDepartment.bulkCreate(companyMappings, { transaction });
  //       }
  //     }

  //     await transaction.commit();

  //     // 4. Log Activity for updates
  //     const primaryCompanyId = dto.company_ids?.[0] ?? null;
  //     if (primaryCompanyId) {
  //       await logActivity({
  //         companyId: primaryCompanyId,
  //         employeeId: updatedBy,
  //         action: 'DEPARTMENT_UPDATED',
  //         module: 'departments',
  //         entityId: department.id,
  //         newValues: {
  //           department_name: department.department_name,
  //           is_all_companies: isAllCompanies,
  //           company_ids: dto.company_ids,
  //         },
  //       });
  //     }

  //     return this.getById(id);
  //   } catch (error) {
  //     await transaction.rollback();
  //     throw error;
  //   }
  // }



  async update(id: number, dto: UpdateDepartmentDto, updatedBy?: number) {
    const department = await Department.findByPk(id);
    if (!department) throw new AppError('Department not found', 404);

    // 1. Name duplication validation
    if (dto.department_name && dto.department_name.trim() !== department.department_name) {
      const existing = await Department.findOne({
        where: {
          department_name: dto.department_name.trim(),
          id: { [Op.ne]: id },
          is_active: true,
        },
      });

      if (existing) {
        throw new AppError(`Department "${dto.department_name}" already exists.`, 409);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const isAllCompanies = dto.is_all_companies !== undefined
        ? Boolean(dto.is_all_companies)
        : department.is_all_companies;

      // 2. Core department entity update
      await department.update(
        {
          department_name: dto.department_name?.trim() || department.department_name,
          department_code: dto.department_code !== undefined ? (dto.department_code?.toUpperCase().trim() || null) : department.department_code,
          is_all_companies: isAllCompanies,
          head_id: dto.head_id !== undefined ? dto.head_id : department.head_id,
          is_active: dto.is_active !== undefined ? dto.is_active : department.is_active,
          updated_by: updatedBy ?? null,
        },
        { transaction }
      );

      // 3. Pivot table mapping sync
      if (isAllCompanies) {
        // If global, purge all specific company mappings
        await CompanyDepartment.destroy({ where: { department_id: id }, transaction });
      } else if (dto.company_ids !== undefined) {
        // If NOT global and specific company_ids provided, update mappings
        await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

        if (dto.company_ids.length > 0) {
          const companyMappings = dto.company_ids.map((cId) => ({
            department_id: id,
            company_id: cId,
          }));
          await CompanyDepartment.bulkCreate(companyMappings, { transaction });
        }
      }

      await transaction.commit();

      // 4. Log Activity for updates safely
      const primaryCompanyId = dto.company_ids?.[0] ?? null;
      if (primaryCompanyId) {
        await logActivity({
          companyId: primaryCompanyId,
          employeeId: updatedBy,
          action: 'DEPARTMENT_UPDATED',
          module: 'departments',
          entityId: department.id,
          newValues: {
            department_name: department.department_name,
            is_all_companies: isAllCompanies,
            company_ids: dto.company_ids,
          },
        });
      }

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }



  // ─── Delete Department ────────────────────────────────────────────────────
  async delete(id: number, deletedBy?: number) {
    const department = await Department.findByPk(id);
    if (!department) throw new AppError('Department not found', 404);

    const transaction = await sequelize.transaction();

    try {
      await CompanyDepartment.destroy({ where: { department_id: id }, transaction });

      await department.update({ is_active: false, deleted_by: deletedBy ?? null }, { transaction });
      await department.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
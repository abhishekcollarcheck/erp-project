// import { Op, WhereOptions, fn, col, literal } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//     name: string;
// }

// export interface UpdateSubDepartmentDto {
//     name?: string;
//     is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//     search?: string;
//     is_active?: string | boolean;
// }

// export class SubDepartmentService {
//     async getAll(query: SubDepartmentQueryParams = {}) {
//         const where: WhereOptions = {};

//         if (query.is_active === 'false' || query.is_active === false) {
//             where['is_active'] = false;
//         } else if (query.is_active === 'all') {
//         } else {
//             where['is_active'] = true;
//         }

//         if (query.search) {
//             (where as any)[Op.or] = [
//                 { name: { [Op.like]: `%${query.search}%` } },
//             ];
//         }

//         const subdepartments = await SubDepartment.findAll({
//             where,
//             order: [['name', 'ASC']],
//         });

//         const deptIds = subdepartments.map((d) => d.id);

//         const empCounts = await Employee.findAll({
//             where: {
//                 sub_department_id: deptIds,
//                 status: ['Active', 'On_Probation'],
//             },
//             attributes: [
//                 'sub_department_id',
//                 [fn('COUNT', col('id')), 'count'],
//             ],
//             group: ['sub_department_id'],
//             raw: true,
//         });

//         const countMap = new Map<number, number>(
//             empCounts.map((r: any) => [r.sub_department_id, Number(r.count)]),
//         );

//         return subdepartments.map((d) => ({
//             ...d.toJSON(),
//             employee_count: countMap.get(d.id) ?? 0,
//         }));
//     }

//     async getById(id: number) {
//         const dept = await SubDepartment.findOne({
//             where: { id },
//             include: [
//                 {
//                     model: Employee,
//                     as: 'employees',
//                     attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//                     where: { status: ['Active', 'On_Probation'] },
//                     required: false,
//                 },
//             ],
//         });
//         if (!dept) throw new AppError('Sub Department not found', 404);
//         return dept;
//     }

//     async create(dto: CreateSubDepartmentDto, createdBy?: number) {
//         const existing = await SubDepartment.findOne({
//             where: { name: dto.name.trim(), is_active: true },
//         });
//         if (existing) throw new AppError(`Sub Department "${dto.name}" already exists`, 409);

//         const dept = await SubDepartment.create({
//             name: dto.name.trim(),
//             is_active: true,
//             created_by: createdBy ?? null,
//         });

//         await logActivity({
//             companyId: 0, employeeId: createdBy,
//             action: 'SUBDEPARTMENT_CREATED', module: 'subdepartments', entityId: dept.id,
//             newValues: { name: dept.name, },
//         });

//         return this.getById(dept.id);
//     }

//     // ─── Update ───────────────────────────────────────────────────────────────
//     async update(id: number, companyId: number, dto: UpdateSubDepartmentDto, updatedBy?: number) {
//         const dept = await SubDepartment.findOne({ where: { id } });
//         if (!dept) throw new AppError('Sub Department not found', 404);

//         const before = { name: dept.name, is_active: dept.is_active };

//         await dept.update({
//             name: dto.name?.trim() ?? dept.name,
//             is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//             updated_by: updatedBy ?? null,
//         });

//         await logActivity({
//             companyId, employeeId: updatedBy,
//             action: 'SUBDEPARTMENT_UPDATED', module: 'subdepartments', entityId: id,
//             oldValues: before as Record<string, unknown>,
//             newValues: { name: dept.name, is_active: dept.is_active },
//         });

//         return this.getById(id);
//     }

//     // ─── Soft delete ──────────────────────────────────────────────────────────
//     async delete(id: number, companyId: number, deletedBy?: number) {
//         const dept = await SubDepartment.findOne({ where: { id } });
//         if (!dept) throw new AppError('Sub Department not found', 404);

//         const empCount = await Employee.count({
//             where: { sub_department_id: id, status: ['Active', 'On_Probation'] },
//         });
//         if (empCount > 0)
//             throw new AppError(
//                 `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//                 409,
//             );
//         await dept.update({ is_active: false, deleted_by: deletedBy ?? null });
//         await dept.destroy();

//         await logActivity({
//             companyId, employeeId: deletedBy,
//             action: 'SUBDEPARTMENT_DELETED', module: 'subdepartments', entityId: id,
//             oldValues: { name: dept.name },
//         });
//     }
// }

// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//     department_id: number;
//     name: string;
// }

// export interface UpdateSubDepartmentDto {
//     department_id?: number;
//     name?: string;
//     is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//     search?: string;
//     is_active?: string | boolean;
//     department_id?: number;
// }

// export class SubDepartmentService {

//     // ─── Get All ──────────────────────────────────────────────────────────────
//     async getAll(
//         companyId: number,
//         query: SubDepartmentQueryParams = {},
//     ) {
//         const where: WhereOptions = {};

//         // Active / inactive filter
//         if (
//             query.is_active === 'false' ||
//             query.is_active === false
//         ) {
//             where['is_active'] = false;
//         } else if (query.is_active === 'all') {
//             // Don't filter by active status
//         } else {
//             where['is_active'] = true;
//         }

//         // Search
//         if (query.search) {
//             (where as any)[Op.or] = [
//                 {
//                     name: {
//                         [Op.like]: `%${query.search}%`,
//                     },
//                 },
//             ];
//         }

//         // Department filter
//         if (query.department_id) {
//             where['department_id'] = query.department_id;
//         }

//         /*
//          * Only return sub-departments whose department
//          * belongs to the requested company.
//          */
//         const subdepartments = await SubDepartment.findAll({
//             where,
//             include: [
//                 {
//                     model: Department,
//                     as: 'department',
//                     attributes: ['id', 'department_name', 'company_id'],
//                     where: {
//                         company_id: companyId,
//                     },
//                     required: true,
//                 },
//             ],
//             order: [['name', 'ASC']],
//         });

//         const subDepartmentIds = subdepartments.map(
//             (d) => d.id,
//         );

//         if (subDepartmentIds.length === 0) {
//             return [];
//         }

//         const empCounts = await Employee.findAll({
//             where: {
//                 sub_department_id: {
//                     [Op.in]: subDepartmentIds,
//                 },
//                 status: {
//                     [Op.in]: ['Active', 'On_Probation'],
//                 },
//             },
//             attributes: [
//                 'sub_department_id',
//                 [fn('COUNT', col('id')), 'count'],
//             ],
//             group: ['sub_department_id'],
//             raw: true,
//         });

//         const countMap = new Map<number, number>(
//             empCounts.map((r: any) => [
//                 Number(r.sub_department_id),
//                 Number(r.count),
//             ]),
//         );

//         return subdepartments.map((d) => ({
//             ...d.toJSON(),
//             employee_count: countMap.get(d.id) ?? 0,
//         }));
//     }

//     // ─── Get By ID ───────────────────────────────────────────────────────────
//     async getById(
//         id: number,
//         companyId?: number,
//     ) {
//         const departmentWhere: WhereOptions = {};

//         if (companyId !== undefined) {
//             departmentWhere['company_id'] = companyId;
//         }

//         const dept = await SubDepartment.findOne({
//             where: { id },

//             include: [
//                 {
//                     model: Department,
//                     as: 'department',
//                     attributes: [
//                         'id',
//                         'department_name',
//                         'company_id',
//                     ],
//                     where: departmentWhere,
//                     required: true,
//                 },
//                 {
//                     model: Employee,
//                     as: 'employees',
//                     attributes: [
//                         'id',
//                         'first_name',
//                         'last_name',
//                         'employee_code',
//                         'status',
//                         'avatar_url',
//                         'designation_id',
//                     ],
//                     where: {
//                         status: {
//                             [Op.in]: ['Active', 'On_Probation'],
//                         },
//                     },
//                     required: false,
//                 },
//             ],
//         });

//         if (!dept) {
//             throw new AppError(
//                 'Sub Department not found',
//                 404,
//             );
//         }

//         return dept;
//     }

//     // ─── Create ───────────────────────────────────────────────────────────────
//     async create(
//         dto: CreateSubDepartmentDto,
//         companyId: number,
//         createdBy?: number,
//     ) {
//         /*
//          * First verify that the selected department
//          * actually belongs to the current company.
//          */
//         const department = await Department.findOne({
//             where: {
//                 id: dto.department_id,
//                 company_id: companyId,
//                 is_active: true,
//             },
//         });

//         if (!department) {
//             throw new AppError(
//                 'Department not found or does not belong to this company',
//                 404,
//             );
//         }

//         /*
//          * Because the unique index is:
//          *
//          * department_id + name
//          *
//          * duplicate checking must also use department_id.
//          */
//         const existing = await SubDepartment.findOne({
//             where: {
//                 department_id: dto.department_id,
//                 name: dto.name.trim(),
//                 is_active: true,
//             },
//         });

//         if (existing) {
//             throw new AppError(
//                 `Sub Department "${dto.name}" already exists in this department`,
//                 409,
//             );
//         }

//         const dept = await SubDepartment.create({
//             department_id: dto.department_id,
//             name: dto.name.trim(),
//             is_active: true,
//             created_by: createdBy ?? null,
//         });

//         await logActivity({
//             companyId,
//             employeeId: createdBy,
//             action: 'SUBDEPARTMENT_CREATED',
//             module: 'subdepartments',
//             entityId: dept.id,

//             newValues: {
//                 department_id: dept.department_id,
//                 name: dept.name,
//                 is_active: dept.is_active,
//             },
//         });

//         return this.getById(
//             dept.id,
//             companyId,
//         );
//     }

//     // ─── Update ──────────────────────────────────────────────────────────────
//     async update(
//         id: number,
//         companyId: number,
//         dto: UpdateSubDepartmentDto,
//         updatedBy?: number,
//     ) {
//         /*
//          * Make sure the existing sub-department belongs
//          * to the current company.
//          */
//         const dept = await SubDepartment.findOne({
//             where: { id },

//             include: [
//                 {
//                     model: Department,
//                     as: 'department',
//                     attributes: [
//                         'id',
//                         'department_name',
//                         'company_id',
//                     ],
//                     where: {
//                         company_id: companyId,
//                     },
//                     required: true,
//                 },
//             ],
//         });

//         if (!dept) {
//             throw new AppError(
//                 'Sub Department not found',
//                 404,
//             );
//         }

//         const newDepartmentId =
//             dto.department_id ?? dept.department_id;

//         /*
//          * If department is being changed,
//          * make sure the new department belongs
//          * to the same company.
//          */
//         const department = await Department.findOne({
//             where: {
//                 id: newDepartmentId,
//                 company_id: companyId,
//                 is_active: true,
//             },
//         });

//         if (!department) {
//             throw new AppError(
//                 'Department not found or does not belong to this company',
//                 404,
//             );
//         }

//         const newName =
//             dto.name !== undefined
//                 ? dto.name.trim()
//                 : dept.name;

//         /*
//          * Check duplicate combination:
//          *
//          * department_id + name
//          */
//         const existing = await SubDepartment.findOne({
//             where: {
//                 department_id: newDepartmentId,
//                 name: newName,

//                 id: {
//                     [Op.ne]: id,
//                 },
//             },
//         });

//         if (existing) {
//             throw new AppError(
//                 `Sub Department "${newName}" already exists in this department`,
//                 409,
//             );
//         }

//         const before = {
//             department_id: dept.department_id,
//             name: dept.name,
//             is_active: dept.is_active,
//         };

//         await dept.update({
//             department_id: newDepartmentId,
//             name: newName,
//             is_active:
//                 dto.is_active !== undefined
//                     ? dto.is_active
//                     : dept.is_active,
//             updated_by: updatedBy ?? null,
//         });

//         await logActivity({
//             companyId,
//             employeeId: updatedBy,
//             action: 'SUBDEPARTMENT_UPDATED',
//             module: 'subdepartments',
//             entityId: id,

//             oldValues:
//                 before as Record<string, unknown>,

//             newValues: {
//                 department_id: dept.department_id,
//                 name: dept.name,
//                 is_active: dept.is_active,
//             },
//         });

//         return this.getById(
//             id,
//             companyId,
//         );
//     }

//     // ─── Soft Delete ─────────────────────────────────────────────────────────
//     async delete(
//         id: number,
//         companyId: number,
//         deletedBy?: number,
//     ) {
//         /*
//          * Make sure the sub-department belongs
//          * to the current company.
//          */
//         const dept = await SubDepartment.findOne({
//             where: { id },

//             include: [
//                 {
//                     model: Department,
//                     as: 'department',
//                     attributes: [
//                         'id',
//                         'department_name',
//                         'company_id',
//                     ],
//                     where: {
//                         company_id: companyId,
//                     },
//                     required: true,
//                 },
//             ],
//         });

//         if (!dept) {
//             throw new AppError(
//                 'Sub Department not found',
//                 404,
//             );
//         }

//         const empCount = await Employee.count({
//             where: {
//                 sub_department_id: id,

//                 status: {
//                     [Op.in]: [
//                         'Active',
//                         'On_Probation',
//                     ],
//                 },
//             },
//         });

//         if (empCount > 0) {
//             throw new AppError(
//                 `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//                 409,
//             );
//         }

//         await dept.update({
//             is_active: false,
//             deleted_by: deletedBy ?? null,
//         });

//         await dept.destroy();

//         await logActivity({
//             companyId,
//             employeeId: deletedBy,
//             action: 'SUBDEPARTMENT_DELETED',
//             module: 'subdepartments',
//             entityId: id,

//             oldValues: {
//                 department_id: dept.department_id,
//                 name: dept.name,
//             },
//         });
//     }
// }



// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
//   department_id?: number;
// }

// export class SubDepartmentService {
//   // ─── Get All ──────────────────────────────────────────────────────────────
//   async getAll(
//     companyId: number,
//     query: SubDepartmentQueryParams = {},
//   ) {
//     const where: WhereOptions = {};

//     // Active / inactive filter
//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active === 'all') {
//       // Don't filter by active status
//     } else {
//       where['is_active'] = true;
//     }

//     // Search filter
//     if (query.search?.trim()) {
//       (where as any).name = {
//         [Op.like]: `%${query.search.trim()}%`,
//       };
//     }

//     // Department filter
//     if (query.department_id) {
//       where['department_id'] = query.department_id;
//     }

//     /*
//      * Only return sub-departments whose parent department
//      * belongs to the specified company.
//      */
//     const subdepartments = await SubDepartment.findAll({
//       where,
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id'],
//           where: {
//             company_id: companyId,
//           },
//           required: true,
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     const subDepartmentIds = subdepartments.map((d) => d.id);

//     if (subDepartmentIds.length === 0) {
//       return [];
//     }

//     // Fetch active employee counts per sub-department
//     const empCounts = await Employee.findAll({
//       where: {
//         sub_department_id: {
//           [Op.in]: subDepartmentIds,
//         },
//         status: {
//           [Op.in]: ['Active', 'On_Probation'],
//         },
//       },
//       attributes: [
//         'sub_department_id',
//         [fn('COUNT', col('id')), 'count'],
//       ],
//       group: ['sub_department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [
//         Number(r.sub_department_id),
//         Number(r.count),
//       ]),
//     );

//     return subdepartments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Get By ID ───────────────────────────────────────────────────────────
//   async getById(
//     id: number,
//     companyId?: number,
//   ) {
//     const departmentWhere: WhereOptions = {};

//     if (companyId !== undefined) {
//       departmentWhere['company_id'] = companyId;
//     }

//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id'],
//           where: departmentWhere,
//           required: true,
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
//               [Op.in]: ['Active', 'On_Probation'],
//             },
//           },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     return dept;
//   }

//   // ─── Create ───────────────────────────────────────────────────────────────
//   async create(
//     dto: CreateSubDepartmentDto,
//     companyId: number,
//     createdBy?: number,
//   ) {
//     // 1. Guard against null/undefined department_id to satisfy TypeScript overloads
//     if (!dto.department_id) {
//       throw new AppError('Department ID is required', 400);
//     }

//     if (!dto.name?.trim()) {
//       throw new AppError('Sub Department name is required', 400);
//     }

//     // 2. Verify parent department belongs to current company and is active
//     const department = await Department.findOne({
//       where: {
//         id: dto.department_id,
//         company_id: companyId,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError(
//         'Department not found or does not belong to this company',
//         404,
//       );
//     }

//     const cleanName = dto.name.trim();

//     // 3. Duplicate check within the same department
//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: dto.department_id,
//         name: cleanName,
//       },
//     });

//     if (existing) {
//       throw new AppError(
//         `Sub Department "${cleanName}" already exists in this department`,
//         409,
//       );
//     }

//     // 4. Create sub-department
//     const dept = await SubDepartment.create({
//       department_id: dto.department_id,
//       name: cleanName,
//       is_active: true,
//       created_by: createdBy ?? null,
//     });

//     // 5. Audit log
//     await logActivity({
//       companyId,
//       employeeId: createdBy,
//       action: 'SUBDEPARTMENT_CREATED',
//       module: 'subdepartments',
//       entityId: dept.id,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(dept.id, companyId);
//   }

//   // ─── Update ──────────────────────────────────────────────────────────────
//   async update(
//     id: number,
//     companyId: number,
//     dto: UpdateSubDepartmentDto,
//     updatedBy?: number,
//   ) {
//     // 1. Fetch sub-department and verify tenant ownership
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id'],
//           where: {
//             company_id: companyId,
//           },
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     // 2. Explicitly infer typed number to satisfy TypeScript findOne overload
//     const newDepartmentId: number = dto.department_id ?? dept.department_id;

//     // 3. If parent department is changing, verify target department ownership
//     const department = await Department.findOne({
//       where: {
//         id: newDepartmentId,
//         company_id: companyId,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError(
//         'Department not found or does not belong to this company',
//         404,
//       );
//     }

//     const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

//     // 4. Duplicate check excluding current record
//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: newDepartmentId,
//         name: newName,
//         id: {
//           [Op.ne]: id,
//         },
//       },
//     });

//     if (existing) {
//       throw new AppError(
//         `Sub Department "${newName}" already exists in this department`,
//         409,
//       );
//     }

//     const before = {
//       department_id: dept.department_id,
//       name: dept.name,
//       is_active: dept.is_active,
//     };

//     // 5. Perform update
//     await dept.update({
//       department_id: newDepartmentId,
//       name: newName,
//       is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//       updated_by: updatedBy ?? null,
//     });

//     // 6. Audit log
//     await logActivity({
//       companyId,
//       employeeId: updatedBy,
//       action: 'SUBDEPARTMENT_UPDATED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(id, companyId);
//   }

//   // ─── Soft Delete ─────────────────────────────────────────────────────────
//   async delete(
//     id: number,
//     companyId: number,
//     deletedBy?: number,
//   ) {
//     // 1. Fetch sub-department and verify tenant ownership
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id'],
//           where: {
//             company_id: companyId,
//           },
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     // 2. Prevent deletion if active employees exist in this sub-department
//     const empCount = await Employee.count({
//       where: {
//         sub_department_id: id,
//         status: {
//           [Op.in]: ['Active', 'On_Probation'],
//         },
//       },
//     });

//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409,
//       );
//     }

//     // 3. Soft delete updates
//     await dept.update({
//       is_active: false,
//       deleted_by: deletedBy ?? null,
//     });

//     await dept.destroy();

//     // 4. Audit log
//     await logActivity({
//       companyId,
//       employeeId: deletedBy,
//       action: 'SUBDEPARTMENT_DELETED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//       },
//     });
//   }
// }



// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
//   department_id?: number;
// }

// export class SubDepartmentService {
//   /**
//    * Helper condition to match parent departments associated with the given company
//    * (Direct company_id OR global is_all_companies flag)
//    */
//   private getCompanyDepartmentFilter(companyId: number): WhereOptions {
//     return {
//       [Op.or]: [
//         { company_id: companyId },
//         { is_all_companies: true },
//       ],
//     };
//   }

//   // ─── Get All ──────────────────────────────────────────────────────────────
//   async getAll(companyId: number, query: SubDepartmentQueryParams = {}) {
//     const where: WhereOptions = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = true;
//     }

//     if (query.search?.trim()) {
//       (where as any).name = {
//         [Op.like]: `%${query.search.trim()}%`,
//       };
//     }

//     if (query.department_id) {
//       where['department_id'] = query.department_id;
//     }

//     const subdepartments = await SubDepartment.findAll({
//       where,
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     const subDepartmentIds = subdepartments.map((d) => d.id);
//     if (subDepartmentIds.length === 0) return [];

//     // Active employee counts per sub-department
//     const empCounts = await Employee.findAll({
//       where: {
//         sub_department_id: { [Op.in]: subDepartmentIds },
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//       attributes: ['sub_department_id', [fn('COUNT', col('id')), 'count']],
//       group: ['sub_department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [Number(r.sub_department_id), Number(r.count)])
//     );

//     return subdepartments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Get By ID ───────────────────────────────────────────────────────────
//   async getById(id: number, companyId?: number) {
//     const departmentWhere: WhereOptions = companyId
//       ? this.getCompanyDepartmentFilter(companyId)
//       : {};

//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: departmentWhere,
//           required: true,
//         },
//         {
//           model: Employee,
//           as: 'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//           where: { status: { [Op.in]: ['Active', 'On_Probation'] } },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     return dept;
//   }

//   // ─── Create ───────────────────────────────────────────────────────────────
//   async create(dto: CreateSubDepartmentDto, companyId: number, createdBy?: number) {
//     if (!dto.department_id) {
//       throw new AppError('Department ID is required', 400);
//     }

//     if (!dto.name?.trim()) {
//       throw new AppError('Sub Department name is required', 400);
//     }

//     // Verify parent department belongs to company (or is_all_companies) and is active
//     const department = await Department.findOne({
//       where: {
//         id: dto.department_id,
//         is_active: true,
//         ...this.getCompanyDepartmentFilter(companyId),
//       },
//     });

//     if (!department) {
//       throw new AppError('Department not found or does not belong to this company', 404);
//     }

//     const cleanName = dto.name.trim();

//     // Duplicate check within same department
//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: dto.department_id,
//         name: cleanName,
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${cleanName}" already exists in this department`, 409);
//     }

//     const dept = await SubDepartment.create({
//       department_id: dto.department_id,
//       name: cleanName,
//       is_active: true,
//       created_by: createdBy ?? null,
//     });

//     await logActivity({
//       companyId,
//       employeeId: createdBy,
//       action: 'SUBDEPARTMENT_CREATED',
//       module: 'subdepartments',
//       entityId: dept.id,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(dept.id, companyId);
//   }

//   // ─── Update ──────────────────────────────────────────────────────────────
//   async update(id: number, companyId: number, dto: UpdateSubDepartmentDto, updatedBy?: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const newDepartmentId: number = dto.department_id ?? dept.department_id!;

//     // If department changing, verify target department
//     const department = await Department.findOne({
//       where: {
//         id: newDepartmentId,
//         is_active: true,
//         ...this.getCompanyDepartmentFilter(companyId),
//       },
//     });

//     if (!department) {
//       throw new AppError('Target department not found or does not belong to this company', 404);
//     }

//     const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: newDepartmentId,
//         name: newName,
//         id: { [Op.ne]: id },
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${newName}" already exists in this department`, 409);
//     }

//     const before = {
//       department_id: dept.department_id,
//       name: dept.name,
//       is_active: dept.is_active,
//     };

//     await dept.update({
//       department_id: newDepartmentId,
//       name: newName,
//       is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//       updated_by: updatedBy ?? null,
//     });

//     await logActivity({
//       companyId,
//       employeeId: updatedBy,
//       action: 'SUBDEPARTMENT_UPDATED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(id, companyId);
//   }

//   // ─── Soft Delete ─────────────────────────────────────────────────────────
//   async delete(id: number, companyId: number, deletedBy?: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const empCount = await Employee.count({
//       where: {
//         sub_department_id: id,
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//     });

//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409
//       );
//     }

//     await dept.update({
//       is_active: false,
//       deleted_by: deletedBy ?? null,
//     });

//     await dept.destroy();

//     await logActivity({
//       companyId,
//       employeeId: deletedBy,
//       action: 'SUBDEPARTMENT_DELETED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//       },
//     });
//   }
// }













// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
//   department_id?: number;
// }

// export class SubDepartmentService {
//   /**
//    * Helper condition to match parent departments associated with the given company
//    */
//   private getCompanyDepartmentFilter(companyId: number): WhereOptions {
//     return {
//       [Op.or]: [
//         { is_all_companies: true },
//         { company_id: companyId },
//         // Support postgres/MySQL JSON or ARRAY column types for company_ids
//         { company_ids: { [Op.contains]: [companyId] } },
//       ],
//     };
//   }

//   // ─── Get All ──────────────────────────────────────────────────────────────
//   async getAll(companyId: number, query: SubDepartmentQueryParams = {}) {
//     const where: WhereOptions = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = true;
//     }

//     if (query.search?.trim()) {
//       (where as any).name = {
//         [Op.like]: `%${query.search.trim()}%`,
//       };
//     }

//     if (query.department_id) {
//       where['department_id'] = query.department_id;
//     }

//     const subdepartments = await SubDepartment.findAll({
//       where,
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     const subDepartmentIds = subdepartments.map((d) => d.id);
//     if (subDepartmentIds.length === 0) return [];

//     const empCounts = await Employee.findAll({
//       where: {
//         sub_department_id: { [Op.in]: subDepartmentIds },
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//       attributes: ['sub_department_id', [fn('COUNT', col('id')), 'count']],
//       group: ['sub_department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [Number(r.sub_department_id), Number(r.count)])
//     );

//     return subdepartments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Get By ID ───────────────────────────────────────────────────────────
//   async getById(id: number, companyId?: number) {
//     const departmentWhere: WhereOptions = companyId
//       ? this.getCompanyDepartmentFilter(companyId)
//       : {};

//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: departmentWhere,
//           required: true,
//         },
//         {
//           model: Employee,
//           as: 'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//           where: { status: { [Op.in]: ['Active', 'On_Probation'] } },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     return dept;
//   }

//   // ─── Create ───────────────────────────────────────────────────────────────
//   // async create(dto: CreateSubDepartmentDto, companyId: number, createdBy?: number) {
//   //   if (!dto.department_id) {
//   //     throw new AppError('Department ID is required', 400);
//   //   }

//   //   if (!dto.name?.trim()) {
//   //     throw new AppError('Sub Department name is required', 400);
//   //   }

//   //   // Fixed query logic using explicit Op.and
//   //   const department = await Department.findOne({
//   //     where: {
//   //       [Op.and]: [
//   //         { id: dto.department_id },
//   //         { is_active: true },
//   //         this.getCompanyDepartmentFilter(companyId),
//   //       ],
//   //     },
//   //   });

//   //   if (!department) {
//   //     throw new AppError('Department not found or does not belong to this company', 404);
//   //   }

//   //   const cleanName = dto.name.trim();

//   //   const existing = await SubDepartment.findOne({
//   //     where: {
//   //       department_id: dto.department_id,
//   //       name: cleanName,
//   //     },
//   //   });

//   //   if (existing) {
//   //     throw new AppError(`Sub Department "${cleanName}" already exists in this department`, 409);
//   //   }

//   //   const dept = await SubDepartment.create({
//   //     department_id: dto.department_id,
//   //     name: cleanName,
//   //     is_active: true,
//   //     created_by: createdBy ?? null,
//   //   });

//   //   await logActivity({
//   //     companyId,
//   //     employeeId: createdBy,
//   //     action: 'SUBDEPARTMENT_CREATED',
//   //     module: 'subdepartments',
//   //     entityId: dept.id,
//   //     newValues: {
//   //       department_id: dept.department_id,
//   //       name: dept.name,
//   //       is_active: dept.is_active,
//   //     },
//   //   });

//   //   return this.getById(dept.id, companyId);
//   // }


//   async create(dto: CreateSubDepartmentDto, companyId: number, createdBy?: number) {
//     if (!dto.department_id) {
//       throw new AppError('Department ID is required', 400);
//     }

//     if (!dto.name?.trim()) {
//       throw new AppError('Sub Department name is required', 400);
//     }

//     // Check ONLY that the parent department exists and is active
//     const department = await Department.findOne({
//       where: {
//         id: dto.department_id,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError('Department not found or is inactive', 404);
//     }

//     const cleanName = dto.name.trim();

//     // Duplicate check within same department
//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: dto.department_id,
//         name: cleanName,
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${cleanName}" already exists in this department`, 409);
//     }

//     const dept = await SubDepartment.create({
//       department_id: dto.department_id,
//       name: cleanName,
//       is_active: true,
//       created_by: createdBy ?? null,
//     });

//     await logActivity({
//       companyId,
//       employeeId: createdBy,
//       action: 'SUBDEPARTMENT_CREATED',
//       module: 'subdepartments',
//       entityId: dept.id,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     // Call getById without passing companyId so it doesn't fail on retrieval
//     return this.getById(dept.id);
//   }

//   // ─── Update ──────────────────────────────────────────────────────────────
//   async update(id: number, companyId: number, dto: UpdateSubDepartmentDto, updatedBy?: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const newDepartmentId: number = dto.department_id ?? dept.department_id!;

//     const department = await Department.findOne({
//       where: {
//         [Op.and]: [
//           { id: newDepartmentId },
//           { is_active: true },
//           this.getCompanyDepartmentFilter(companyId),
//         ],
//       },
//     });

//     if (!department) {
//       throw new AppError('Target department not found or does not belong to this company', 404);
//     }

//     const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: newDepartmentId,
//         name: newName,
//         id: { [Op.ne]: id },
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${newName}" already exists in this department`, 409);
//     }

//     const before = {
//       department_id: dept.department_id,
//       name: dept.name,
//       is_active: dept.is_active,
//     };

//     await dept.update({
//       department_id: newDepartmentId,
//       name: newName,
//       is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//       updated_by: updatedBy ?? null,
//     });

//     await logActivity({
//       companyId,
//       employeeId: updatedBy,
//       action: 'SUBDEPARTMENT_UPDATED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(id, companyId);
//   }

//   // ─── Soft Delete ─────────────────────────────────────────────────────────
//   async delete(id: number, companyId: number, deletedBy?: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           where: this.getCompanyDepartmentFilter(companyId),
//           required: true,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const empCount = await Employee.count({
//       where: {
//         sub_department_id: id,
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//     });

//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409
//       );
//     }

//     await dept.update({
//       is_active: false,
//       deleted_by: deletedBy ?? null,
//     });

//     await dept.destroy();

//     await logActivity({
//       companyId,
//       employeeId: deletedBy,
//       action: 'SUBDEPARTMENT_DELETED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//       },
//     });
//   }
// }











// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
//   department_id?: number;
// }

// export class SubDepartmentService {
//   // ─── Get All ──────────────────────────────────────────────────────────────
//   async getAll(query: SubDepartmentQueryParams = {}) {
//     const where: WhereOptions = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = true;
//     }

//     if (query.search?.trim()) {
//       (where as any).name = {
//         [Op.like]: `%${query.search.trim()}%`,
//       };
//     }

//     if (query.department_id) {
//       where['department_id'] = query.department_id;
//     }

//     const subdepartments = await SubDepartment.findAll({
//       where,
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           required: false,
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     const subDepartmentIds = subdepartments.map((d) => d.id);
//     if (subDepartmentIds.length === 0) return [];

//     const empCounts = await Employee.findAll({
//       where: {
//         sub_department_id: { [Op.in]: subDepartmentIds },
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//       attributes: ['sub_department_id', [fn('COUNT', col('id')), 'count']],
//       group: ['sub_department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [Number(r.sub_department_id), Number(r.count)])
//     );

//     return subdepartments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Get By ID ───────────────────────────────────────────────────────────
//   async getById(id: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'company_id', 'is_all_companies'],
//           required: false,
//         },
//         {
//           model: Employee,
//           as: 'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//           where: { status: { [Op.in]: ['Active', 'On_Probation'] } },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     return dept;
//   }

//   // ─── Create ───────────────────────────────────────────────────────────────
//   async create(dto: CreateSubDepartmentDto, companyId?: number | null, createdBy?: number) {
//     if (!dto.department_id) {
//       throw new AppError('Department ID is required', 400);
//     }

//     if (!dto.name?.trim()) {
//       throw new AppError('Sub Department name is required', 400);
//     }

//     const department = await Department.findOne({
//       where: {
//         id: dto.department_id,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError('Department not found or is inactive', 404);
//     }

//     const cleanName = dto.name.trim();

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: dto.department_id,
//         name: cleanName,
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${cleanName}" already exists in this department`, 409);
//     }

//     const dept = await SubDepartment.create({
//       department_id: dto.department_id,
//       name: cleanName,
//       is_active: true,
//       created_by: createdBy ?? null,
//     });

//     await logActivity({
//       companyId: companyId ?? department.company_id ?? 0,
//       employeeId: createdBy,
//       action: 'SUBDEPARTMENT_CREATED',
//       module: 'subdepartments',
//       entityId: dept.id,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(dept.id);
//   }

//   // ─── Update ──────────────────────────────────────────────────────────────
//   async update(id: number, dto: UpdateSubDepartmentDto, companyId?: number | null, updatedBy?: number) {
//     const dept = await SubDepartment.findOne({ where: { id } });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const newDepartmentId: number = dto.department_id ?? dept.department_id!;

//     const department = await Department.findOne({
//       where: {
//         id: newDepartmentId,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError('Target department not found or is inactive', 404);
//     }

//     const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: newDepartmentId,
//         name: newName,
//         id: { [Op.ne]: id },
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${newName}" already exists in this department`, 409);
//     }

//     const before = {
//       department_id: dept.department_id,
//       name: dept.name,
//       is_active: dept.is_active,
//     };

//     await dept.update({
//       department_id: newDepartmentId,
//       name: newName,
//       is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//       updated_by: updatedBy ?? null,
//     });

//     await logActivity({
//       companyId: companyId ?? department.company_id ?? 0,
//       employeeId: updatedBy,
//       action: 'SUBDEPARTMENT_UPDATED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(id);
//   }

//   // ─── Soft Delete ─────────────────────────────────────────────────────────
//   async delete(id: number, companyId?: number | null, deletedBy?: number) {
//     const dept = await SubDepartment.findOne({ where: { id } });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const empCount = await Employee.count({
//       where: {
//         sub_department_id: id,
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//     });

//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409
//       );
//     }

//     await dept.update({
//       is_active: false,
//       deleted_by: deletedBy ?? null,
//     });

//     await dept.destroy();

//     await logActivity({
//       companyId: companyId ?? 0,
//       employeeId: deletedBy,
//       action: 'SUBDEPARTMENT_DELETED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//       },
//     });
//   }
// }






// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { SubDepartment } from '../../database/models/Subdepartment';
// import { Department } from '../../database/models/Department';
// import { Employee } from '../../database/models/Employee';
// import { AppError } from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateSubDepartmentDto {
//   department_id: number;
//   name: string;
// }

// export interface UpdateSubDepartmentDto {
//   department_id?: number;
//   name?: string;
//   is_active?: boolean;
// }

// export interface SubDepartmentQueryParams {
//   search?: string;
//   is_active?: string | boolean;
//   department_id?: number;
// }

// export class SubDepartmentService {
//   // ─── Get All ──────────────────────────────────────────────────────────────
//   async getAll(query: SubDepartmentQueryParams = {}) {
//     const where: WhereOptions = {};

//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active !== 'all') {
//       where['is_active'] = true;
//     }

//     if (query.search?.trim()) {
//       (where as any).name = {
//         [Op.like]: `%${query.search.trim()}%`,
//       };
//     }

//     if (query.department_id) {
//       where['department_id'] = query.department_id;
//     }

//     const subdepartments = await SubDepartment.findAll({
//       where,
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'is_all_companies'],
//           required: false,
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     const subDepartmentIds = subdepartments.map((d) => d.id);
//     if (subDepartmentIds.length === 0) return [];

//     const empCounts = await Employee.findAll({
//       where: {
//         sub_department_id: { [Op.in]: subDepartmentIds },
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//       attributes: ['sub_department_id', [fn('COUNT', col('id')), 'count']],
//       group: ['sub_department_id'],
//       raw: true,
//     });

//     const countMap = new Map<number, number>(
//       empCounts.map((r: any) => [Number(r.sub_department_id), Number(r.count)])
//     );

//     return subdepartments.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   // ─── Get By ID ───────────────────────────────────────────────────────────
//   async getById(id: number) {
//     const dept = await SubDepartment.findOne({
//       where: { id },
//       include: [
//         {
//           model: Department,
//           as: 'department',
//           attributes: ['id', 'department_name', 'is_all_companies'],
//           required: false,
//         },
//         {
//           model: Employee,
//           as: 'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
//           where: { status: { [Op.in]: ['Active', 'On_Probation'] } },
//           required: false,
//         },
//       ],
//     });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     return dept;
//   }

//   // ─── Create ───────────────────────────────────────────────────────────────
//   async create(dto: CreateSubDepartmentDto, companyId?: number | null, createdBy?: number) {
//     if (!dto.department_id) {
//       throw new AppError('Department ID is required', 400);
//     }

//     if (!dto.name?.trim()) {
//       throw new AppError('Sub Department name is required', 400);
//     }

//     const department = await Department.findOne({
//       where: {
//         id: dto.department_id,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError('Department not found or is inactive', 404);
//     }

//     const cleanName = dto.name.trim();

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: dto.department_id,
//         name: cleanName,
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${cleanName}" already exists in this department`, 409);
//     }

//     const dept = await SubDepartment.create({
//       department_id: dto.department_id,
//       name: cleanName,
//       is_active: true,
//       created_by: createdBy ?? null,
//     });

//     await logActivity({
//       companyId: companyId ?? 0,
//       employeeId: createdBy,
//       action: 'SUBDEPARTMENT_CREATED',
//       module: 'subdepartments',
//       entityId: dept.id,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(dept.id);
//   }

//   // ─── Update ──────────────────────────────────────────────────────────────
//   async update(id: number, dto: UpdateSubDepartmentDto, companyId?: number | null, updatedBy?: number) {
//     const dept = await SubDepartment.findOne({ where: { id } });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     if (dto.name !== undefined && !dto.name.trim()) {
//       throw new AppError('Sub Department name cannot be empty', 400);
//     }

//     const newDepartmentId: number = dto.department_id ?? dept.department_id!;

//     const department = await Department.findOne({
//       where: {
//         id: newDepartmentId,
//         is_active: true,
//       },
//     });

//     if (!department) {
//       throw new AppError('Target department not found or is inactive', 404);
//     }

//     const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

//     const existing = await SubDepartment.findOne({
//       where: {
//         department_id: newDepartmentId,
//         name: newName,
//         id: { [Op.ne]: id },
//       },
//     });

//     if (existing) {
//       throw new AppError(`Sub Department "${newName}" already exists in this department`, 409);
//     }

//     const before = {
//       department_id: dept.department_id,
//       name: dept.name,
//       is_active: dept.is_active,
//     };

//     await dept.update({
//       department_id: newDepartmentId,
//       name: newName,
//       is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
//       updated_by: updatedBy ?? null,
//     });

//     await logActivity({
//       companyId: companyId ?? 0,
//       employeeId: updatedBy,
//       action: 'SUBDEPARTMENT_UPDATED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//         is_active: dept.is_active,
//       },
//     });

//     return this.getById(id);
//   }

//   // ─── Soft Delete ─────────────────────────────────────────────────────────
//   async delete(id: number, companyId?: number | null, deletedBy?: number) {
//     const dept = await SubDepartment.findOne({ where: { id } });

//     if (!dept) {
//       throw new AppError('Sub Department not found', 404);
//     }

//     const empCount = await Employee.count({
//       where: {
//         sub_department_id: id,
//         status: { [Op.in]: ['Active', 'On_Probation'] },
//       },
//     });

//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
//         409
//       );
//     }

//     await dept.update({
//       is_active: false,
//       deleted_by: deletedBy ?? null,
//     });

//     await dept.destroy();

//     await logActivity({
//       companyId: companyId ?? 0,
//       employeeId: deletedBy,
//       action: 'SUBDEPARTMENT_DELETED',
//       module: 'subdepartments',
//       entityId: id,
//       oldValues: {
//         department_id: dept.department_id,
//         name: dept.name,
//       },
//     });
//   }
// }






import { Op, fn, col } from 'sequelize';
import { sequelize } from '../../config/database';
import { SubDepartment, SubDepartmentDepartment } from '../../database/models/Subdepartment';
import { Department } from '../../database/models/Department';
import { Employee } from '../../database/models/Employee';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logActivity } from '../../utils/activityLogger';

// ─── DTO Interfaces ─────────────────────────────────────────────────────────

export interface CreateSubDepartmentDto {
  name: string;
  code?: string | null;
  description?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  head_id?: number | null;
}

export interface UpdateSubDepartmentDto {
  name?: string;
  code?: string | null;
  description?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  head_id?: number | null;
  is_active?: boolean;
}

export interface SubDepartmentQueryParams {
  search?: string;
  is_active?: string | boolean;
  department_id?: number;
}

export class SubDepartmentService {
  // ─── Get All ──────────────────────────────────────────────────────────────
  async getAll(query: SubDepartmentQueryParams = {}) {
    const andConditions: any[] = [];

    if (query.is_active === 'false' || query.is_active === false) {
      andConditions.push({ is_active: false });
    } else if (query.is_active !== 'all') {
      andConditions.push({ is_active: true });
    }

    if (query.search?.trim()) {
      andConditions.push({ name: { [Op.like]: `%${query.search.trim()}%` } });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

    const includeOptions: any[] = [
      {
        model: SubDepartmentDepartment,
        as: 'department_mappings',
        attributes: ['department_id'],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'department_name', 'is_all_companies'],
          },
        ],
      },
    ];

    // Filter by single department if query parameter is provided
    if (query.department_id) {
      includeOptions[0].where = { department_id: query.department_id };
    }

    const subdepartments = await SubDepartment.findAll({
      where,
      include: includeOptions,
      order: [['name', 'ASC']],
    });

    const subDepartmentIds = subdepartments.map((d) => d.id);
    const countMap = new Map<number, number>();

    if (subDepartmentIds.length > 0) {
      const empCounts = await Employee.findAll({
        where: {
          sub_department_id: { [Op.in]: subDepartmentIds },
          status: { [Op.in]: ['Active', 'On_Probation'] },
        },
        attributes: ['sub_department_id', [fn('COUNT', col('id')), 'count']],
        group: ['sub_department_id'],
        raw: true,
      });

      empCounts.forEach((r: any) => countMap.set(Number(r.sub_department_id), Number(r.count)));
    }

    return subdepartments.map((d) => {
      const json = d.toJSON() as any;
      const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
      const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];

      delete json.department_mappings;

      return {
        ...json,
        department_ids: assignedDepartmentIds,
        departments: assignedDepartments,
        employee_count: countMap.get(d.id) ?? 0,
      };
    });
  }

  // ─── Get By ID ───────────────────────────────────────────────────────────
  async getById(id: number) {
    const dept = await SubDepartment.findOne({
      where: { id },
      include: [
        {
          model: SubDepartmentDepartment,
          as: 'department_mappings',
          attributes: ['department_id'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'department_name', 'is_all_companies'],
            },
          ],
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'designation_id'],
          where: { status: { [Op.in]: ['Active', 'On_Probation'] } },
          required: false,
        },
      ],
    });

    if (!dept) {
      throw new AppError('Sub Department not found', 404);
    }

    const json = dept.toJSON() as any;
    const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
    const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];

    delete json.department_mappings;

    return {
      ...json,
      department_ids: assignedDepartmentIds,
      departments: assignedDepartments,
    };
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  async create(dto: CreateSubDepartmentDto, companyId?: number | null, createdBy?: number) {
    if (!dto.name?.trim()) {
      throw new AppError('Sub Department name is required', 400);
    }

    if (!dto.is_all_departments && (!dto.department_ids || dto.department_ids.length === 0)) {
      throw new AppError('At least one department is required, or enable "All departments"', 400);
    }

    const cleanName = dto.name.trim();

    const existing = await SubDepartment.findOne({
      where: { name: cleanName, is_active: true },
    });

    if (existing) {
      throw new AppError(`Sub Department "${cleanName}" already exists`, 409);
    }

    if (!dto.is_all_departments && dto.department_ids && dto.department_ids.length > 0) {
      const validCount = await Department.count({
        where: { id: { [Op.in]: dto.department_ids }, is_active: true },
      });
      if (validCount !== dto.department_ids.length) {
        throw new AppError('One or more selected departments are invalid or inactive', 404);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const subDept = await SubDepartment.create(
        {
          name: cleanName,
          code: dto.code?.toUpperCase().trim() || null,
          description: dto.description?.trim() || null,
          is_all_departments: Boolean(dto.is_all_departments),
          is_active: true,
          head_id: dto.head_id ?? null,
          created_by: createdBy ?? null,
        },
        { transaction }
      );

      if (!dto.is_all_departments && Array.isArray(dto.department_ids) && dto.department_ids.length > 0) {
        const mappings = dto.department_ids.map((deptId) => ({
          sub_department_id: subDept.id,
          department_id: deptId,
        }));
        await SubDepartmentDepartment.bulkCreate(mappings, { transaction });
      }

      await transaction.commit();

      await logActivity({
        companyId: companyId ?? 0,
        employeeId: createdBy,
        action: 'SUBDEPARTMENT_CREATED',
        module: 'subdepartments',
        entityId: subDept.id,
        newValues: {
          name: subDept.name,
          is_all_departments: subDept.is_all_departments,
          department_ids: dto.is_all_departments ? [] : dto.department_ids ?? [],
          is_active: subDept.is_active,
        },
      });

      return this.getById(subDept.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────
  async update(id: number, dto: UpdateSubDepartmentDto, companyId?: number | null, updatedBy?: number) {
    const dept = await SubDepartment.findOne({ where: { id } });

    if (!dept) {
      throw new AppError('Sub Department not found', 404);
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new AppError('Sub Department name cannot be empty', 400);
    }

    const newName = dto.name !== undefined ? dto.name.trim() : dept.name;

    if (dto.name !== undefined && newName !== dept.name) {
      const existing = await SubDepartment.findOne({
        where: { name: newName, is_active: true, id: { [Op.ne]: id } },
      });
      if (existing) {
        throw new AppError(`Sub Department "${newName}" already exists`, 409);
      }
    }

    const isAllDepts = dto.is_all_departments !== undefined
      ? Boolean(dto.is_all_departments)
      : dept.is_all_departments;

    if (!isAllDepts && dto.department_ids !== undefined && dto.department_ids.length > 0) {
      const validCount = await Department.count({
        where: { id: { [Op.in]: dto.department_ids }, is_active: true },
      });
      if (validCount !== dto.department_ids.length) {
        throw new AppError('One or more selected departments are invalid or inactive', 404);
      }
    }

    const before = {
      name: dept.name,
      is_all_departments: dept.is_all_departments,
      is_active: dept.is_active,
    };

    const transaction = await sequelize.transaction();

    try {
      await dept.update(
        {
          name: newName,
          code: dto.code !== undefined ? (dto.code?.toUpperCase().trim() || null) : dept.code,
          description: dto.description !== undefined ? (dto.description?.trim() || null) : dept.description,
          is_all_departments: isAllDepts,
          is_active: dto.is_active !== undefined ? dto.is_active : dept.is_active,
          head_id: dto.head_id !== undefined ? dto.head_id : dept.head_id,
          updated_by: updatedBy ?? null,
        },
        { transaction }
      );

      // ── Department Junction Update ──
      // "All departments" clears explicit mappings; otherwise replace the
      // mapped set with whatever department_ids was sent (omit it entirely
      // to leave the current mappings untouched).
      if (isAllDepts) {
        await SubDepartmentDepartment.destroy({ where: { sub_department_id: id }, transaction });
      } else if (dto.department_ids !== undefined) {
        await SubDepartmentDepartment.destroy({ where: { sub_department_id: id }, transaction });

        if (Array.isArray(dto.department_ids) && dto.department_ids.length > 0) {
          const mappings = dto.department_ids.map((deptId) => ({
            sub_department_id: id,
            department_id: deptId,
          }));
          await SubDepartmentDepartment.bulkCreate(mappings, { transaction });
        }
      }

      await transaction.commit();

      await logActivity({
        companyId: companyId ?? 0,
        employeeId: updatedBy,
        action: 'SUBDEPARTMENT_UPDATED',
        module: 'subdepartments',
        entityId: id,
        oldValues: before,
        newValues: {
          name: dept.name,
          is_all_departments: dept.is_all_departments,
          is_active: dept.is_active,
        },
      });

      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── Soft Delete ─────────────────────────────────────────────────────────
  async delete(id: number, companyId?: number | null, deletedBy?: number) {
    const dept = await SubDepartment.findOne({ where: { id } });

    if (!dept) {
      throw new AppError('Sub Department not found', 404);
    }

    const empCount = await Employee.count({
      where: {
        sub_department_id: id,
        status: { [Op.in]: ['Active', 'On_Probation'] },
      },
    });

    if (empCount > 0) {
      throw new AppError(
        `Cannot delete "${dept.name}" — ${empCount} active employee(s) are assigned. Reassign them first.`,
        409
      );
    }

    const transaction = await sequelize.transaction();

    try {
      await SubDepartmentDepartment.destroy({ where: { sub_department_id: id }, transaction });

      await dept.update(
        { is_active: false, deleted_by: deletedBy ?? null },
        { transaction }
      );

      await dept.destroy({ transaction });

      await transaction.commit();

      await logActivity({
        companyId: companyId ?? 0,
        employeeId: deletedBy,
        action: 'SUBDEPARTMENT_DELETED',
        module: 'subdepartments',
        entityId: id,
        oldValues: { name: dept.name },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
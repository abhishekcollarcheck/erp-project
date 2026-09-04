// import { Op, WhereOptions, fn, col } from 'sequelize';
// import { Designation } from '../../database/models/Designation';
// import { Employee }    from '../../database/models/Employee';
// import { AppError }    from '../../middleware/errorHandler.middleware';
// import { logActivity } from '../../utils/activityLogger';

// export interface CreateDesignationDto {
//   designation_name:   string;
// }

// export interface UpdateDesignationDto {
//   designation_name?:  string;
//   is_active?:         boolean;
// }

// export interface DesignationQueryParams {
//   is_active?:         boolean | string;
//   search?:            string;
// }

// export class DesignationService {
//   async getAll(query: DesignationQueryParams = {}) {
//     const where: WhereOptions = { };
//     if (query.is_active === 'false' || query.is_active === false) {
//       where['is_active'] = false;
//     } else if (query.is_active === 'all') {
//     } else {
//       where['is_active'] = true;
//     }

//     if (query.search) {
//       (where as any)[Op.or] = [
//         { designation_name:  { [Op.like]: `%${query.search}%` } },
//       ];
//     }

//     const designations = await Designation.findAll({
//       where,
//       order: [['designation_name', 'ASC']],
//     });

//     const designationIds = designations.map((d) => d.id);
//     const empCounts = designationIds.length
//       ? await Employee.findAll({
//           where: { designation_id: designationIds, status: ['Active', 'On_Probation'] },
//           attributes: ['designation_id', [fn('COUNT', col('id')), 'count']],
//           group: ['designation_id'],
//           raw: true,
//         })
//       : [];

//     const countMap = new Map<number, number>(
//       (empCounts as any[]).map((r) => [r.designation_id, Number(r.count)]),
//     );

//     return designations.map((d) => ({
//       ...d.toJSON(),
//       employee_count: countMap.get(d.id) ?? 0,
//     }));
//   }

//   async getById(id: number, companyId: number) {
//     const designation = await Designation.findOne({
//       where: { id },
//       include: [
//         {
//           model:      Employee,
//           as:         'employees',
//           attributes: ['id', 'first_name', 'last_name', 'employee_code', 'status', 'avatar_url', 'department_id'],
//           where:      { status: ['Active', 'On_Probation'] },
//           required:   false,
//         },
//       ],
//     });

//     if (!designation) throw new AppError('Designation not found', 404);
//     return designation;
//   }

//   // ─── Stats ─────────────────────────────────────────────────────────────────
//   async getStats() {
//     const [total, active] = await Promise.all([
//       Designation.count({ where: { is_active: true } }),
//       Designation.count({ where: { is_active: true } }),
//     ]);

//     const empCounts = await Employee.findAll({
//       where:      { status: ['Active', 'On_Probation'] },
//       attributes: ['designation_id', [fn('COUNT', col('Employee.id')), 'count']],
//       include:    [{
//         model:      Designation,
//         as:         'designation',
//         where:      { },
//         attributes: ['designation_name'],
//         required:   true,
//       }],
//       group:   ['designation_id'],
//       order:   [[fn('COUNT', col('Employee.id')), 'DESC']],
//       limit:   1,
//       raw:     true,
//       nest:    true,
//     });

//     const top = empCounts[0] as any;
//     return {
//       total,
//       active,
//       inactive: total - active,
//     };
//   }

//   // ─── Create ────────────────────────────────────────────────────────────────
//   async create(companyId: number, dto: CreateDesignationDto, createdBy?: number): Promise<Designation> {
//     const designation = await Designation.create({
//       designation_name:  dto.designation_name.trim(),
//       is_active:     true,
//       created_by:    createdBy ?? null,
//     });

//     await logActivity({
//       companyId, employeeId: createdBy,
//       action: 'DESIGNATION_CREATED', module: 'designations', entityId: designation.id,
//     });

//     return this.getById(designation.id, companyId);
//   }

//   // ─── Update ────────────────────────────────────────────────────────────────
//   async update(id: number, companyId: number, dto: UpdateDesignationDto, updatedBy?: number): Promise<Designation> {
//     const designation = await this.findOrFail(id, companyId);

//     const before = {
//       designation_name: designation.designation_name,
//       is_active:     designation.is_active,
//     };

//     await designation.update({
//       designation_name: dto.designation_name?.trim()  ?? designation.designation_name,
//       is_active:     dto.is_active     !== undefined ? dto.is_active    : designation.is_active,
//       updated_by:    updatedBy         ?? null,
//     });

//     await logActivity({
//       companyId, employeeId: updatedBy,
//       action: 'DESIGNATION_UPDATED', module: 'designations', entityId: id,
//       oldValues: before as Record<string, unknown>,
//       newValues: { name: designation.designation_name, is_active: designation.is_active },
//     });

//     return this.getById(id, companyId);
//   }

//   // ─── Soft delete ───────────────────────────────────────────────────────────
//   async delete(id: number, companyId: number, deletedBy?: number): Promise<void> {
//     const designation = await this.findOrFail(id, companyId);

//     const empCount = await Employee.count({
//       where: { designation_id: id, status: ['Active', 'On_Probation'] },
//     });
//     if (empCount > 0) {
//       throw new AppError(
//         `Cannot delete "${designation.designation_name}" — ${empCount} active employee(s) hold this designation. Reassign them first.`,
//         409,
//       );
//     }

//     await designation.update({ is_active: false, updated_by: deletedBy ?? null });
//     await designation.destroy();

//     await logActivity({
//       companyId, employeeId: deletedBy,
//       action: 'DESIGNATION_DELETED', module: 'designations', entityId: id,
//       oldValues: { name: designation.designation_name },
//     });
//   }

//   // ─── Toggle active status ──────────────────────────────────────────────────
//   async toggleActive(id: number, companyId: number, updatedBy?: number): Promise<Designation> {
//     const designation = await this.findOrFail(id, companyId);
//     return this.update(id, companyId, { is_active: !designation.is_active }, updatedBy);
//   }

//   // ─── Private ───────────────────────────────────────────────────────────────
//   private async findOrFail(id: number, companyId: number): Promise<Designation> {
//     const d = await Designation.findOne({ where: { id } });
//     if (!d) throw new AppError('Designation not found', 404);
//     return d;
//   }
// }
















// import { Op, Transaction } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Designation } from '@/database/models';
// import { DesignationDepartment, SubDesignation } from '@/database/models/Designation';
// // import { Designation, DesignationDepartment, SubDesignation } from '../models'; // Adjust path as needed

// // Data Transfer Objects (DTOs)
// export interface CreateDesignationDTO {
//   name: string;
//   code?: string;
//   is_all_departments?: boolean;
//   department_ids?: number[]; // Required if is_all_departments === false
//   sub_designations?: { name: string; code?: string }[];
//   created_by?: number;
// }

// export interface UpdateDesignationDTO {
//   name?: string;
//   code?: string;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   is_active?: boolean;
//   updated_by?: number;
// }

// export interface CreateSubDesignationDTO {
//   designation_id: number;
//   name: string;
//   code?: string;
//   created_by?: number;
// }

// export interface UpdateSubDesignationDTO {
//   name?: string;
//   code?: string;
//   is_active?: boolean;
//   updated_by?: number;
// }

// export interface GetSubDesignationsFilterDTO {
//   designation_id?: number;
//   is_active?: boolean;
//   search?: string; // Searches name or code
// }

// export class DesignationService {
//   // ==========================================
//   // DESIGNATION METHODS
//   // ==========================================

//   public async createDesignation(data: CreateDesignationDTO): Promise<Designation> {
//     return await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.create(
//         {
//           name: data.name,
//           code: data.code,
//           is_all_departments: data.is_all_departments ?? false,
//           created_by: data.created_by,
//         },
//         { transaction: t }
//       );

//       if (!designation.is_all_departments && data.department_ids && data.department_ids.length > 0) {
//         const deptMappings = data.department_ids.map((deptId) => ({
//           designation_id: designation.id,
//           department_id: deptId,
//         }));
//         await DesignationDepartment.bulkCreate(deptMappings, { transaction: t });
//       }

//       if (data.sub_designations && data.sub_designations.length > 0) {
//         const subDesignationPayloads = data.sub_designations.map((sub) => ({
//           designation_id: designation.id,
//           name: sub.name,
//           code: sub.code,
//           created_by: data.created_by,
//         }));
//         await SubDesignation.bulkCreate(subDesignationPayloads, { transaction: t });
//       }

//       return designation;
//     });
//   }

//   public async getAllDesignations(includeInactive = false) {
//     const whereCondition = includeInactive ? {} : { is_active: true };

//     return await Designation.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: SubDesignation,
//           as: 'sub_designations',
//           where: includeInactive ? {} : { is_active: true },
//           required: false,
//         },
//       ],
//       order: [['created_at', 'DESC']],
//     });
//   }

//   public async getDesignationById(id: number): Promise<Designation | null> {
//     return await Designation.findByPk(id, {
//       include: [{ model: SubDesignation, as: 'sub_designations' }],
//     });
//   }

//   public async updateDesignation(id: number, data: UpdateDesignationDTO): Promise<Designation> {
//     return await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.findByPk(id, { transaction: t });
//       if (!designation) {
//         throw new Error('Designation not found');
//       }

//       await designation.update(
//         {
//           name: data.name ?? designation.name,
//           code: data.code !== undefined ? data.code : designation.code,
//           is_all_departments: data.is_all_departments ?? designation.is_all_departments,
//           is_active: data.is_active ?? designation.is_active,
//           updated_by: data.updated_by,
//         },
//         { transaction: t }
//       );

//       if (data.is_all_departments === true) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction: t });
//       } else if (data.department_ids !== undefined) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction: t });
//         if (data.department_ids.length > 0) {
//           const deptMappings = data.department_ids.map((deptId) => ({
//             designation_id: id,
//             department_id: deptId,
//           }));
//           await DesignationDepartment.bulkCreate(deptMappings, { transaction: t });
//         }
//       }

//       return designation;
//     });
//   }

//   public async deleteDesignation(id: number, deletedBy?: number): Promise<void> {
//     await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.findByPk(id, { transaction: t });
//       if (!designation) {
//         throw new Error('Designation not found');
//       }

//       if (deletedBy) {
//         await designation.update({ deleted_by: deletedBy }, { transaction: t });
//       }

//       await SubDesignation.destroy({ where: { designation_id: id }, transaction: t });
//       await designation.destroy({ transaction: t });
//     });
//   }

//   // ==========================================
//   // SUB-DESIGNATION METHODS (FETCHING & CRUD)
//   // ==========================================

//   /**
//    * Get SubDesignations with optional filters.
//    * Returns ALL sub-designations if no filter is provided.
//    */
//   public async getAllSubDesignations(filters?: GetSubDesignationsFilterDTO): Promise<SubDesignation[]> {
//     const whereCondition: any = {};

//     if (filters) {
//       if (filters.designation_id) {
//         whereCondition.designation_id = filters.designation_id;
//       }

//       if (filters.is_active !== undefined) {
//         whereCondition.is_active = filters.is_active;
//       }

//       if (filters.search) {
//         whereCondition[Op.or] = [
//           { name: { [Op.like]: `%${filters.search}%` } },
//           { code: { [Op.like]: `%${filters.search}%` } },
//         ];
//       }
//     }

//     return await SubDesignation.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: Designation,
//           as: 'designation',
//           attributes: ['id', 'name', 'code'],
//         },
//       ],
//       order: [['created_at', 'DESC']],
//     });
//   }

//   /**
//    * Get a single Sub-Designation by ID
//    */
//   public async getSubDesignationById(id: number): Promise<SubDesignation | null> {
//     return await SubDesignation.findByPk(id, {
//       include: [
//         {
//           model: Designation,
//           as: 'designation',
//           attributes: ['id', 'name', 'code'],
//         },
//       ],
//     });
//   }

//   public async createSubDesignation(data: CreateSubDesignationDTO): Promise<SubDesignation> {
//     const parent = await Designation.findByPk(data.designation_id);
//     if (!parent) {
//       throw new Error('Parent Designation does not exist');
//     }

//     return await SubDesignation.create({
//       designation_id: data.designation_id,
//       name: data.name,
//       code: data.code,
//       created_by: data.created_by,
//     });
//   }

//   public async updateSubDesignation(id: number, data: UpdateSubDesignationDTO): Promise<SubDesignation> {
//     const subDesignation = await SubDesignation.findByPk(id);
//     if (!subDesignation) {
//       throw new Error('Sub-Designation not found');
//     }

//     return await subDesignation.update({
//       name: data.name ?? subDesignation.name,
//       code: data.code !== undefined ? data.code : subDesignation.code,
//       is_active: data.is_active ?? subDesignation.is_active,
//       updated_by: data.updated_by,
//     });
//   }

//   public async deleteSubDesignation(id: number, deletedBy?: number): Promise<void> {
//     const subDesignation = await SubDesignation.findByPk(id);
//     if (!subDesignation) {
//       throw new Error('Sub-Designation not found');
//     }

//     if (deletedBy) {
//       await subDesignation.update({ deleted_by: deletedBy });
//     }

//     await subDesignation.destroy();
//   }
// }




// import { Op, Transaction } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Designation } from '@/database/models';
// import { DesignationDepartment, SubDesignation } from '@/database/models/Designation';

// // Data Transfer Objects (DTOs)
// export interface CreateDesignationDTO {
//   name: string;
//   code?: string;
//   is_all_departments?: boolean;
//   department_ids?: number[]; // Required if is_all_departments === false
//   sub_designations?: { name: string; code?: string }[];
// }

// export interface UpdateDesignationDTO {
//   name?: string;
//   code?: string;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   is_active?: boolean;
// }

// export interface CreateSubDesignationDTO {
//   designation_id: number;
//   name: string;
//   code?: string;
// }

// export interface UpdateSubDesignationDTO {
//   name?: string;
//   code?: string;
//   is_active?: boolean;
// }

// export interface GetSubDesignationsFilterDTO {
//   designation_id?: number;
//   is_active?: boolean;
//   search?: string; // Searches name or code
// }

// export class DesignationService {
//   // ==========================================
//   // DESIGNATION METHODS
//   // ==========================================

//   public async createDesignation(data: CreateDesignationDTO): Promise<Designation> {
//     return await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.create(
//         {
//           name: data.name,
//           code: data.code,
//           is_all_departments: data.is_all_departments ?? false,
//         },
//         { transaction: t }
//       );

//       if (!designation.is_all_departments && data.department_ids && data.department_ids.length > 0) {
//         const deptMappings = data.department_ids.map((deptId) => ({
//           designation_id: designation.id,
//           department_id: deptId,
//         }));
//         await DesignationDepartment.bulkCreate(deptMappings, { transaction: t });
//       }

//       if (data.sub_designations && data.sub_designations.length > 0) {
//         const subDesignationPayloads = data.sub_designations.map((sub) => ({
//           designation_id: designation.id,
//           name: sub.name,
//           code: sub.code,
//         }));
//         await SubDesignation.bulkCreate(subDesignationPayloads, { transaction: t });
//       }

//       return designation;
//     });
//   }

//   public async getAllDesignations(includeInactive = false) {
//     const whereCondition = includeInactive ? {} : { is_active: true };

//     return await Designation.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: SubDesignation,
//           as: 'sub_designations',
//           where: includeInactive ? {} : { is_active: true },
//           required: false,
//         },
//       ],
//       order: [['created_at', 'DESC']],
//     });
//   }

//   public async getDesignationById(id: number): Promise<Designation | null> {
//     return await Designation.findByPk(id, {
//       include: [{ model: SubDesignation, as: 'sub_designations' }],
//     });
//   }

//   public async updateDesignation(id: number, data: UpdateDesignationDTO): Promise<Designation> {
//     return await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.findByPk(id, { transaction: t });
//       if (!designation) {
//         throw new Error('Designation not found');
//       }

//       await designation.update(
//         {
//           name: data.name ?? designation.name,
//           code: data.code !== undefined ? data.code : designation.code,
//           is_all_departments: data.is_all_departments ?? designation.is_all_departments,
//           is_active: data.is_active ?? designation.is_active,
//         },
//         { transaction: t }
//       );

//       if (data.is_all_departments === true) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction: t });
//       } else if (data.department_ids !== undefined) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction: t });
//         if (data.department_ids.length > 0) {
//           const deptMappings = data.department_ids.map((deptId) => ({
//             designation_id: id,
//             department_id: deptId,
//           }));
//           await DesignationDepartment.bulkCreate(deptMappings, { transaction: t });
//         }
//       }

//       return designation;
//     });
//   }

//   public async deleteDesignation(id: number): Promise<void> {
//     await sequelize.transaction(async (t: Transaction) => {
//       const designation = await Designation.findByPk(id, { transaction: t });
//       if (!designation) {
//         throw new Error('Designation not found');
//       }

//       await SubDesignation.destroy({ where: { designation_id: id }, transaction: t });
//       await designation.destroy({ transaction: t });
//     });
//   }

//   // ==========================================
//   // SUB-DESIGNATION METHODS (FETCHING & CRUD)
//   // ==========================================

//   public async getAllSubDesignations(filters?: GetSubDesignationsFilterDTO): Promise<SubDesignation[]> {
//     const whereCondition: any = {};

//     if (filters) {
//       if (filters.designation_id) {
//         whereCondition.designation_id = filters.designation_id;
//       }

//       if (filters.is_active !== undefined) {
//         whereCondition.is_active = filters.is_active;
//       }

//       if (filters.search) {
//         whereCondition[Op.or] = [
//           { name: { [Op.like]: `%${filters.search}%` } },
//           { code: { [Op.like]: `%${filters.search}%` } },
//         ];
//       }
//     }

//     return await SubDesignation.findAll({
//       where: whereCondition,
//       include: [
//         {
//           model: Designation,
//           as: 'designation',
//           attributes: ['id', 'name', 'code'],
//         },
//       ],
//       order: [['created_at', 'DESC']],
//     });
//   }

//   public async getSubDesignationById(id: number): Promise<SubDesignation | null> {
//     return await SubDesignation.findByPk(id, {
//       include: [
//         {
//           model: Designation,
//           as: 'designation',
//           attributes: ['id', 'name', 'code'],
//         },
//       ],
//     });
//   }

//   public async createSubDesignation(data: CreateSubDesignationDTO): Promise<SubDesignation> {
//     const parent = await Designation.findByPk(data.designation_id);
//     if (!parent) {
//       throw new Error('Parent Designation does not exist');
//     }

//     return await SubDesignation.create({
//       designation_id: data.designation_id,
//       name: data.name,
//       code: data.code,
//     });
//   }

//   public async updateSubDesignation(id: number, data: UpdateSubDesignationDTO): Promise<SubDesignation> {
//     const subDesignation = await SubDesignation.findByPk(id);
//     if (!subDesignation) {
//       throw new Error('Sub-Designation not found');
//     }

//     return await subDesignation.update({
//       name: data.name ?? subDesignation.name,
//       code: data.code !== undefined ? data.code : subDesignation.code,
//       is_active: data.is_active ?? subDesignation.is_active,
//     });
//   }

//   public async deleteSubDesignation(id: number): Promise<void> {
//     const subDesignation = await SubDesignation.findByPk(id);
//     if (!subDesignation) {
//       throw new Error('Sub-Designation not found');
//     }

//     await subDesignation.destroy();
//   }
// }



// import { Op } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Designation, DesignationDepartment, SubDesignation } from '../../database/models/Designation';
// import { Department } from '../../database/models/Department';
// import { AppError } from '../../middleware/errorHandler.middleware';

// export interface CreateDesignationDto {
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   sub_designations?: { name: string; code?: string }[];
// }

// export interface UpdateDesignationDto {
//   name?: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   department_ids?: number[];
//   is_active?: boolean;
// }

// export interface DesignationQueryParams {
//   search?: string;
//   is_active?: string | boolean;
// }

// export interface SubDesignationQueryParams {
//   search?: string;
//   designation_id?: number;
//   is_active?: string | boolean;
// }

// export class DesignationService {
//   // ─── List Designations ────────────────────────────────────────────────────
//   async getAll(query: DesignationQueryParams = {}) {
//     const andConditions: any[] = [];

//     if (query.is_active === 'false' || query.is_active === false) {
//       andConditions.push({ is_active: false });
//     } else if (query.is_active !== 'all') {
//       andConditions.push({ is_active: true });
//     }

//     if (query.search) {
//       const searchClause = `%${query.search.trim()}%`;
//       andConditions.push({
//         [Op.or]: [
//           { name: { [Op.like]: searchClause } },
//           { code: { [Op.like]: searchClause } },
//         ],
//       });
//     }

//     const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

//     const designations = await Designation.findAll({
//       where,
//       include: [
//         {
//           model: DesignationDepartment,
//           as: 'department_mappings',
//           attributes: ['department_id'],
//           include: [
//             {
//               model: Department,
//               as: 'department',
//               attributes: ['id', 'department_name', 'department_code'],
//             },
//           ],
//         },
//         {
//           model: SubDesignation,
//           as: 'sub_designations',
//         },
//       ],
//       order: [['name', 'ASC']],
//     });

//     return designations.map((d) => {
//       const json = d.toJSON() as any;
//       const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
//       const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];

//       delete json.department_mappings;
//       return {
//         ...json,
//         department_ids: assignedDepartmentIds,
//         departments: assignedDepartments,
//       };
//     });
//   }

//   // ─── Get Single Designation ───────────────────────────────────────────────
//   async getById(id: number) {
//     const designation = await Designation.findByPk(id, {
//       include: [
//         {
//           model: DesignationDepartment,
//           as: 'department_mappings',
//           attributes: ['department_id'],
//           include: [
//             {
//               model: Department,
//               as: 'department',
//               attributes: ['id', 'department_name', 'department_code'],
//             },
//           ],
//         },
//         {
//           model: SubDesignation,
//           as: 'sub_designations',
//         },
//       ],
//     });

//     if (!designation) throw new AppError('Designation not found', 404);

//     const json = designation.toJSON() as any;
//     const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
//     const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];

//     delete json.department_mappings;
//     return {
//       ...json,
//       department_ids: assignedDepartmentIds,
//       departments: assignedDepartments,
//     };
//   }

//   // ─── Create Designation ───────────────────────────────────────────────────
//   async create(dto: CreateDesignationDto) {
//     const name = dto.name.trim();

//     const existing = await Designation.findOne({
//       where: { name, is_active: true },
//     });
//     if (existing) {
//       throw new AppError(`Designation "${name}" already exists.`, 409);
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const designation = await Designation.create(
//         {
//           name,
//           code: dto.code?.toUpperCase().trim() || null,
//           is_all_departments: Boolean(dto.is_all_departments),
//           is_active: true,
//         },
//         { transaction }
//       );

//       if (!dto.is_all_departments && dto.department_ids && dto.department_ids.length > 0) {
//         const deptMappings = dto.department_ids.map((deptId) => ({
//           designation_id: designation.id,
//           department_id: deptId,
//         }));
//         await DesignationDepartment.bulkCreate(deptMappings, { transaction });
//       }

//       if (dto.sub_designations && dto.sub_designations.length > 0) {
//         const subPayloads = dto.sub_designations.map((sub) => ({
//           designation_id: designation.id,
//           name: sub.name.trim(),
//           code: sub.code?.toUpperCase().trim() || null,
//         }));
//         await SubDesignation.bulkCreate(subPayloads, { transaction });
//       }

//       await transaction.commit();
//       return this.getById(designation.id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Update Designation ───────────────────────────────────────────────────
//   async update(id: number, dto: UpdateDesignationDto) {
//     const designation = await Designation.findByPk(id);
//     if (!designation) throw new AppError('Designation not found', 404);

//     if (dto.name && dto.name.trim() !== designation.name) {
//       const existing = await Designation.findOne({
//         where: {
//           name: dto.name.trim(),
//           id: { [Op.ne]: id },
//           is_active: true,
//         },
//       });
//       if (existing) {
//         throw new AppError(`Designation "${dto.name}" already exists.`, 409);
//       }
//     }

//     const transaction = await sequelize.transaction();

//     try {
//       const isAllDepts = dto.is_all_departments !== undefined
//         ? Boolean(dto.is_all_departments)
//         : designation.is_all_departments;

//       await designation.update(
//         {
//           name: dto.name?.trim() || designation.name,
//           code: dto.code !== undefined ? (dto.code?.toUpperCase().trim() || null) : designation.code,
//           is_all_departments: isAllDepts,
//           is_active: dto.is_active !== undefined ? dto.is_active : designation.is_active,
//         },
//         { transaction }
//       );

//       if (isAllDepts) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });
//       } else if (dto.department_ids !== undefined) {
//         await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });

//         if (dto.department_ids.length > 0) {
//           const deptMappings = dto.department_ids.map((dId) => ({
//             designation_id: id,
//             department_id: dId,
//           }));
//           await DesignationDepartment.bulkCreate(deptMappings, { transaction });
//         }
//       }

//       await transaction.commit();
//       return this.getById(id);
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ─── Delete Designation ───────────────────────────────────────────────────
//   async delete(id: number) {
//     const designation = await Designation.findByPk(id);
//     if (!designation) throw new AppError('Designation not found', 404);

//     const transaction = await sequelize.transaction();

//     try {
//       await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });
//       await SubDesignation.destroy({ where: { designation_id: id }, transaction });

//       await designation.update({ is_active: false }, { transaction });
//       await designation.destroy({ transaction });

//       await transaction.commit();
//     } catch (error) {
//       await transaction.rollback();
//       throw error;
//     }
//   }

//   // ==========================================
//   // SUB-DESIGNATION SPECIFIC METHODS
//   // ==========================================

//   async getAllSubDesignations(query: SubDesignationQueryParams = {}) {
//     const andConditions: any[] = [];

//     if (query.designation_id) {
//       andConditions.push({ designation_id: query.designation_id });
//     }

//     if (query.is_active === 'false' || query.is_active === false) {
//       andConditions.push({ is_active: false });
//     } else if (query.is_active !== 'all') {
//       andConditions.push({ is_active: true });
//     }

//     if (query.search) {
//       const searchClause = `%${query.search.trim()}%`;
//       andConditions.push({
//         [Op.or]: [
//           { name: { [Op.like]: searchClause } },
//           { code: { [Op.like]: searchClause } },
//         ],
//       });
//     }

//     const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

//     return await SubDesignation.findAll({
//       where,
//       include: [
//         {
//           model: Designation,
//           as: 'designation',
//           attributes: ['id', 'name', 'code'],
//         },
//       ],
//       order: [['name', 'ASC']],
//     });
//   }

//   async createSubDesignation(dto: { designation_id: number; name: string; code?: string | null }) {
//     const parent = await Designation.findByPk(dto.designation_id);
//     if (!parent) throw new AppError('Parent Designation not found', 404);

//     return await SubDesignation.create({
//       designation_id: dto.designation_id,
//       name: dto.name.trim(),
//       code: dto.code?.toUpperCase().trim() || null,
//       is_active: true,
//     });
//   }

//   async updateSubDesignation(id: number, dto: { name?: string; code?: string | null; is_active?: boolean }) {
//     const sub = await SubDesignation.findByPk(id);
//     if (!sub) throw new AppError('Sub-Designation not found', 404);

//     return await sub.update({
//       name: dto.name?.trim() || sub.name,
//       code: dto.code !== undefined ? (dto.code?.toUpperCase().trim() || null) : sub.code,
//       is_active: dto.is_active !== undefined ? dto.is_active : sub.is_active,
//     });
//   }

//   async deleteSubDesignation(id: number) {
//     const sub = await SubDesignation.findByPk(id);
//     if (!sub) throw new AppError('Sub-Designation not found', 404);

//     await sub.update({ is_active: false });
//     await sub.destroy();
//   }
// }




import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import {
  Designation,
  DesignationDepartment,
  SubDesignation,
  SubDesignationDesignation,
} from '../../database/models/Designation';
import { Department } from '../../database/models/Department';
import { AppError } from '../../middleware/errorHandler.middleware';

// ─── DTO Interfaces ─────────────────────────────────────────────────────────

export interface CreateDesignationDto {
  name: string;
  code?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  sub_designation_ids?: number[];
}

export interface UpdateDesignationDto {
  name?: string;
  code?: string | null;
  is_all_departments?: boolean;
  department_ids?: number[];
  is_active?: boolean;
}

export interface CreateSubDesignationDto {
  name: string;
  code?: string | null;
  is_all_designations?: boolean;
  designation_ids?: number[];
}

export interface UpdateSubDesignationDto {
  name?: string;
  code?: string | null;
  is_all_designations?: boolean;
  designation_ids?: number[];
  is_active?: boolean;
}

export interface DesignationQueryParams {
  search?: string;
  is_active?: string | boolean;
}

export interface SubDesignationQueryParams {
  search?: string;
  designation_id?: number;
  is_active?: string | boolean;
}

// ─── Service Implementation ──────────────────────────────────────────────────

export class DesignationService {

  // ─── 1. LIST DESIGNATIONS ─────────────────────────────────────────────────

  async getAll(query: DesignationQueryParams = {}) {
    const andConditions: any[] = [];

    if (query.is_active === 'false' || query.is_active === false) {
      andConditions.push({ is_active: false });
    } else if (query.is_active !== 'all') {
      andConditions.push({ is_active: true });
    }

    if (query.search) {
      const searchClause = `%${query.search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: searchClause } },
          { code: { [Op.like]: searchClause } },
        ],
      });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

    const designations = await Designation.findAll({
      where,
      include: [
        {
          model: DesignationDepartment,
          as: 'department_mappings',
          attributes: ['department_id'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'department_name', 'department_code'],
            },
          ],
        },
        {
          model: SubDesignationDesignation,
          as: 'sub_designation_mappings',
          attributes: ['sub_designation_id'],
          include: [
            {
              model: SubDesignation,
              as: 'sub_designation',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
      order: [['name', 'ASC']],
    });

    return designations.map((d) => {
      const json = d.toJSON() as any;
      const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
      const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];
      
      const assignedSubDesignations = json.sub_designation_mappings?.map((m: any) => m.sub_designation).filter(Boolean) || [];
      const assignedSubDesignationIds = json.sub_designation_mappings?.map((m: any) => m.sub_designation_id) || [];

      delete json.department_mappings;
      delete json.sub_designation_mappings;

      return {
        ...json,
        department_ids: assignedDepartmentIds,
        departments: assignedDepartments,
        sub_designation_ids: assignedSubDesignationIds,
        sub_designations: assignedSubDesignations,
      };
    });
  }

  // ─── 2. GET SINGLE DESIGNATION ─────────────────────────────────────────────

  async getById(id: number) {
    const designation = await Designation.findByPk(id, {
      include: [
        {
          model: DesignationDepartment,
          as: 'department_mappings',
          attributes: ['department_id'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'department_name', 'department_code'],
            },
          ],
        },
        {
          model: SubDesignationDesignation,
          as: 'sub_designation_mappings',
          attributes: ['sub_designation_id'],
          include: [
            {
              model: SubDesignation,
              as: 'sub_designation',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
    });

    if (!designation) throw new AppError('Designation not found', 404);

    const json = designation.toJSON() as any;
    const assignedDepartments = json.department_mappings?.map((m: any) => m.department).filter(Boolean) || [];
    const assignedDepartmentIds = json.department_mappings?.map((m: any) => m.department_id) || [];
    
    const assignedSubDesignations = json.sub_designation_mappings?.map((m: any) => m.sub_designation).filter(Boolean) || [];
    const assignedSubDesignationIds = json.sub_designation_mappings?.map((m: any) => m.sub_designation_id) || [];

    delete json.department_mappings;
    delete json.sub_designation_mappings;

    return {
      ...json,
      department_ids: assignedDepartmentIds,
      departments: assignedDepartments,
      sub_designation_ids: assignedSubDesignationIds,
      sub_designations: assignedSubDesignations,
    };
  }

  // ─── 3. CREATE DESIGNATION ─────────────────────────────────────────────────

  async create(dto: CreateDesignationDto) {
    const name = dto.name.trim();

    const existing = await Designation.findOne({
      where: { name, is_active: true },
    });
    if (existing) {
      throw new AppError(`Designation "${name}" already exists.`, 409);
    }

    const transaction = await sequelize.transaction();

    try {
      const designation = await Designation.create(
        {
          name,
          code: dto.code?.toUpperCase().trim() || null,
          is_all_departments: Boolean(dto.is_all_departments),
          is_active: true,
        },
        { transaction }
      );

      // Handle Department Junctions
      if (!dto.is_all_departments && Array.isArray(dto.department_ids) && dto.department_ids.length > 0) {
        const deptMappings = dto.department_ids.map((deptId) => ({
          designation_id: designation.id,
          department_id: deptId,
        }));
        await DesignationDepartment.bulkCreate(deptMappings, { transaction });
      }

      // Handle SubDesignation Junctions (if provided)
      if (Array.isArray(dto.sub_designation_ids) && dto.sub_designation_ids.length > 0) {
        const subMappings = dto.sub_designation_ids.map((subId) => ({
          designation_id: designation.id,
          sub_designation_id: subId,
        }));
        await SubDesignationDesignation.bulkCreate(subMappings, { transaction });
      }

      await transaction.commit();
      return this.getById(designation.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── 4. UPDATE DESIGNATION ─────────────────────────────────────────────────

  async update(id: number, dto: UpdateDesignationDto) {
    const designation = await Designation.findByPk(id);
    if (!designation) throw new AppError('Designation not found', 404);

    if (dto.name && dto.name.trim() !== designation.name) {
      const existing = await Designation.findOne({
        where: {
          name: dto.name.trim(),
          id: { [Op.ne]: id },
          is_active: true,
        },
      });
      if (existing) {
        throw new AppError(`Designation "${dto.name}" already exists.`, 409);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const isAllDepts = dto.is_all_departments !== undefined
        ? Boolean(dto.is_all_departments)
        : designation.is_all_departments;

      await designation.update(
        {
          name: dto.name?.trim() || designation.name,
          code: dto.code !== undefined ? (dto.code?.toUpperCase().trim() || null) : designation.code,
          is_all_departments: isAllDepts,
          is_active: dto.is_active !== undefined ? dto.is_active : designation.is_active,
        },
        { transaction }
      );

      // ── Department Junction Update ──
      // If "is_all_departments" is set to true, clear explicit mappings.
      // If "is_all_departments" is false, update/remove mapped departments.
      if (isAllDepts) {
        await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });
      } else if (dto.department_ids !== undefined) {
        await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });

        if (Array.isArray(dto.department_ids) && dto.department_ids.length > 0) {
          const deptMappings = dto.department_ids.map((dId) => ({
            designation_id: id,
            department_id: dId,
          }));
          await DesignationDepartment.bulkCreate(deptMappings, { transaction });
        }
      }

      await transaction.commit();
      return this.getById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── 5. DELETE DESIGNATION ─────────────────────────────────────────────────

  async delete(id: number) {
    const designation = await Designation.findByPk(id);
    if (!designation) throw new AppError('Designation not found', 404);

    const transaction = await sequelize.transaction();

    try {
      await DesignationDepartment.destroy({ where: { designation_id: id }, transaction });
      await SubDesignationDesignation.destroy({ where: { designation_id: id }, transaction });

      await designation.update({ is_active: false }, { transaction });
      await designation.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==========================================
  // SUB-DESIGNATION SPECIFIC METHODS
  // ==========================================

  // ─── 6. LIST SUB-DESIGNATIONS ──────────────────────────────────────────────

  async getAllSubDesignations(query: SubDesignationQueryParams = {}) {
    const andConditions: any[] = [];

    if (query.is_active === 'false' || query.is_active === false) {
      andConditions.push({ is_active: false });
    } else if (query.is_active !== 'all') {
      andConditions.push({ is_active: true });
    }

    if (query.search) {
      const searchClause = `%${query.search.trim()}%`;
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: searchClause } },
          { code: { [Op.like]: searchClause } },
        ],
      });
    }

    const where = andConditions.length > 0 ? { [Op.and]: andConditions } : {};

    const includeOptions: any[] = [
      {
        model: SubDesignationDesignation,
        as: 'designation_mappings',
        attributes: ['designation_id'],
        include: [
          {
            model: Designation,
            as: 'designation',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
    ];

    // Filter by single designation if query parameter is provided
    if (query.designation_id) {
      includeOptions[0].where = { designation_id: query.designation_id };
    }

    const subDesignations = await SubDesignation.findAll({
      where,
      include: includeOptions,
      order: [['name', 'ASC']],
    });

    return subDesignations.map((sub) => {
      const json = sub.toJSON() as any;
      const assignedDesignations = json.designation_mappings?.map((m: any) => m.designation).filter(Boolean) || [];
      const assignedDesignationIds = json.designation_mappings?.map((m: any) => m.designation_id) || [];

      delete json.designation_mappings;
      return {
        ...json,
        designation_ids: assignedDesignationIds,
        designations: assignedDesignations,
      };
    });
  }

  // ─── 7. CREATE SUB-DESIGNATION ─────────────────────────────────────────────

  async createSubDesignation(dto: CreateSubDesignationDto) {
    const name = dto.name.trim();

    const existing = await SubDesignation.findOne({
      where: { name, is_active: true },
    });
    if (existing) {
      throw new AppError(`Sub-Designation "${name}" already exists.`, 409);
    }

    const transaction = await sequelize.transaction();

    try {
      const subDesignation = await SubDesignation.create(
        {
          name,
          code: dto.code?.toUpperCase().trim() || null,
          is_all_designations: Boolean(dto.is_all_designations),
          is_active: true,
        },
        { transaction }
      );

      if (!dto.is_all_designations && Array.isArray(dto.designation_ids) && dto.designation_ids.length > 0) {
        const mappings = dto.designation_ids.map((desigId) => ({
          sub_designation_id: subDesignation.id,
          designation_id: desigId,
        }));
        await SubDesignationDesignation.bulkCreate(mappings, { transaction });
      }

      await transaction.commit();
      return this.getSubDesignationById(subDesignation.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── 8. GET SINGLE SUB-DESIGNATION ─────────────────────────────────────────

  async getSubDesignationById(id: number) {
    const sub = await SubDesignation.findByPk(id, {
      include: [
        {
          model: SubDesignationDesignation,
          as: 'designation_mappings',
          attributes: ['designation_id'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
    });

    if (!sub) throw new AppError('Sub-Designation not found', 404);

    const json = sub.toJSON() as any;
    const assignedDesignations = json.designation_mappings?.map((m: any) => m.designation).filter(Boolean) || [];
    const assignedDesignationIds = json.designation_mappings?.map((m: any) => m.designation_id) || [];

    delete json.designation_mappings;
    return {
      ...json,
      designation_ids: assignedDesignationIds,
      designations: assignedDesignations,
    };
  }

  // ─── 9. UPDATE SUB-DESIGNATION ─────────────────────────────────────────────

  async updateSubDesignation(id: number, dto: UpdateSubDesignationDto) {
    const sub = await SubDesignation.findByPk(id);
    if (!sub) throw new AppError('Sub-Designation not found', 404);

    if (dto.name && dto.name.trim() !== sub.name) {
      const existing = await SubDesignation.findOne({
        where: {
          name: dto.name.trim(),
          id: { [Op.ne]: id },
          is_active: true,
        },
      });
      if (existing) {
        throw new AppError(`Sub-Designation "${dto.name}" already exists.`, 409);
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const isAllDesigs = dto.is_all_designations !== undefined
        ? Boolean(dto.is_all_designations)
        : sub.is_all_designations;

      await sub.update(
        {
          name: dto.name?.trim() || sub.name,
          code: dto.code !== undefined ? (dto.code?.toUpperCase().trim() || null) : sub.code,
          is_all_designations: isAllDesigs,
          is_active: dto.is_active !== undefined ? dto.is_active : sub.is_active,
        },
        { transaction }
      );

      // ── Designation Junction Update ──
      // If "is_all_designations" is set to true, clear individual mappings.
      // If "is_all_designations" is false, update/remove linked designations.
      if (isAllDesigs) {
        await SubDesignationDesignation.destroy({ where: { sub_designation_id: id }, transaction });
      } else if (dto.designation_ids !== undefined) {
        await SubDesignationDesignation.destroy({ where: { sub_designation_id: id }, transaction });

        if (Array.isArray(dto.designation_ids) && dto.designation_ids.length > 0) {
          const mappings = dto.designation_ids.map((desigId) => ({
            sub_designation_id: id,
            designation_id: desigId,
          }));
          await SubDesignationDesignation.bulkCreate(mappings, { transaction });
        }
      }

      await transaction.commit();
      return this.getSubDesignationById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── 10. DELETE SUB-DESIGNATION ────────────────────────────────────────────

  async deleteSubDesignation(id: number) {
    const sub = await SubDesignation.findByPk(id);
    if (!sub) throw new AppError('Sub-Designation not found', 404);

    const transaction = await sequelize.transaction();

    try {
      await SubDesignationDesignation.destroy({ where: { sub_designation_id: id }, transaction });
      await sub.update({ is_active: false }, { transaction });
      await sub.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
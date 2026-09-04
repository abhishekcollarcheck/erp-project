// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface DesignationAttributes {
//   id: number;
//   designation_name: string;
//   is_active: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'is_active'> { }

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes {
//   public id!: number;
//   public designation_name!: string;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;

//   public created_at!: Date;
//   public updated_at!: Date;
//   public deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     designation_name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//     },
//     is_active: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//     },
//     created_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     updated_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',

//     timestamps: true,        // ✅ IMPORTANT
//     paranoid: true,

//     createdAt: 'created_at',
//     updatedAt: 'updated_at',
//     deletedAt: 'deleted_at',
//     indexes: [
//       {
//         unique: true,
//         fields: ['designation_name']
//       }
//     ]
//   }
// );





// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean; // true = assigned to all departments
//   is_active?: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//     created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//   },
//   { sequelize, tableName: 'designations', modelName: 'Designation', paranoid: true, underscored: true }
// );

// // Junction table for specific department assignments when is_all_departments is false
// export class DesignationDepartment extends Model {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   { sequelize, tableName: 'designation_departments', modelName: 'DesignationDepartment', underscored: true }
// );



// interface SubDesignationAttributes {
//   id: number;
//   designation_id: number;
//   name: string;
//   code?: string | null;
//   is_active?: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//     created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//   },
//   { sequelize, tableName: 'sub_designations', modelName: 'SubDesignation', paranoid: true, underscored: true }
// );




// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Department } from './Department';

// // ==========================================
// // DESIGNATION MODEL
// // ==========================================
// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // DESIGNATION DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface DesignationDepartmentAttributes {
//   id: number;
//   designation_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface DesignationDepartmentCreationAttributes
//   extends Optional<DesignationDepartmentAttributes, 'id'> {}

// export class DesignationDepartment
//   extends Model<DesignationDepartmentAttributes, DesignationDepartmentCreationAttributes>
//   implements DesignationDepartmentAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designation_departments',
//     modelName: 'DesignationDepartment',
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['designation_id', 'department_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // SUB-DESIGNATION MODEL
// // ==========================================
// interface SubDesignationAttributes {
//   id: number;
//   designation_id: number;
//   name: string;
//   code?: string | null;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designations',
//     modelName: 'SubDesignation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // SEQUELIZE ASSOCIATIONS
// // ==========================================
// Designation.hasMany(DesignationDepartment, {
//   foreignKey: 'designation_id',
//   as: 'department_mappings',
// });
// DesignationDepartment.belongsTo(Designation, { foreignKey: 'designation_id' });

// DesignationDepartment.belongsTo(Department, {
//   foreignKey: 'department_id',
//   as: 'department',
// });

// Designation.hasMany(SubDesignation, {
//   foreignKey: 'designation_id',
//   as: 'sub_designations',
// });
// SubDesignation.belongsTo(Designation, {
//   foreignKey: 'designation_id',
//   as: 'designation',
// });\








// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';
// import { Department } from './Department';

// // ==========================================
// // 1. DESIGNATION MODEL
// // ==========================================
// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 2. DESIGNATION DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface DesignationDepartmentAttributes {
//   id: number;
//   designation_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface DesignationDepartmentCreationAttributes
//   extends Optional<DesignationDepartmentAttributes, 'id'> {}

// export class DesignationDepartment
//   extends Model<DesignationDepartmentAttributes, DesignationDepartmentCreationAttributes>
//   implements DesignationDepartmentAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designation_departments',
//     modelName: 'DesignationDepartment',
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['designation_id', 'department_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // 3. SUB-DESIGNATION MODEL
// // ==========================================
// interface SubDesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_all_designations' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_designations!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_designations: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designations',
//     modelName: 'SubDesignation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 4. SUB-DESIGNATION DESIGNATION (JUNCTION MODEL)
// // ==========================================
// interface SubDesignationDesignationAttributes {
//   id: number;
//   sub_designation_id: number;
//   designation_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface SubDesignationDesignationCreationAttributes
//   extends Optional<SubDesignationDesignationAttributes, 'id'> {}

// export class SubDesignationDesignation
//   extends Model<SubDesignationDesignationAttributes, SubDesignationDesignationCreationAttributes>
//   implements SubDesignationDesignationAttributes
// {
//   public id!: number;
//   public sub_designation_id!: number;
//   public designation_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// SubDesignationDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     sub_designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designation_designations',
//     modelName: 'SubDesignationDesignation',
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['sub_designation_id', 'designation_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // SEQUELIZE ASSOCIATIONS
// // ==========================================

// // Designation <-> Department Junction
// Designation.hasMany(DesignationDepartment, {
//   foreignKey: 'designation_id',
//   as: 'department_mappings',
// });
// DesignationDepartment.belongsTo(Designation, { foreignKey: 'designation_id' });

// DesignationDepartment.belongsTo(Department, {
//   foreignKey: 'department_id',
//   as: 'department',
// });

// // SubDesignation <-> Designation Junction
// SubDesignation.hasMany(SubDesignationDesignation, {
//   foreignKey: 'sub_designation_id',
//   as: 'designation_mappings',
// });
// SubDesignationDesignation.belongsTo(SubDesignation, { foreignKey: 'sub_designation_id' });

// SubDesignationDesignation.belongsTo(Designation, {
//   foreignKey: 'designation_id',
//   as: 'designation',
// });

// // Direct BelongsToMany shortcuts (Optional for convenience queries)
// Designation.belongsToMany(Department, {
//   through: DesignationDepartment,
//   foreignKey: 'designation_id',
//   otherKey: 'department_id',
//   as: 'departments',
// });

// SubDesignation.belongsToMany(Designation, {
//   through: SubDesignationDesignation,
//   foreignKey: 'sub_designation_id',
//   otherKey: 'designation_id',
//   as: 'designations',
// });



// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// // ==========================================
// // 1. DESIGNATION MODEL
// // ==========================================
// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 2. DESIGNATION DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface DesignationDepartmentAttributes {
//   id: number;
//   designation_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface DesignationDepartmentCreationAttributes
//   extends Optional<DesignationDepartmentAttributes, 'id'> {}

// export class DesignationDepartment
//   extends Model<DesignationDepartmentAttributes, DesignationDepartmentCreationAttributes>
//   implements DesignationDepartmentAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designation_departments',
//     modelName: 'DesignationDepartment',
//     underscored: true,
//     indexes: [
//       {
//         // designation_name is intentionally globally unique across ALL companies,
//         // not per-company scoped — confirmed decision, same pattern as
//         // employees.employee_code/email/phone. No company_id column exists here
//         // by design. Do not treat the absence of company_id as a bug.
//         unique: true,
//         fields: ['designation_id', 'department_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // 3. SUB-DESIGNATION MODEL
// // ==========================================
// interface SubDesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_all_designations' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_designations!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_designations: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designations',
//     modelName: 'SubDesignation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 4. SUB-DESIGNATION DESIGNATION (JUNCTION MODEL)
// // ==========================================
// interface SubDesignationDesignationAttributes {
//   id: number;
//   sub_designation_id: number;
//   designation_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface SubDesignationDesignationCreationAttributes
//   extends Optional<SubDesignationDesignationAttributes, 'id'> {}

// export class SubDesignationDesignation
//   extends Model<SubDesignationDesignationAttributes, SubDesignationDesignationCreationAttributes>
//   implements SubDesignationDesignationAttributes
// {
//   public id!: number;
//   public sub_designation_id!: number;
//   public designation_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// SubDesignationDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     sub_designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designation_designations',
//     modelName: 'SubDesignationDesignation',
//     underscored: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['sub_designation_id', 'designation_id'],
//       },
//     ],
//   }
// );



// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// // ==========================================
// // 1. DESIGNATION MODEL
// // ==========================================
// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 2. DESIGNATION DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface DesignationDepartmentAttributes {
//   id: number;
//   designation_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface DesignationDepartmentCreationAttributes
//   extends Optional<DesignationDepartmentAttributes, 'id'> {}

// export class DesignationDepartment
//   extends Model<DesignationDepartmentAttributes, DesignationDepartmentCreationAttributes>
//   implements DesignationDepartmentAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designation_departments',
//     modelName: 'DesignationDepartment',
//     underscored: true,
//     indexes: [
//       {
//         name: 'uniq_desig_dept', // Explicit short name (< 64 chars)
//         unique: true,
//         fields: ['designation_id', 'department_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // 3. SUB-DESIGNATION MODEL
// // ==========================================
// interface SubDesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_all_designations' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_designations!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_designations: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designations',
//     modelName: 'SubDesignation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 4. SUB-DESIGNATION DESIGNATION (JUNCTION MODEL)
// // ==========================================
// interface SubDesignationDesignationAttributes {
//   id: number;
//   sub_designation_id: number;
//   designation_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface SubDesignationDesignationCreationAttributes
//   extends Optional<SubDesignationDesignationAttributes, 'id'> {}

// export class SubDesignationDesignation
//   extends Model<SubDesignationDesignationAttributes, SubDesignationDesignationCreationAttributes>
//   implements SubDesignationDesignationAttributes
// {
//   public id!: number;
//   public sub_designation_id!: number;
//   public designation_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// SubDesignationDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     sub_designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designation_designations',
//     modelName: 'SubDesignationDesignation',
//     underscored: true,
//     indexes: [
//       {
//         name: 'uniq_subdesig_desig', // Explicit short name (< 64 chars)
//         unique: true,
//         fields: ['sub_designation_id', 'designation_id'],
//       },
//     ],
//   }
// );









// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// // ==========================================
// // 1. DESIGNATION MODEL
// // ==========================================
// interface DesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_departments?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DesignationCreationAttributes
//   extends Optional<DesignationAttributes, 'id' | 'code' | 'is_all_departments' | 'is_active'> {}

// export class Designation
//   extends Model<DesignationAttributes, DesignationCreationAttributes>
//   implements DesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Designation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_departments: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'designations',
//     modelName: 'Designation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 2. DESIGNATION DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface DesignationDepartmentAttributes {
//   id: number;
//   designation_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface DesignationDepartmentCreationAttributes
//   extends Optional<DesignationDepartmentAttributes, 'id'> {}

// export class DesignationDepartment
//   extends Model<DesignationDepartmentAttributes, DesignationDepartmentCreationAttributes>
//   implements DesignationDepartmentAttributes
// {
//   public id!: number;
//   public designation_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// DesignationDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: false },
//   },
//   {
//     sequelize,
//     tableName: 'designation_departments',
//     modelName: 'DesignationDepartment',
//     underscored: true,
//     indexes: [
//       {
//         name: 'uniq_desig_dept',
//         unique: true,
//         fields: ['designation_id', 'department_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // 3. SUB-DESIGNATION MODEL
// // ==========================================
// interface SubDesignationAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   is_all_designations?: boolean;
//   is_active?: boolean;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDesignationCreationAttributes
//   extends Optional<SubDesignationAttributes, 'id' | 'code' | 'is_all_designations' | 'is_active'> {}

// export class SubDesignation
//   extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
//   implements SubDesignationAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public is_all_designations!: boolean;
//   public is_active!: boolean;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     code: { type: DataTypes.STRING(20), allowNull: true },
//     is_all_designations: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designations',
//     modelName: 'SubDesignation',
//     paranoid: true,
//     underscored: true,
//   }
// );

// // ==========================================
// // 4. SUB-DESIGNATION DESIGNATION (JUNCTION MODEL)
// // ==========================================
// interface SubDesignationDesignationAttributes {
//   id: number;
//   sub_designation_id: number;
//   designation_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface SubDesignationDesignationCreationAttributes
//   extends Optional<SubDesignationDesignationAttributes, 'id'> {}

// export class SubDesignationDesignation
//   extends Model<SubDesignationDesignationAttributes, SubDesignationDesignationCreationAttributes>
//   implements SubDesignationDesignationAttributes
// {
//   public id!: number;
//   public sub_designation_id!: number;
//   public designation_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// SubDesignationDesignation.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     sub_designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: false },
//     designation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_designation_designations',
//     modelName: 'SubDesignationDesignation',
//     underscored: true,
//     indexes: [
//       {
//         name: 'uniq_subdesig_desig',
//         unique: true,
//         fields: ['sub_designation_id', 'designation_id'],
//       },
//     ],
//   }
// );


import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
// ==========================================
// 1. DESIGNATION MODEL
// ==========================================

interface DesignationAttributes {
  id: number;
  name: string;
  code?: string | null;
  is_all_departments?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface DesignationCreationAttributes
  extends Optional<
    DesignationAttributes,
    'id' | 'code' | 'is_all_departments' | 'is_active'
  > {}

export class Designation
  extends Model<DesignationAttributes, DesignationCreationAttributes>
  implements DesignationAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public is_all_departments!: boolean;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

Designation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    is_all_departments: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'designations',
    modelName: 'Designation',
    paranoid: true,
    underscored: true,
  }
);

// ==========================================
// 2. DESIGNATION DEPARTMENT
// ==========================================

interface DesignationDepartmentAttributes {
  id: number;
  designation_id: number;
  department_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface DesignationDepartmentCreationAttributes
  extends Optional<DesignationDepartmentAttributes, 'id'> {}

export class DesignationDepartment
  extends Model<
    DesignationDepartmentAttributes,
    DesignationDepartmentCreationAttributes
  >
  implements DesignationDepartmentAttributes
{
  public id!: number;
  public designation_id!: number;
  public department_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

DesignationDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    designation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'designation_departments',
    modelName: 'DesignationDepartment',
    underscored: true,

    indexes: [
      {
        name: 'uniq_desig_dept',
        unique: true,
        fields: ['designation_id', 'department_id'],
      },
    ],
  }
);

// ==========================================
// 3. SUB-DESIGNATION MODEL
// ==========================================

interface SubDesignationAttributes {
  id: number;
  name: string;
  code?: string | null;
  is_all_designations?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface SubDesignationCreationAttributes
  extends Optional<
    SubDesignationAttributes,
    'id' | 'code' | 'is_all_designations' | 'is_active'
  > {}

export class SubDesignation
  extends Model<
    SubDesignationAttributes,
    SubDesignationCreationAttributes
  >
  implements SubDesignationAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public is_all_designations!: boolean;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

SubDesignation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    is_all_designations: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sub_designations',
    modelName: 'SubDesignation',
    paranoid: true,
    underscored: true,
  }
);

// ==========================================
// 4. SUB-DESIGNATION DESIGNATION
// ==========================================

interface SubDesignationDesignationAttributes {
  id: number;
  sub_designation_id: number;
  designation_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface SubDesignationDesignationCreationAttributes
  extends Optional<SubDesignationDesignationAttributes, 'id'> {}

export class SubDesignationDesignation
  extends Model<
    SubDesignationDesignationAttributes,
    SubDesignationDesignationCreationAttributes
  >
  implements SubDesignationDesignationAttributes
{
  public id!: number;
  public sub_designation_id!: number;
  public designation_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SubDesignationDesignation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    sub_designation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    designation_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'sub_designation_designations',
    modelName: 'SubDesignationDesignation',
    underscored: true,

    indexes: [
      {
        name: 'uniq_subdesig_desig',
        unique: true,
        fields: ['sub_designation_id', 'designation_id'],
      },
    ],
  }
);
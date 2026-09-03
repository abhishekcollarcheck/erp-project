// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface DepartmentAttributes {
//   id: number;
//   department_name: string;
//   department_code?: string | null;
//   head_id: number | null;
//   is_active: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
// }

// interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'is_active'> { }

// export class Department
//   extends Model<DepartmentAttributes, DepartmentCreationAttributes>
//   implements DepartmentAttributes {
//   public id!: number;
//   public department_name!: string;
//   public department_code!: string | null;
//   public head_id!: number | null;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Department.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     department_name: { type: DataTypes.STRING(200), allowNull: false },
//     department_code: { type: DataTypes.STRING(20), allowNull: true },
//     head_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
//     created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//   },
//   {
//     sequelize,
//     tableName: 'departments',
//     modelName: 'Department',
//     paranoid: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['department_name']
//       },
//     ]
//   },
// );


// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface DepartmentAttributes {
//   id: number;
//   company_id: number;
//   name: string;
//   // code?: string | null;
//   // parent_id?: number | null;
//   is_active: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   head_id: number | null;
// }

// interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'is_active'> { }

// export class Department
//   extends Model<DepartmentAttributes, DepartmentCreationAttributes>
//   implements DepartmentAttributes {
//   public id!: number;
//   public company_id!: number;
//   public name!: string;
//   // public code!: string | null;
//   // public parent_id!: number | null;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
//   public head_id!: number | null;
// }

// Department.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     // code: { type: DataTypes.STRING(20), allowNull: true },
//     // parent_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
//     created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     head_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//   },
//   {
//     sequelize,
//     tableName: 'departments',
//     modelName: 'Department',
//     paranoid: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['company_id', 'name']
//       },
//     ]
//   },
// );







































// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface DepartmentAttributes {
//   id: number;
//   company_id?: number | null;
//   department_name: string;
//   department_code?: string | null;
//   is_active?: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   head_id?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface DepartmentCreationAttributes
//   extends Optional<
//     DepartmentAttributes,
//     'id' | 'company_id' | 'department_code' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by' | 'head_id'
//   > {}

// export class Department
//   extends Model<DepartmentAttributes, DepartmentCreationAttributes>
//   implements DepartmentAttributes
// {
//   public id!: number;
//   public company_id!: number | null;
//   public department_name!: string;
//   public department_code!: string | null;

//   public is_active!: boolean;

//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;

//   public head_id!: number | null;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// Department.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },

//     company_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },

//     department_name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//     },

//     department_code: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
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

//     deleted_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },

//     head_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: 'departments',
//     modelName: 'Department',
//     paranoid: true,
//     underscored: true, // Maps createdAt -> created_at, etc.
//     indexes: [
//       {
//         unique: true,
//         fields: ['company_id', 'department_name'],
//       },
//     ],
//   },
// );












import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface DepartmentAttributes {
  id: number;
  department_name: string;
  department_code?: string | null;
  is_all_companies?: boolean;
  is_active?: boolean;
  head_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface DepartmentCreationAttributes
  extends Optional<
    DepartmentAttributes,
    'id' | 'department_code' | 'is_all_companies' | 'is_active' | 'head_id' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public id!: number;
  public department_name!: string;
  public department_code!: string | null;
  public is_all_companies!: boolean;
  public is_active!: boolean;
  public head_id!: number | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    department_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    department_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is_all_companies: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    head_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'departments',
    modelName: 'Department',
    paranoid: true,
    underscored: true,
  }
);

interface CompanyDepartmentAttributes {
  id: number;
  department_id: number;
  company_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface CompanyDepartmentCreationAttributes
  extends Optional<CompanyDepartmentAttributes, 'id'> {}

export class CompanyDepartment
  extends Model<CompanyDepartmentAttributes, CompanyDepartmentCreationAttributes>
  implements CompanyDepartmentAttributes
{
  public id!: number;
  public department_id!: number;
  public company_id!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CompanyDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'company_departments',
    modelName: 'CompanyDepartment',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['department_id', 'company_id'],
      },
    ],
  }
);
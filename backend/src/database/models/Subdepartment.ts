// import { DataTypes, Model, Optional } from "sequelize";
// import { sequelize } from '../../config/database';

// interface SubDepartmentAttributes {
//   id: number;
//   name: string;
//   is_active: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
// }

// interface SubDepartmentCreationAttributes extends Optional<SubDepartmentAttributes, 'id' | 'is_active'> { }

// export class SubDepartment
//   extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
//   implements SubDepartmentAttributes {
//   public id!: number;
//   public name!: string;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;
//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     name: { type: DataTypes.STRING(200), allowNull: false },
//     is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
//     created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     updated_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//     deleted_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
//   },
//   {
//     sequelize,
//     tableName: 'sub_departments',
//     modelName: 'SubDepartment',
//     paranoid: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['name']
//       },
//       {
//         fields: ['is_active']
//       },
//     ]
//   },
// );



// import { DataTypes, Model, Optional } from "sequelize";
// import { sequelize } from '../../config/database';

// interface SubDepartmentAttributes {
//   id: number;
//   department_id: number;
//   name: string;
//   is_active: boolean;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
// }

// interface SubDepartmentCreationAttributes
//   extends Optional<SubDepartmentAttributes, 'id' | 'is_active'> {}

// export class SubDepartment
//   extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
//   implements SubDepartmentAttributes
// {
//   public id!: number;
//   public department_id!: number;
//   public name!: string;
//   public is_active!: boolean;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDepartment.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     department_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: false,
//     },
//     name: {
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
//     deleted_by: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: 'sub_departments',
//     modelName: 'SubDepartment',
//     paranoid: true,

//     indexes: [
//       {
//         unique: true,
//         fields: ['department_id', 'name'],
//       },
//       {
//         fields: ['department_id'],
//       },
//       {
//         fields: ['is_active'],
//       },
//     ],
//   },
// );


// import { DataTypes, Model, Optional } from "sequelize";
// import { sequelize } from '../../config/database';

// interface SubDepartmentAttributes {
//   id: number;
//   department_id?: number | null;
//   name: string;
//   code?: string | null;
//   description?: string | null;
//   is_active: boolean;
//   head_id?: number | null;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
// }

// interface SubDepartmentCreationAttributes
//   extends Optional<
//     SubDepartmentAttributes,
//     | 'id'
//     | 'department_id'
//     | 'code'
//     | 'description'
//     | 'is_active'
//     | 'head_id'
//     | 'created_by'
//     | 'updated_by'
//     | 'deleted_by'
//   > {}

// export class SubDepartment
//   extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
//   implements SubDepartmentAttributes
// {
//   public id!: number;
//   public department_id!: number | null;
//   public name!: string;
//   public code!: string | null;
//   public description!: string | null;
//   public is_active!: boolean;
//   public head_id!: number | null;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDepartment.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     department_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//       unique: true,
//     },
//     code: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     is_active: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//       allowNull: true,
//     },
//     head_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
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
//   },
//   {
//     sequelize,
//     tableName: 'sub_departments',
//     modelName: 'SubDepartment',
//     paranoid: true,
//     underscored: true, // Ensures created_at, updated_at, deleted_at map to SQL snake_case

//     indexes: [
//       {
//         fields: ['department_id'],
//       },
//       {
//         fields: ['is_active'],
//       },
//       {
//         fields: ['head_id'],
//       },
//     ],
//   },
// );



// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// interface SubDepartmentAttributes {
//   id: number;
//   department_id?: number | null;
//   name: string;
//   code?: string | null;
//   description?: string | null;
//   is_active: boolean;
//   head_id?: number | null;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDepartmentCreationAttributes
//   extends Optional<
//     SubDepartmentAttributes,
//     | 'id'
//     | 'department_id'
//     | 'code'
//     | 'description'
//     | 'is_active'
//     | 'head_id'
//     | 'created_by'
//     | 'updated_by'
//     | 'deleted_by'
//   > {}

// export class SubDepartment
//   extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
//   implements SubDepartmentAttributes
// {
//   public id!: number;
//   public department_id!: number | null;
//   public name!: string;
//   public code!: string | null;
//   public description!: string | null;
//   public is_active!: boolean;
//   public head_id!: number | null;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDepartment.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     department_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
//     },
//     name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//     },
//     code: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     is_active: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//       allowNull: false,
//     },
//     head_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
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
//   },
//   {
//     sequelize,
//     tableName: 'sub_departments',
//     modelName: 'SubDepartment',
//     paranoid: true,
//     underscored: true,
//     indexes: [
//       {
//         // Ensures sub-department names are unique PER department, including soft deletes
//         unique: true,
//         fields: ['department_id', 'name', 'deleted_at'],
//       },
//       {
//         fields: ['department_id'],
//       },
//       {
//         fields: ['is_active'],
//       },
//       {
//         fields: ['head_id'],
//       },
//     ],
//   }
// );










// import { DataTypes, Model, Optional } from 'sequelize';
// import { sequelize } from '../../config/database';

// // ==========================================
// // 1. SUB-DEPARTMENT MODEL
// // ==========================================
// interface SubDepartmentAttributes {
//   id: number;
//   name: string;
//   code?: string | null;
//   description?: string | null;
//   is_all_departments?: boolean;
//   is_active: boolean;
//   head_id?: number | null;
//   created_by?: number | null;
//   updated_by?: number | null;
//   deleted_by?: number | null;
//   created_at?: Date;
//   updated_at?: Date;
//   deleted_at?: Date | null;
// }

// interface SubDepartmentCreationAttributes
//   extends Optional<
//     SubDepartmentAttributes,
//     | 'id'
//     | 'code'
//     | 'description'
//     | 'is_all_departments'
//     | 'is_active'
//     | 'head_id'
//     | 'created_by'
//     | 'updated_by'
//     | 'deleted_by'
//   > {}

// export class SubDepartment
//   extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
//   implements SubDepartmentAttributes
// {
//   public id!: number;
//   public name!: string;
//   public code!: string | null;
//   public description!: string | null;
//   public is_all_departments!: boolean;
//   public is_active!: boolean;
//   public head_id!: number | null;
//   public created_by!: number | null;
//   public updated_by!: number | null;
//   public deleted_by!: number | null;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
//   public readonly deleted_at!: Date | null;
// }

// SubDepartment.init(
//   {
//     id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     name: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//     },
//     code: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     is_all_departments: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//       allowNull: false,
//     },
//     is_active: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//       allowNull: false,
//     },
//     head_id: {
//       type: DataTypes.INTEGER.UNSIGNED,
//       allowNull: true,
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
//   },
//   {
//     sequelize,
//     tableName: 'sub_departments',
//     modelName: 'SubDepartment',
//     paranoid: true,
//     underscored: true,
//     indexes: [
//       {
//         // Sub-department names unique among active rows (no longer scoped
//         // to a single parent department, since a sub-department can now
//         // belong to many departments via the junction table below).
//         unique: true,
//         fields: ['name', 'is_active'],
//       },
//       {
//         fields: ['is_active'],
//       },
//       {
//         fields: ['head_id'],
//       },
//     ],
//   }
// );

// // ==========================================
// // 2. SUB-DEPARTMENT DEPARTMENT (JUNCTION MODEL)
// // ==========================================
// interface SubDepartmentDepartmentAttributes {
//   id: number;
//   sub_department_id: number;
//   department_id: number;
//   created_at?: Date;
//   updated_at?: Date;
// }

// interface SubDepartmentDepartmentCreationAttributes
//   extends Optional<SubDepartmentDepartmentAttributes, 'id'> {}

// export class SubDepartmentDepartment
//   extends Model<SubDepartmentDepartmentAttributes, SubDepartmentDepartmentCreationAttributes>
//   implements SubDepartmentDepartmentAttributes
// {
//   public id!: number;
//   public sub_department_id!: number;
//   public department_id!: number;

//   public readonly created_at!: Date;
//   public readonly updated_at!: Date;
// }

// SubDepartmentDepartment.init(
//   {
//     id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
//     sub_department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//     department_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
//   },
//   {
//     sequelize,
//     tableName: 'sub_department_departments',
//     modelName: 'SubDepartmentDepartment',
//     underscored: true,
//     indexes: [
//       {
//         // name is intentionally globally unique across ALL companies, not
//         // per-company scoped — confirmed decision, same pattern as
//         // employees.employee_code/email/phone. No company_id column exists
//         // here by design. Do not treat the absence of company_id as a bug.
//         unique: true,
//         fields: ['sub_department_id', 'department_id'],
//       },
//     ],
//   }
// );





import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// ==========================================
// 1. SUB-DEPARTMENT MODEL
// ==========================================

interface SubDepartmentAttributes {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  is_all_departments?: boolean;
  is_active: boolean;
  head_id?: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface SubDepartmentCreationAttributes
  extends Optional<
    SubDepartmentAttributes,
    | 'id'
    | 'code'
    | 'description'
    | 'is_all_departments'
    | 'is_active'
    | 'head_id'
    | 'created_by'
    | 'updated_by'
    | 'deleted_by'
  > {}

export class SubDepartment
  extends Model<SubDepartmentAttributes, SubDepartmentCreationAttributes>
  implements SubDepartmentAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public description!: string | null;
  public is_all_departments!: boolean;
  public is_active!: boolean;
  public head_id!: number | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

SubDepartment.init(
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

    description: {
      type: DataTypes.TEXT,
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
    tableName: 'sub_departments',
    modelName: 'SubDepartment',
    paranoid: true,
    underscored: true,

    indexes: [
      {
        // Explicit short name to avoid MySQL's 64-character
        // identifier limit.
        unique: true,
        name: 'uniq_subdept_name_active',
        fields: ['name', 'is_active'],
      },
      {
        name: 'idx_subdept_active',
        fields: ['is_active'],
      },
      {
        name: 'idx_subdept_head',
        fields: ['head_id'],
      },
    ],
  }
);

// ==========================================
// 2. SUB-DEPARTMENT DEPARTMENT
//    JUNCTION MODEL
// ==========================================

interface SubDepartmentDepartmentAttributes {
  id: number;
  sub_department_id: number;
  department_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface SubDepartmentDepartmentCreationAttributes
  extends Optional<SubDepartmentDepartmentAttributes, 'id'> {}

export class SubDepartmentDepartment
  extends Model<
    SubDepartmentDepartmentAttributes,
    SubDepartmentDepartmentCreationAttributes
  >
  implements SubDepartmentDepartmentAttributes
{
  public id!: number;
  public sub_department_id!: number;
  public department_id!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SubDepartmentDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    sub_department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'sub_departments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },

    department_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'sub_department_departments',
    modelName: 'SubDepartmentDepartment',
    underscored: true,

    indexes: [
      {
        // Explicit short name.
        // Prevents Sequelize/MySQL from generating:
        // sub_department_departments_department_id_sub_department_id_unique
        name: 'uniq_subdept_dept',
        unique: true,
        fields: ['sub_department_id', 'department_id'],
      },
      {
        name: 'idx_subdept_dept_sub',
        fields: ['sub_department_id'],
      },
      {
        name: 'idx_subdept_dept_dept',
        fields: ['department_id'],
      },
    ],
  }
);
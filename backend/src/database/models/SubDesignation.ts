import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface SubDesignationAttributes {
  id: number;
  name: string;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface SubDesignationCreationAttributes
  extends Optional<SubDesignationAttributes, 'id' | 'is_active'> { }

export class SubDesignation
  extends Model<SubDesignationAttributes, SubDesignationCreationAttributes>
  implements SubDesignationAttributes {
  public id!: number;
  public name!: string;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;

  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
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

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sub_designations',
    modelName: 'SubDesignation',

    timestamps: true, 
    paranoid: true,

    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        // name is intentionally globally unique across ALL companies, not
        // per-company scoped — confirmed decision, same pattern as
        // employees.employee_code/email/phone. No company_id column exists
        // here by design. Do not treat the absence of company_id as a bug.
        unique: true,
        fields: ['name']
      }
    ]
  }
);
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export interface CandidateEmploymentAttributes {
  id: number;
  candidate_id: number;
  company: string;
  designation?: string | null;
  joining_date?: Date | null;
  leaving_date?: Date | null;
  currently_working: boolean;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

type CandidateEmploymentCreationAttributes = Optional<
  CandidateEmploymentAttributes,
  'id' | 'currently_working' | 'sort_order'
>;

export class CandidateEmployment
  extends Model<CandidateEmploymentAttributes, CandidateEmploymentCreationAttributes>
  implements CandidateEmploymentAttributes {
  public id!: number;
  public candidate_id!: number;
  public company!: string;
  public designation!: string | null;
  public joining_date!: Date | null;
  public leaving_date!: Date | null;
  public currently_working!: boolean;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CandidateEmployment.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    candidate_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    company: { type: DataTypes.STRING(200), allowNull: false },
    designation: { type: DataTypes.STRING(200), allowNull: true },
    joining_date: { type: DataTypes.DATEONLY, allowNull: true },
    leaving_date: { type: DataTypes.DATEONLY, allowNull: true },
    currently_working: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'candidate_employments',
    modelName: 'CandidateEmployment',
    underscored: true,
    indexes: [
      { fields: ['candidate_id'] },
    ],
  },
);
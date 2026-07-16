import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

export type RegularizationStatus = 'Pending' | 'Approved' | 'Rejected';

interface RegularizationAttributes {
  id: number;
  company_id: number;
  employee_id: number;
  date: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  reason: string;
  status: RegularizationStatus;
  reviewed_by?: number | null;
  reviewed_at?: Date | null;
  review_remarks?: string | null;
  created_by: number;
}

interface RegularizationCreationAttributes
  extends Optional<RegularizationAttributes, 'id' | 'status' | 'reviewed_by' | 'reviewed_at' | 'review_remarks'> {}

export class AttendanceRegularization
  extends Model<RegularizationAttributes, RegularizationCreationAttributes>
  implements RegularizationAttributes
{
  public id!: number;
  public company_id!: number;
  public employee_id!: number;
  public date!: string;
  public requested_check_in!: string | null;
  public requested_check_out!: string | null;
  public reason!: string;
  public status!: RegularizationStatus;
  public reviewed_by!: number | null;
  public reviewed_at!: Date | null;
  public review_remarks!: string | null;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AttendanceRegularization.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    employee_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    requested_check_in: { type: DataTypes.TIME, allowNull: true },
    requested_check_out: { type: DataTypes.TIME, allowNull: true },
    reason: { type: DataTypes.STRING(500), allowNull: false },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending',
    },
    reviewed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
    review_remarks: { type: DataTypes.STRING(500), allowNull: true },
    created_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    sequelize,
    tableName: 'attendance_regularizations',
    modelName: 'AttendanceRegularization',
    indexes: [
      { fields: ['company_id', 'employee_id', 'date'] },
      { fields: ['company_id', 'status'] }, // fast "pending approvals" queries
    ],
  },
);
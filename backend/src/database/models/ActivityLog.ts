import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// MariaDB stores DataTypes.JSON as LONGTEXT and doesn't parse it on read.
const jsonGet = (field: string) =>
  function (this: Model): unknown {
    const raw = this.getDataValue(field as never);
    if (typeof raw !== 'string') return raw;
    try { return JSON.parse(raw); } catch { return raw; }
  };

interface ActivityLogAttributes {
  id: number;
  company_id: number | null;
  employee_id?: number | null;
  action: string;
  module?: string | null;
  entity_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

type ActivityLogCreationAttributes = Optional<ActivityLogAttributes, 'id'>;

export class ActivityLog
  extends Model<ActivityLogAttributes, ActivityLogCreationAttributes>
  implements ActivityLogAttributes
{
  public id!: number;
  public company_id!: number | null;
  public employee_id!: number | null;
  public action!: string;
  public module!: string | null;
  public entity_id!: number | null;
  public old_values!: Record<string, unknown> | null;
  public new_values!: Record<string, unknown> | null;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public readonly created_at!: Date;
}

ActivityLog.init(
  {
    id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    employee_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    action:     { type: DataTypes.STRING(200), allowNull: false },
    module:     { type: DataTypes.STRING(100), allowNull: true },
    entity_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    old_values: { type: DataTypes.JSON, allowNull: true, get: jsonGet('old_values') },
    new_values: { type: DataTypes.JSON, allowNull: true, get: jsonGet('new_values') },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName:  'activity_logs',
    modelName:  'ActivityLog',
    timestamps: true,
    createdAt:  'created_at',
    updatedAt:  false,           // No updated_at on audit logs
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['module'] },
      { fields: ['created_at'] },
    ],
  },
);

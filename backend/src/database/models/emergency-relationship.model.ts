import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface EmergencyRelationshipAttributes {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

interface EmergencyRelationshipCreationAttributes
  extends Optional<EmergencyRelationshipAttributes, 'id' | 'display_order' | 'is_active'> {}

export class EmergencyRelationship
  extends Model<EmergencyRelationshipAttributes, EmergencyRelationshipCreationAttributes>
  implements EmergencyRelationshipAttributes
{
  public id!: number;
  public name!: string;
  public code!: string;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmergencyRelationship.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'emergency_relationships',
    modelName: 'EmergencyRelationship',
    indexes: [
      { unique: true, fields: ['name'], name: 'emergency_relationships_name_unique' },
      { unique: true, fields: ['code'], name: 'emergency_relationships_code_unique' },
    ],
  }
);
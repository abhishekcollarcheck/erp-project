import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

/**
 * PHASE 2: Draft Model
 * Stores form drafts for auto-save feature
 */

interface DraftAttributes {
  id: number;
  session_id: string;
  form_id: number;
  user_id: number;
  record_id?: number | null;
  current_step: number;
  form_data: Record<string, any>;
  saved_at: Date;
  completed: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface DraftCreationAttributes extends Optional<DraftAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Draft extends Model<DraftAttributes, DraftCreationAttributes> {
  public id!: number;
  public session_id!: string;
  public form_id!: number;
  public user_id!: number;
  public record_id?: number | null;
  public current_step!: number;
  public form_data!: Record<string, any>;
  public saved_at!: Date;
  public completed!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Draft.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    session_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    form_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    current_step: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    form_data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    saved_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Draft',
    tableName: 'drafts',
    timestamps: true,
    underscored: true,
    // Define indexes at model level (not on column definitions)
    indexes: [
      {
        fields: ['session_id', 'form_id'],
      },
      {
        fields: ['user_id', 'form_id'],
      },
      {
        fields: ['saved_at'],
      },
      {
        fields: ['session_id', 'form_id', 'user_id'],
        unique: true,
        name: 'unique_session_form_user',
      },
    ],
  },
);

export default Draft;
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// --- Insured Amount Model ---
interface InsuredAmountAttributes {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

interface InsuredAmountCreationAttributes
  extends Optional<InsuredAmountAttributes, 'id' | 'code' | 'display_order' | 'is_active'> {}

export class InsuredAmount
  extends Model<InsuredAmountAttributes, InsuredAmountCreationAttributes>
  implements InsuredAmountAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public display_order!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InsuredAmount.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'insured_amounts', modelName: 'InsuredAmount' }
);

// --- Salary Bracket Model ---
interface InsuredAmountBracketAttributes {
  id: number;
  min_salary: number;
  max_salary: number | null;
  insured_amount_id: number;
  display_order: number;
}

interface InsuredAmountBracketCreationAttributes
  extends Optional<InsuredAmountBracketAttributes, 'id' | 'max_salary' | 'display_order'> {}

export class InsuredAmountBracket
  extends Model<InsuredAmountBracketAttributes, InsuredAmountBracketCreationAttributes>
  implements InsuredAmountBracketAttributes
{
  public id!: number;
  public min_salary!: number;
  public max_salary!: number | null;
  public insured_amount_id!: number;
  public display_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InsuredAmountBracket.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    min_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    max_salary: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    insured_amount_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    display_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'insured_amount_brackets', modelName: 'InsuredAmountBracket' }
);

InsuredAmountBracket.belongsTo(InsuredAmount, { foreignKey: 'insured_amount_id', as: 'insuredAmount' });
InsuredAmount.hasMany(InsuredAmountBracket, { foreignKey: 'insured_amount_id', as: 'brackets' });
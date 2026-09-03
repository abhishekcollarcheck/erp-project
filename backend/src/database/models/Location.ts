import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

// ─── 1. COUNTRY ──────────────────────────────────────────────────────────────
export interface CountryAttributes {
  id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

export interface CountryCreationAttributes
  extends Optional<
    CountryAttributes,
    'id' | 'code' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class Country
  extends Model<CountryAttributes, CountryCreationAttributes>
  implements CountryAttributes
{
  public id!: number;
  public name!: string;
  public code!: string | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

Country.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'countries',
    modelName: 'Country',
    paranoid: true,
    underscored: true,
    indexes: [{ fields: ['is_active'] }],
  },
);

// ─── 2. STATE ────────────────────────────────────────────────────────────────
export interface StateAttributes {
  id: number;
  country_id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

export interface StateCreationAttributes
  extends Optional<
    StateAttributes,
    'id' | 'code' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class State
  extends Model<StateAttributes, StateCreationAttributes>
  implements StateAttributes
{
  public id!: number;
  public country_id!: number;
  public name!: string;
  public code!: string | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

State.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    country_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'states',
    modelName: 'State',
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['country_id'] },
      { fields: ['is_active'] },
    ],
  },
);

// ─── 3. CITY ─────────────────────────────────────────────────────────────────
export interface CityAttributes {
  id: number;
  state_id: number;
  name: string;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

export interface CityCreationAttributes
  extends Optional<
    CityAttributes,
    'id' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class City
  extends Model<CityAttributes, CityCreationAttributes>
  implements CityAttributes
{
  public id!: number;
  public state_id!: number;
  public name!: string;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

City.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    state_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'cities',
    modelName: 'City',
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['state_id'] },
      { fields: ['is_active'] },
    ],
  },
);

// ─── 4. SITE (Workplaces) ────────────────────────────────────────────────────
export interface SiteAttributes {
  id: number;
  company_id: number;
  city_id?: number | null; // Nullable for "All Cities" scope
  name: string;
  weekly_off_rule?: string | null;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

export interface SiteCreationAttributes
  extends Optional<
    SiteAttributes,
    'id' | 'city_id' | 'weekly_off_rule' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class Site
  extends Model<SiteAttributes, SiteCreationAttributes>
  implements SiteAttributes
{
  public id!: number;
  public company_id!: number;
  public city_id!: number | null;
  public name!: string;
  public weekly_off_rule!: string | null;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

Site.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    city_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    weekly_off_rule: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'No weekly-off default',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'sites',
    modelName: 'Site',
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['city_id'] },
      { fields: ['is_active'] },
    ],
  },
);

// ─── 5. PAY REGISTER ─────────────────────────────────────────────────────────
export interface PayRegisterAttributes {
  id: number;
  company_id: number;
  state_id?: number | null;
  name: string;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_by?: number | null;
}

export interface PayRegisterCreationAttributes
  extends Optional<
    PayRegisterAttributes,
    'id' | 'state_id' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_by'
  > {}

export class PayRegister
  extends Model<PayRegisterAttributes, PayRegisterCreationAttributes>
  implements PayRegisterAttributes
{
  public id!: number;
  public company_id!: number;
  public state_id!: number | null;
  public name!: string;
  public is_active!: boolean;
  public created_by!: number | null;
  public updated_by!: number | null;
  public deleted_by!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at!: Date | null;
}

PayRegister.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    company_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    state_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    tableName: 'pay_registers',
    modelName: 'PayRegister',
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ['company_id'] },
      { fields: ['state_id'] },
      { fields: ['is_active'] },
    ],
  },
);

// ─── ASSOCIATIONS ─────────────────────────────────────────────────────────────
// Country ↔ State
Country.hasMany(State, { foreignKey: 'country_id', as: 'states' });
State.belongsTo(Country, { foreignKey: 'country_id', as: 'country' });

// State ↔ City
State.hasMany(City, { foreignKey: 'state_id', as: 'cities' });
City.belongsTo(State, { foreignKey: 'state_id', as: 'state' });

// City ↔ Site
City.hasMany(Site, { foreignKey: 'city_id', as: 'sites' });
Site.belongsTo(City, { foreignKey: 'city_id', as: 'city' });

// State ↔ PayRegister
State.hasMany(PayRegister, { foreignKey: 'state_id', as: 'pay_registers' });
PayRegister.belongsTo(State, { foreignKey: 'state_id', as: 'state' });
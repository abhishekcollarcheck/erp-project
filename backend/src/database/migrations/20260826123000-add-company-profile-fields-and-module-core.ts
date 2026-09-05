import { QueryInterface, DataTypes } from 'sequelize';

// `sequelize.sync({ alter: true })` (dev boot) already added some of these
// columns on many local DBs before this migration existed, so addColumn must
// tolerate "column already exists" instead of throwing.
async function addColumnIfMissing(
  queryInterface: QueryInterface,
  table: string,
  column: string,
  attribute: Parameters<QueryInterface['addColumn']>[2],
): Promise<void> {
  const existing = await queryInterface.describeTable(table);
  if (!existing[column]) {
    await queryInterface.addColumn(table, column, attribute);
  }
}

export default {
  async up(queryInterface: QueryInterface) {
    // ─────────────────────────────────────────────────────────────────────────
    // companies
    // ─────────────────────────────────────────────────────────────────────────

    await addColumnIfMissing(queryInterface, 'companies', 'legal_name', {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'tagline', {
      type: DataTypes.STRING(300),
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'since_year', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'cin', {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'google_maps_link', {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'hr_email', {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await addColumnIfMissing(queryInterface, 'companies', 'about', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // company_modules
    // ─────────────────────────────────────────────────────────────────────────

    await addColumnIfMissing(queryInterface, 'company_modules', 'is_core', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface: QueryInterface) {
    // ─────────────────────────────────────────────────────────────────────────
    // company_modules
    // ─────────────────────────────────────────────────────────────────────────

    await queryInterface.removeColumn('company_modules', 'is_core');

    // ─────────────────────────────────────────────────────────────────────────
    // companies
    // ─────────────────────────────────────────────────────────────────────────

    await queryInterface.removeColumn('companies', 'about');
    await queryInterface.removeColumn('companies', 'hr_email');
    await queryInterface.removeColumn('companies', 'google_maps_link');
    await queryInterface.removeColumn('companies', 'cin');
    await queryInterface.removeColumn('companies', 'since_year');
    await queryInterface.removeColumn('companies', 'tagline');
    await queryInterface.removeColumn('companies', 'legal_name');
  },
};

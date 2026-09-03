import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    // ─────────────────────────────────────────────────────────────────────────
    // companies
    // ─────────────────────────────────────────────────────────────────────────

    await queryInterface.addColumn('companies', 'legal_name', {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'tagline', {
      type: DataTypes.STRING(300),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'since_year', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'cin', {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'google_maps_link', {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'hr_email', {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('companies', 'about', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // company_modules
    // ─────────────────────────────────────────────────────────────────────────

    await queryInterface.addColumn('company_modules', 'is_core', {
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

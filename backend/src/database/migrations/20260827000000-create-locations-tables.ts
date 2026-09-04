import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // 1. Create 'countries' table
    await queryInterface.createTable('countries', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('countries', ['is_active']);

    // 2. Create 'states' table
    await queryInterface.createTable('states', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      country_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'countries',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('states', ['country_id']);
    await queryInterface.addIndex('states', ['is_active']);

    // 3. Create 'cities' table
    await queryInterface.createTable('cities', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      state_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'states',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('cities', ['state_id']);
    await queryInterface.addIndex('cities', ['is_active']);

    // 4. Create 'sites' table
    await queryInterface.createTable('sites', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      city_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'cities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('sites', ['company_id']);
    await queryInterface.addIndex('sites', ['city_id']);
    await queryInterface.addIndex('sites', ['is_active']);

    // 5. Create 'pay_registers' table
    await queryInterface.createTable('pay_registers', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      state_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'states',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('pay_registers', ['company_id']);
    await queryInterface.addIndex('pay_registers', ['state_id']);
    await queryInterface.addIndex('pay_registers', ['is_active']);
  },

  down: async (queryInterface: QueryInterface) => {
    // Drop in reverse order to respect Foreign Key constraints
    await queryInterface.dropTable('pay_registers');
    await queryInterface.dropTable('sites');
    await queryInterface.dropTable('cities');
    await queryInterface.dropTable('states');
    await queryInterface.dropTable('countries');
  },
};
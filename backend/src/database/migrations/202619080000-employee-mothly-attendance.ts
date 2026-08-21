import {
  QueryInterface,
  DataTypes,
} from "sequelize";

export async function up(
  queryInterface: QueryInterface,
) {
  await queryInterface.createTable(
    "employee_monthly_attendance",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      employee_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,

        references: {
          model: "employees",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      company_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,

        references: {
          model: "companies",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      calendar_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      working_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      present_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      absent_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      leave_days: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      paid_leave_days: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      unpaid_leave_days: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      weekly_off_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      holiday_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      half_days: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      late_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      incomplete_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      total_working_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      average_working_hours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      total_punches: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      last_calculated_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
  );

  await queryInterface.addIndex(
    "employee_monthly_attendance",
    {
      fields: [
        "employee_id",
        "year",
        "month",
      ],

      unique: true,

      name:
        "uq_employee_monthly_attendance_employee_year_month",
    },
  );

  await queryInterface.addIndex(
    "employee_monthly_attendance",
    {
      fields: [
        "company_id",
        "year",
        "month",
      ],

      name:
        "idx_employee_monthly_attendance_company_month",
    },
  );
}

export async function down(
  queryInterface: QueryInterface,
) {
  await queryInterface.removeIndex(
    "employee_monthly_attendance",
    "idx_employee_monthly_attendance_company_month",
  );

  await queryInterface.removeIndex(
    "employee_monthly_attendance",
    "uq_employee_monthly_attendance_employee_year_month",
  );

  await queryInterface.dropTable(
    "employee_monthly_attendance",
  );
}
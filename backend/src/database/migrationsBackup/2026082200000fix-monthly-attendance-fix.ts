import {
  QueryInterface,
  DataTypes,
} from "sequelize";

export async function up(
  queryInterface: QueryInterface,
) {
  await queryInterface.removeConstraint(
    "employee_monthly_attendance",
    "employee_monthly_attendance_ibfk_1",
  );

  await queryInterface.changeColumn(
    "employee_monthly_attendance",
    "employee_id",
    {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  );

  await queryInterface.addConstraint(
    "employee_monthly_attendance",
    {
      fields: ["employee_id"],
      type: "foreign key",
      name: "employee_monthly_attendance_ibfk_1",
      references: {
        table: "employees",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  );
}

export async function down(
  queryInterface: QueryInterface,
) {
  await queryInterface.removeConstraint(
    "employee_monthly_attendance",
    "employee_monthly_attendance_ibfk_1",
  );

  await queryInterface.changeColumn(
    "employee_monthly_attendance",
    "employee_id",
    {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  );

  await queryInterface.addConstraint(
    "employee_monthly_attendance",
    {
      fields: ["employee_id"],
      type: "foreign key",
      name: "employee_monthly_attendance_ibfk_1",
      references: {
        table: "employees",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  );
}
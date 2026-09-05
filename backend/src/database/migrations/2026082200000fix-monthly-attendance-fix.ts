import {
  QueryInterface,
  DataTypes,
} from "sequelize";

// `sequelize.sync({ alter: true })` (dev boot) already left this table without
// a named FK on many local DBs before this migration existed, so removing a
// constraint that isn't there (or adding one that already is) must not throw.
async function removeConstraintIfPresent(queryInterface: QueryInterface, table: string, name: string): Promise<void> {
  await queryInterface.removeConstraint(table, name).catch((e: any) => {
    if (!/does not exist/i.test(e?.message ?? "")) throw e;
  });
}

async function addConstraintIfMissing(
  queryInterface: QueryInterface,
  table: string,
  options: Parameters<QueryInterface["addConstraint"]>[1],
): Promise<void> {
  await queryInterface.addConstraint(table, options).catch((e: any) => {
    if (e?.parent?.code !== "ER_FK_DUP_NAME" && e?.original?.code !== "ER_FK_DUP_NAME") throw e;
  });
}

export async function up(
  queryInterface: QueryInterface,
) {
  await removeConstraintIfPresent(
    queryInterface,
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

  await addConstraintIfMissing(
    queryInterface,
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
  await removeConstraintIfPresent(
    queryInterface,
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

  await addConstraintIfMissing(
    queryInterface,
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
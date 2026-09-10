import { QueryInterface, DataTypes } from "sequelize";

/**
 * Check whether a table exists.
 */
async function tableExists(
  queryInterface: QueryInterface,
  tableName: string,
): Promise<boolean> {
  const tables = await queryInterface.showAllTables();

  return tables.some(
    (table) =>
      String(table).toLowerCase() === tableName.toLowerCase(),
  );
}

/**
 * Remove a constraint only when it exists.
 *
 * This also safely handles databases where the table exists
 * but the expected FK constraint was never created.
 */
async function removeConstraintIfPresent(
  queryInterface: QueryInterface,
  table: string,
  name: string,
): Promise<void> {
  try {
    await queryInterface.removeConstraint(table, name);
  } catch (error: any) {
    const message = String(error?.message ?? "").toLowerCase();

    const errorCode =
      error?.parent?.code ??
      error?.original?.code ??
      error?.original?.errno ??
      error?.parent?.errno;

    const constraintDoesNotExist =
      message.includes("does not exist") ||
      message.includes("can't drop") ||
      message.includes("check that column/key exists") ||
      errorCode === "ER_CANT_DROP_FIELD_OR_KEY" ||
      errorCode === 1091;

    if (!constraintDoesNotExist) {
      throw error;
    }
  }
}

/**
 * Add the FK only when it does not already exist.
 */
async function addConstraintIfMissing(
  queryInterface: QueryInterface,
  table: string,
  options: Parameters<QueryInterface["addConstraint"]>[1],
): Promise<void> {
  try {
    await queryInterface.addConstraint(table, options);
  } catch (error: any) {
    const message = String(error?.message ?? "").toLowerCase();

    const errorCode =
      error?.parent?.code ??
      error?.original?.code ??
      error?.original?.errno ??
      error?.parent?.errno;

    const constraintAlreadyExists =
      message.includes("already exists") ||
      message.includes("duplicate") ||
      errorCode === "ER_FK_DUP_NAME" ||
      errorCode === "ER_DUP_KEYNAME" ||
      errorCode === 1826;

    if (!constraintAlreadyExists) {
      throw error;
    }
  }
}

/**
 * Check whether a specific column exists.
 */
async function columnExists(
  queryInterface: QueryInterface,
  table: string,
  column: string,
): Promise<boolean> {
  const description = await queryInterface.describeTable(table);

  return Object.prototype.hasOwnProperty.call(description, column);
}

/**
 * Fix employee_monthly_attendance.employee_id:
 *
 * - Ensure employee_id is UNSIGNED
 * - Remove the old FK if present
 * - Add the correct FK to employees.id
 *
 * This migration is intentionally safe for:
 * - Fresh databases
 * - Existing databases
 * - Databases created using sequelize.sync()
 * - Databases where the FK already exists
 * - Databases where the FK does not exist
 */
export async function up(
  queryInterface: QueryInterface,
): Promise<void> {
  const table = "employee_monthly_attendance";

  // The table may not exist on a fresh database.
  // This migration is only a fix/backfill migration, so don't create
  // the table here. The migration/model responsible for creating it
  // should handle that.
  if (!(await tableExists(queryInterface, table))) {
    console.log(
      `[fix-monthly-attendance] ${table} does not exist - skipping migration.`,
    );
    return;
  }

  // Make sure employee_id exists before trying to alter it.
  if (!(await columnExists(queryInterface, table, "employee_id"))) {
    console.log(
      `[fix-monthly-attendance] ${table}.employee_id does not exist - skipping migration.`,
    );
    return;
  }

  // Remove the old/default FK if it exists.
  await removeConstraintIfPresent(
    queryInterface,
    table,
    "employee_monthly_attendance_ibfk_1",
  );

  // Make employee_id compatible with employees.id.
  await queryInterface.changeColumn(
    table,
    "employee_id",
    {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  );

  // Add the correct FK.
  await addConstraintIfMissing(
    queryInterface,
    table,
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

  console.log(
    `[fix-monthly-attendance] ${table} fixed successfully.`,
  );
}

/**
 * Rollback.
 *
 * The rollback is also safe when the table doesn't exist.
 */
export async function down(
  queryInterface: QueryInterface,
): Promise<void> {
  const table = "employee_monthly_attendance";

  if (!(await tableExists(queryInterface, table))) {
    console.log(
      `[fix-monthly-attendance] ${table} does not exist - skipping rollback.`,
    );
    return;
  }

  if (!(await columnExists(queryInterface, table, "employee_id"))) {
    console.log(
      `[fix-monthly-attendance] ${table}.employee_id does not exist - skipping rollback.`,
    );
    return;
  }

  // Remove current FK.
  await removeConstraintIfPresent(
    queryInterface,
    table,
    "employee_monthly_attendance_ibfk_1",
  );

  // Revert employee_id to signed INTEGER.
  await queryInterface.changeColumn(
    table,
    "employee_id",
    {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  );

  // Restore FK.
  await addConstraintIfMissing(
    queryInterface,
    table,
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

  console.log(
    `[fix-monthly-attendance] ${table} rollback completed.`,
  );
}
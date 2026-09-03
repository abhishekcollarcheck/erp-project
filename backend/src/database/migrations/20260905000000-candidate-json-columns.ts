import { QueryInterface } from 'sequelize';

/**
 * Converts `candidates` JSON-ish columns from LONGTEXT → native JSON.
 *
 * `sequelize.sync({ alter: true })` created these as LONGTEXT on this DB, so
 * mysql2 never auto-parses them and Sequelize's JSON type hands the raw string
 * back to callers (`c.vehicle_types.join is not a function`). A real JSON column
 * makes the driver parse on read.
 */

const COLUMNS = ['vehicle_types', 'preinterview_form_data', 'prejoining_form_data'] as const;

async function columnType(queryInterface: QueryInterface, column: string): Promise<string | null> {
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'candidates' AND COLUMN_NAME = :column`,
    { replacements: { column } },
  )) as unknown as [{ DATA_TYPE: string }[], unknown];
  return rows[0]?.DATA_TYPE ?? null;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const column of COLUMNS) {
    const type = await columnType(queryInterface, column);
    if (!type || type === 'json') continue;

    // Null out anything that isn't valid JSON so the type change can't fail.
    await queryInterface.sequelize.query(
      `UPDATE candidates SET \`${column}\` = NULL
         WHERE \`${column}\` IS NOT NULL AND JSON_VALID(\`${column}\`) = 0`,
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE candidates MODIFY \`${column}\` JSON NULL`,
    );
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const column of COLUMNS) {
    await queryInterface.sequelize.query(
      `ALTER TABLE candidates MODIFY \`${column}\` LONGTEXT NULL`,
    );
  }
}

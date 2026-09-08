import { QueryInterface } from 'sequelize';

/**
 * Recruitment pipeline redesign.
 *
 * New ordered pipeline:
 *   Sourced → Screened → Shortlisted → Interview → Offered → Hired
 *
 * Outcome statuses (reachable from any active stage, not part of the sequence):
 *   Rejected, Withdrawn, On_Hold
 *
 * Old → new status map:
 *   Applied              → Sourced
 *   Interview_Scheduled  → Interview
 *   Technical            → Interview
 *   HR_Round             → Interview
 *   Interview_Result     → Interview
 *   Shortlisted / Offered / Hired / Rejected / Withdrawn / On_Hold → unchanged
 *
 * The interview sub-workflow (schedule / accept / reschedule / record-result)
 * now keys off the `interview_*` columns + the single `Interview` status instead
 * of the removed `Interview_Scheduled` / `Interview_Result` statuses.
 */

const OLD_ENUM =
  "'Applied','Shortlisted','Interview_Scheduled','Technical','HR_Round','Interview_Result','Offered','Hired','Rejected','Withdrawn','On_Hold'";

const NEW_ENUM =
  "'Sourced','Screened','Shortlisted','Interview','Offered','Hired','Rejected','Withdrawn','On_Hold'";

// Union of both, used while rows are being remapped.
const SUPERSET_ENUM =
  "'Applied','Sourced','Screened','Shortlisted','Interview_Scheduled','Technical','HR_Round','Interview_Result','Interview','Offered','Hired','Rejected','Withdrawn','On_Hold'";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const q = queryInterface.sequelize;

  // 1 — widen the enum so old and new values are both valid during the remap
  await q.query(
    `ALTER TABLE candidates MODIFY COLUMN status ENUM(${SUPERSET_ENUM}) NOT NULL DEFAULT 'Sourced'`,
  );

  // 2 — remap existing rows
  await q.query(`UPDATE candidates SET status = 'Sourced'  WHERE status = 'Applied'`);
  await q.query(
    `UPDATE candidates SET status = 'Interview' WHERE status IN ('Interview_Scheduled','Technical','HR_Round','Interview_Result')`,
  );

  // 3 — narrow the enum to the final set
  await q.query(
    `ALTER TABLE candidates MODIFY COLUMN status ENUM(${NEW_ENUM}) NOT NULL DEFAULT 'Sourced'`,
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const q = queryInterface.sequelize;

  await q.query(
    `ALTER TABLE candidates MODIFY COLUMN status ENUM(${SUPERSET_ENUM}) NOT NULL DEFAULT 'Applied'`,
  );

  // best-effort reverse mapping (Screened / Interview have no exact 1:1 old value)
  await q.query(`UPDATE candidates SET status = 'Applied'             WHERE status = 'Sourced'`);
  await q.query(`UPDATE candidates SET status = 'Applied'             WHERE status = 'Screened'`);
  await q.query(`UPDATE candidates SET status = 'Interview_Scheduled' WHERE status = 'Interview'`);

  await q.query(
    `ALTER TABLE candidates MODIFY COLUMN status ENUM(${OLD_ENUM}) NOT NULL DEFAULT 'Applied'`,
  );
}

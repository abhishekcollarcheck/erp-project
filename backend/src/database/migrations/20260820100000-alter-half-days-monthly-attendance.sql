-- 'use strict';

-- /**
--  * Changes employee_monthly_attendance.half_days from INTEGER to
--  * DECIMAL(10,1), since the service computes fractional values
--  * (e.g. 0.5 per half day).
--  *
--  * NOTE: this table has a foreign key on employee_id
--  * (employee_monthly_attendance_ibfk_1). MySQL 8 will refuse to
--  * re-issue a CHANGE on employee_id even as a no-op, so this
--  * migration touches ONLY half_days — don't let a future
--  * sync({ alter: true }) run against this table.
--  */
-- module.exports = {
--   /**
--    * @param {import('sequelize').QueryInterface} queryInterface
--    * @param {typeof import('sequelize')} Sequelize
--    */
--   async up(queryInterface, Sequelize) {
--     await queryInterface.changeColumn(
--       'employee_monthly_attendance',
--       'half_days',
--       {
--         type: Sequelize.DECIMAL(10, 1),
--         allowNull: false,
--         defaultValue: 0,
--       },
--     );
--   },

--   /**
--    * @param {import('sequelize').QueryInterface} queryInterface
--    * @param {typeof import('sequelize')} Sequelize
--    */
--   async down(queryInterface, Sequelize) {
--     await queryInterface.changeColumn(
--       'employee_monthly_attendance',
--       'half_days',
--       {
--         type: Sequelize.INTEGER,
--         allowNull: false,
--         defaultValue: 0,
--       },
--     );
--   },
-- };


-- Run this ONCE, directly against your MySQL database
-- (via CLI, Workbench, TablePlus, etc.) — do NOT rely on
-- Sequelize's sync({ alter: true }) to do this, since it
-- will fail with ER_FK_COLUMN_CANNOT_CHANGE on this table.

ALTER TABLE `employee_monthly_attendance`
  MODIFY COLUMN `half_days` DECIMAL(10,1) NOT NULL DEFAULT 0;

-- Verify it applied correctly:
-- DESCRIBE `employee_monthly_attendance`;
-- (half_days should show as decimal(10,1))
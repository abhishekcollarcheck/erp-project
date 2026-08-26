'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.addColumn('employees', 'record_status', {
      type: DataTypes.ENUM('Draft', 'Final'),
      allowNull: false,
      defaultValue: 'Draft',
      after: 'status', // purely cosmetic column ordering, matches the model file
    } as any );

    // Any employee that already has an employee_code was, by definition,
    // already fully onboarded before this column existed — backfill those
    // as 'Final' so existing complete records don't get mislabeled as drafts.
    await queryInterface.sequelize.query(
      `UPDATE employees SET record_status = 'Final' WHERE employee_code IS NOT NULL`,
    );
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeColumn('employees', 'record_status');
  },
};

import { Op } from 'sequelize';

import { sequelize } from '../../config/database';

// import { LeaveType } from './models/LeaveType';
// import { EmployeeLeaveBalance } from './models/EmployeeLeaveBalance';
// import { EmployeeLeaveAccrual } from './models/EmployeeLeaveAccrual';
// import { EmployeeCommitmentProbation } from './models/EmployeeCommitmentProbation';
import { MonthlyLeaveCalculation } from './leaveRuleEngine.service';
import { EmployeeCommitmentProbation, LeaveType } from '../../database/models';
import { EmployeeLeaveBalance } from '../../database/models/LeaveModels';
import { EmployeeLeaveAccrual } from '../../database/models/EmployeeLeaveAccrual';

// ============================================================
// TYPES
// ============================================================
export interface PostingResult {
  leave_type_code: string;
  leave_type_name: string;
  leave_type_id: number;
  days_added: number;
  balance_updated: boolean;
  accrual_created: boolean;
  remarks: string;
}
// ============================================================
// MAIN FUNCTION
// ============================================================
export async function postMonthlyLeaveCalculation(
  calculation: MonthlyLeaveCalculation
): Promise<PostingResult[]> {
  const {
    employee_id,
    year,
    month,
    employee,
    attendance,
    leaves,
  } = calculation;
  console.log('');
  console.log('==================================================');
  console.log('        MONTHLY LEAVE POSTING SERVICE');
  console.log('==================================================');
  console.log('[POSTING] Employee ID:', employee_id);
  console.log('[POSTING] Company ID:', employee.employee.company_id);
  console.log('[POSTING] Year:', year);
  console.log('[POSTING] Month:', month);
  console.log('==================================================');
  // ==========================================================
  // VALIDATION
  // ==========================================================
  if (!employee_id || employee_id <= 0) {
    throw new Error(
      `[POSTING ERROR] Invalid employee ID: ${employee_id}`
    );
  }
  if (!year || year < 2000) {
    throw new Error(
      `[POSTING ERROR] Invalid year: ${year}`
    );
  }
  if (!month || month < 1 || month > 12) {
    throw new Error(
      `[POSTING ERROR] Invalid month: ${month}`
    );
  }
  const companyId = employee.employee.company_id;
  if (!companyId) {
    throw new Error(
      `[POSTING ERROR] Employee ${employee_id} does not have a company_id`
    );
  }
  // ==========================================================
  // TRANSACTION
  // ==========================================================
  const transaction = await sequelize.transaction();
  try {
    console.log('');
    console.log('[POSTING] Transaction started');
    // ========================================================
    // STEP 1
    // GET LEAVE TYPES
    // ========================================================
    console.log('');
    console.log('[POSTING] STEP 1 - FETCH LEAVE TYPES');
    console.log('--------------------------------------------------');
    const leaveTypes = await LeaveType.findAll({
      where: {
        company_id: companyId,
        code: {
          [Op.in]: ['CL', 'EL', 'ShL'],
        },
        is_active: true,
      },
      transaction,
    });
    console.log(
      '[POSTING] Leave types found:',
      leaveTypes.length
    );
    for (const leaveType of leaveTypes) {
      console.log(
        '[POSTING] Leave Type:',
        leaveType.id,
        leaveType.code,
        leaveType.name
      );
    }
    const clType = leaveTypes.find(
      (type) => type.code === 'CL'
    );
    const elType = leaveTypes.find(
      (type) => type.code === 'EL'
    );
    const shortLeaveType = leaveTypes.find(
      (type) => type.code === 'ShL'
    );

    if (!clType) {
      throw new Error(
        `[POSTING ERROR] CL leave type not found for company ${companyId}`
      );
    }

    if (!elType) {
      throw new Error(
        `[POSTING ERROR] EL leave type not found for company ${companyId}`
      );
    }

    if (!shortLeaveType) {
      throw new Error(
        `[POSTING ERROR] ShL leave type not found for company ${companyId}`
      );
    }
    console.log('');
    console.log('[POSTING] Resolved Leave Type IDs');
    console.log('[POSTING] CL  ID:', clType.id);
    console.log('[POSTING] EL  ID:', elType.id);
    console.log('[POSTING] ShL ID:', shortLeaveType.id);
    // ========================================================
    // STEP 2
    // PROCESS CL / EL RULE RESULTS
    // ========================================================
    console.log('');
    console.log('[POSTING] STEP 2 - PROCESS RULE RESULTS');
    console.log('--------------------------------------------------');
    const postingResults: PostingResult[] = [];
    for (const leave of leaves) {
      console.log('');
      console.log(
        `[POSTING] Processing ${leave.leave_type_code}`
      );
      console.log(
        '[POSTING] Eligible:',
        leave.eligible
      );
      console.log(
        '[POSTING] Earned Days:',
        leave.earned_days
      );
      // ------------------------------------------------------
      // Ignore zero-earned leaves
      // ------------------------------------------------------
      if (
        !leave.eligible ||
        Number(leave.earned_days || 0) <= 0
      ) {
        console.log(
          `[POSTING] Skipping ${leave.leave_type_code} because earned days = 0`
        );
        continue;
      }
      // ======================================================
      // CL
      // ======================================================
      if (leave.leave_type_code === 'CL') {
        const result = await postDayBasedLeave({
          employeeId: employee_id,
          leaveType: clType,
          year,
          month,
          days: Number(leave.earned_days),
          workingDays: attendance.workingDays,
          workingHours: attendance.totalWorkingHours,
          ruleType: 'MONTHLY_CL',
          remarks: leave.reason,
          transaction,
        });
        postingResults.push(result);
        continue;
      }
      // ======================================================
      // EL
      // ======================================================
      if (leave.leave_type_code === 'EL') {
        const result = await postEarnedLeave({
          employeeId: employee_id,
          employee,
          attendance,
          leave,
          elType,
          year,
          month,
          transaction,
        });
        if (result) {
          postingResults.push(result);
        }
        continue;
      }
      console.log(
        `[POSTING] No posting handler for ${leave.leave_type_code}`
      );
    }
    // ========================================================
    // STEP 3
    // SHORT LEAVE MONTHLY RESET
    // ========================================================
    console.log('');
    console.log('[POSTING] STEP 3 - SHORT LEAVE RESET');
    console.log('--------------------------------------------------');
    /*
     * Short Leave:
     *
     * Every month:
     *
     *     1 hour available
     *
     * It should NOT accumulate.
     *
     * Therefore this is handled separately from
     * CL / EL day-based balances.
     */
    console.log(
      '[POSTING] Short Leave type ID:',
      shortLeaveType.id
    );
    console.log(
      '[POSTING] Short Leave monthly entitlement: 1 hour'
    );
    /*
     * We will create the hour-based balance
     * after adding the hour columns to
     * employee_leave_balances.
     */

    // ========================================================
    // STEP 4
    // COMMIT
    // ========================================================
    await transaction.commit();
    console.log('');
    console.log('[POSTING] Transaction committed successfully');
    // ========================================================
    // SUMMARY
    // ========================================================
    console.log('');
    console.log('==================================================');
    console.log('        MONTHLY LEAVE POSTING COMPLETE');
    console.log('==================================================');
    console.log(
      '[POSTING] Total postings:',
      postingResults.length
    );

    for (const result of postingResults) {
      console.log('');
      console.log(
        `[POSTING] ${result.leave_type_code}`
      );
      console.log(
        '[POSTING] Leave Type ID:',
        result.leave_type_id
      );
      console.log(
        '[POSTING] Days Added:',
        result.days_added
      );
      console.log(
        '[POSTING] Balance Updated:',
        result.balance_updated
      );
      console.log(
        '[POSTING] Accrual Created:',
        result.accrual_created
      );
      console.log(
        '[POSTING] Remarks:',
        result.remarks
      );
    }
    console.log('==================================================');
    return postingResults;
  } catch (error) {
    await transaction.rollback();
    console.error('');
    console.error('==================================================');
    console.error('        MONTHLY LEAVE POSTING FAILED');
    console.error('==================================================');
    console.error('[POSTING ERROR]', error);
    console.error('==================================================');
    throw error;
  }
}

// ============================================================
// DAY BASED LEAVE
// ============================================================
// async function postDayBasedLeave({
//   employeeId,
//   leaveType,
//   year,
//   month,
//   days,
//   workingDays,
//   workingHours,
//   ruleType,
//   remarks,
//   transaction,
// }: {
//   employeeId: number;
//   leaveType: LeaveType;
//   year: number;
//   month: number;
//   days: number;
//   workingDays: number;
//   workingHours: number;
//   ruleType: string;
//   remarks: string;
//   transaction: any;
// }): Promise<PostingResult> {

//   console.log('');
//   console.log(
//     `[POSTING] Posting ${leaveType.code}`
//   );
//   console.log(
//     '[POSTING] Employee:',
//     employeeId
//   );
//   console.log(
//     '[POSTING] Leave Type ID:',
//     leaveType.id
//   );
//   console.log(
//     '[POSTING] Days:',
//     days
//   );
//   // ==========================================================
//   // FIND OR CREATE YEARLY BALANCE
//   // =========================================================
//   const [balance, created] =
//     await EmployeeLeaveBalance.findOrCreate({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveType.id,
//         year,
//       },
//       defaults: {
//         employee_id: employeeId,
//         leave_type_id: leaveType.id,
//         year,
//         allocated: 0,
//         used: 0,
//         pending: 0,
//         carried_forward: 0,
//       },
//       transaction,
//     });
//   console.log(
//     '[POSTING] Balance created:',
//     created
//   );
//   // ==========================================================
//   // ADD ALLOCATION
//   // ==========================================================
//   const oldAllocated =
//     Number(balance.allocated || 0);
//   const newAllocated =
//     oldAllocated + days;
//   balance.allocated = newAllocated;
//   await balance.save({
//     transaction,
//   });
//   console.log(
//     '[POSTING] Previous allocated:',
//     oldAllocated
//   );
//   console.log(
//     '[POSTING] New allocated:',
//     newAllocated
//   );
//   // ==========================================================
//   // ACCRUAL
//   // ==========================================================
//   let accrualCreated = false;
//   try {
//     const [, createdAccrual] =
//       await EmployeeLeaveAccrual.findOrCreate({
//         where: {
//           employee_id: employeeId,
//           leave_type_id: leaveType.id,
//           year,
//           month,
//           rule_type: ruleType,
//         },
//         defaults: {
//           employee_id: employeeId,
//           leave_type_id: leaveType.id,
//           year,
//           month,
//           rule_type: ruleType,
//           days_earned: days,
//           working_days: workingDays,
//           working_hours: workingHours,
//           remarks,
//         },
//         transaction,
//       });
//     accrualCreated = createdAccrual;
//     console.log(
//       '[POSTING] Accrual created:',
//       createdAccrual
//     );
//   } catch (error) {
//     console.error(
//       '[POSTING ERROR] Accrual creation failed'
//     );
//     throw error;
//   }

//   return {
//     leave_type_code: leaveType.code,
//     leave_type_name: leaveType.name,
//     leave_type_id: leaveType.id,
//     days_added: days,
//     balance_updated: true,
//     accrual_created: accrualCreated,
//     remarks,
//   };
// }

async function postDayBasedLeave({
  employeeId,
  leaveType,
  year,
  month,
  days,
  workingDays,
  workingHours,
  ruleType,
  remarks,
  transaction,
}: {
  employeeId: number;
  leaveType: LeaveType;
  year: number;
  month: number;
  days: number;
  workingDays: number;
  workingHours: number;
  ruleType: string;
  remarks: string;
  transaction: any;
}): Promise<PostingResult> {

  console.log('');
  console.log(`[POSTING] Posting ${leaveType.code}`);
  console.log('[POSTING] Employee:', employeeId);
  console.log('[POSTING] Leave Type ID:', leaveType.id);
  console.log('[POSTING] Days:', days);

  // ==========================================================
  // STEP 1 - DUPLICATE ACCRUAL CHECK
  // ==========================================================

  const existingAccrual =
    await EmployeeLeaveAccrual.findOne({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year,
        month,
        rule_type: ruleType,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

  if (existingAccrual) {

    console.log('');
    console.log('==================================================');
    console.log('[POSTING] DUPLICATE MONTHLY POSTING DETECTED');
    console.log('==================================================');

    console.log('[POSTING] Employee:', employeeId);
    console.log('[POSTING] Leave Type:', leaveType.code);
    console.log('[POSTING] Year:', year);
    console.log('[POSTING] Month:', month);
    console.log('[POSTING] Rule:', ruleType);
    console.log('[POSTING] Existing Accrual ID:', existingAccrual.id);

    console.log(
      '[POSTING] Balance will NOT be updated.'
    );

    return {
      leave_type_code: leaveType.code,
      leave_type_name: leaveType.name,
      leave_type_id: leaveType.id,
      days_added: 0,
      balance_updated: false,
      accrual_created: false,
      remarks: `Monthly posting already exists for ${year}-${month}.`,
    };
  }

  // ==========================================================
  // STEP 2 - FIND OR CREATE YEARLY BALANCE
  // ==========================================================

  const [balance, created] =
    await EmployeeLeaveBalance.findOrCreate({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year,
      },

      defaults: {
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year,
        allocated: 0,
        used: 0,
        pending: 0,
        carried_forward: 0,
      },

      transaction,
    });

  console.log(
    '[POSTING] Balance created:',
    created
  );

  // ==========================================================
  // STEP 3 - UPDATE BALANCE
  // ==========================================================

  const oldAllocated =
    Number(balance.allocated || 0);

  const newAllocated =
    oldAllocated + days;

  balance.allocated = newAllocated;

  await balance.save({
    transaction,
  });

  console.log(
    '[POSTING] Previous allocated:',
    oldAllocated
  );

  console.log(
    '[POSTING] New allocated:',
    newAllocated
  );

  // ==========================================================
  // STEP 4 - CREATE ACCRUAL
  // ==========================================================

  const [accrual, createdAccrual] =
    await EmployeeLeaveAccrual.findOrCreate({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year,
        month,
        rule_type: ruleType,
      },

      defaults: {
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        year,
        month,
        rule_type: ruleType,
        days_earned: days,
        working_days: workingDays,
        working_hours: workingHours,
        remarks,
      },

      transaction,
    });

  console.log(
    '[POSTING] Accrual created:',
    createdAccrual
  );

  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  if (!createdAccrual) {

    console.error(
      '[POSTING ERROR] Accrual already existed unexpectedly.'
    );

    throw new Error(
      `Duplicate accrual detected for employee ${employeeId}, ` +
      `leave type ${leaveType.id}, ${year}-${month}, rule ${ruleType}`
    );
  }

  // ==========================================================
  // RESULT
  // ==========================================================

  return {
    leave_type_code: leaveType.code,
    leave_type_name: leaveType.name,
    leave_type_id: leaveType.id,
    days_added: days,
    balance_updated: true,
    accrual_created: true,
    remarks,
  };
}

// ============================================================
// EARNED LEAVE
// ============================================================
async function postEarnedLeave({
  employeeId,
  employee,
  attendance,
  leave,
  elType,
  year,
  month,
  transaction,
}: {
  employeeId: number;
  employee: MonthlyLeaveCalculation['employee'];
  attendance: MonthlyLeaveCalculation['attendance'];
  leave: MonthlyLeaveCalculation['leaves'][number];
  elType: LeaveType;
  year: number;
  month: number;
  transaction: any;
}): Promise<PostingResult | null> {
  console.log('');
  console.log('==================================================');
  console.log('[EL POSTING] EARNED LEAVE');
  console.log('==================================================');
  console.log(
    '[EL POSTING] Employee:',
    employeeId
  );
  console.log(
    '[EL POSTING] Month:',
    `${year}-${month}`
  );
  console.log(
    '[EL POSTING] Earned:',
    leave.earned_days
  );
  const earnedDays =
    Number(leave.earned_days || 0);
  if (earnedDays <= 0) {
    console.log(
      '[EL POSTING] No EL to post'
    );
    return null;
  }
  // ==========================================================
  // DETERMINE PROBATION STATUS
  // ==========================================================
  const probation =
    await EmployeeCommitmentProbation.findOne({
      where: {
        employee_id: employeeId,
      },
      transaction,
    });

  if (!probation) {
    console.log(
      '[EL POSTING] No probation record found.'
    );
    return await postDayBasedLeave({
      employeeId,
      leaveType: elType,
      year,
      month,
      days: earnedDays,
      workingDays: attendance.workingDays,
      workingHours: attendance.totalWorkingHours,
      ruleType: 'REGULAR_EL',
      remarks: leave.reason,
      transaction,
    });
  }
  console.log(
    '[EL POSTING] Probation record:',
    probation.toJSON()
  );
  // ==========================================================
  // CURRENT PROBATION STATUS
  // ==========================================================
  const isCurrentlyOnProbation =
    Boolean(probation.on_probation) &&
    probation.confirmation_status !== 'Confirmed';
  // ==========================================================
  // PROBATION EL
  // ==========================================================
  if (isCurrentlyOnProbation) {
    console.log(
      '[EL POSTING] Employee is currently on probation'
    );
    console.log(
      '[EL POSTING] Adding EL to probation_el_credit'
    );
    const currentCredit =
      Number(probation.probation_el_credit || 0);
    const newCredit =
      currentCredit + earnedDays;

    probation.probation_el_credit =
      newCredit;
    await probation.save({
      transaction,
    });
    console.log(
      '[EL POSTING] Previous probation EL:',
      currentCredit
    );
    console.log(
      '[EL POSTING] New probation EL:',
      newCredit
    );
    // --------------------------------------------------------
    // ACCRUAL
    // --------------------------------------------------------
    let accrualCreated = false;
    const [, createdAccrual] =
      await EmployeeLeaveAccrual.findOrCreate({
        where: {
          employee_id: employeeId,
          leave_type_id: elType.id,
          year,
          month,
          rule_type: 'PROBATION_EL',
        },
        defaults: {
          employee_id: employeeId,
          leave_type_id: elType.id,
          year,
          month,
          rule_type: 'PROBATION_EL',
          days_earned: earnedDays,
          working_days: attendance.workingDays,
          working_hours: attendance.totalWorkingHours,
          remarks:
            `Probation EL credited to probation balance. ${leave.reason}`,
        },
        transaction,
      });
    accrualCreated = createdAccrual;
    console.log(
      '[EL POSTING] Probation accrual created:',
      createdAccrual
    );
    return {
      leave_type_code: 'EL',
      leave_type_name: 'Earned Leave',
      leave_type_id: elType.id,
      days_added: earnedDays,
      balance_updated: false,
      accrual_created: accrualCreated,
      remarks:
        `Added ${earnedDays} EL to probation_el_credit.`,
    };
  }
  // ==========================================================
  // REGULAR EL
  // ==========================================================
  console.log(
    '[EL POSTING] Employee is not on probation'
  );
  console.log(
    '[EL POSTING] Posting EL to regular leave balance'
  );
  return await postDayBasedLeave({
    employeeId,
    leaveType: elType,
    year,
    month,
    days: earnedDays,
    workingDays: attendance.workingDays,
    workingHours: attendance.totalWorkingHours,
    ruleType: 'REGULAR_EL',
    remarks: leave.reason,
    transaction,
  });
}
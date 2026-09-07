// import { Op } from 'sequelize';

// import { sequelize } from '../../config/database';

// // import { LeaveType } from './models/LeaveType';
// // import { EmployeeLeaveBalance } from './models/EmployeeLeaveBalance';
// // import { EmployeeLeaveAccrual } from './models/EmployeeLeaveAccrual';
// // import { EmployeeCommitmentProbation } from './models/EmployeeCommitmentProbation';
// import { MonthlyLeaveCalculation } from './leaveRuleEngine.service';
// import { EmployeeCommitmentProbation, LeaveType } from '../../database/models';
// import { EmployeeLeaveBalance } from '../../database/models/LeaveModels';
// import { EmployeeLeaveAccrual } from '../../database/models/EmployeeLeaveAccrual';

// // ============================================================
// // TYPES
// // ============================================================
// export interface PostingResult {
//   leave_type_code: string;
//   leave_type_name: string;
//   leave_type_id: number;
//   days_added: number;
//   balance_updated: boolean;
//   accrual_created: boolean;
//   remarks: string;
// }
// // ============================================================
// // MAIN FUNCTION
// // ============================================================
// export async function postMonthlyLeaveCalculation(
//   calculation: MonthlyLeaveCalculation
// ): Promise<PostingResult[]> {
//   const {
//     employee_id,
//     year,
//     month,
//     employee,
//     attendance,
//     leaves,
//   } = calculation;
//   // ==========================================================
//   // VALIDATION
//   // ==========================================================
//   if (!employee_id || employee_id <= 0) {
//     throw new Error(
//       `[POSTING ERROR] Invalid employee ID: ${employee_id}`
//     );
//   }
//   if (!year || year < 2000) {
//     throw new Error(
//       `[POSTING ERROR] Invalid year: ${year}`
//     );
//   }
//   if (!month || month < 1 || month > 12) {
//     throw new Error(
//       `[POSTING ERROR] Invalid month: ${month}`
//     );
//   }
//   const companyId = employee.employee.company_id;
//   if (!companyId) {
//     throw new Error(
//       `[POSTING ERROR] Employee ${employee_id} does not have a company_id`
//     );
//   }
//   // ==========================================================
//   // TRANSACTION
//   // ==========================================================
//   const transaction = await sequelize.transaction();
//   try {

//     const leaveTypes = await LeaveType.findAll({
//       where: {
//         company_id: companyId,
//         code: {
//           [Op.in]: ['CL', 'EL', 'ShL'],
//         },
//         is_active: true,
//       },
//       transaction,
//     });
//     const clType = leaveTypes.find(
//       (type) => type.code === 'CL'
//     );
//     const elType = leaveTypes.find(
//       (type) => type.code === 'EL'
//     );
//     const shortLeaveType = leaveTypes.find(
//       (type) => type.code === 'ShL'
//     );

//     if (!clType) {
//       throw new Error(
//         `[POSTING ERROR] CL leave type not found for company ${companyId}`
//       );
//     }

//     if (!elType) {
//       throw new Error(
//         `[POSTING ERROR] EL leave type not found for company ${companyId}`
//       );
//     }

//     if (!shortLeaveType) {
//       throw new Error(
//         `[POSTING ERROR] ShL leave type not found for company ${companyId}`
//       );
//     }
   
//     const postingResults: PostingResult[] = [];
//     for (const leave of leaves) {
     
//       // ------------------------------------------------------
//       // Ignore zero-earned leaves
//       // ------------------------------------------------------
//       if (
//         !leave.eligible ||
//         Number(leave.earned_days || 0) <= 0
//       ) {
//         continue;
//       }
//       // ======================================================
//       // CL
//       // ======================================================
//       if (leave.leave_type_code === 'CL') {
//         const result = await postDayBasedLeave({
//           employeeId: employee_id,
//           leaveType: clType,
//           year,
//           month,
//           days: Number(leave.earned_days),
//           workingDays: attendance.workingDays,
//           workingHours: attendance.totalWorkingHours,
//           ruleType: 'MONTHLY_CL',
//           remarks: leave.reason,
//           transaction,
//         });
//         postingResults.push(result);
//         continue;
//       }
//       // ======================================================
//       // EL
//       // ======================================================
//       if (leave.leave_type_code === 'EL') {
//         const result = await postEarnedLeave({
//           employeeId: employee_id,
//           employee,
//           attendance,
//           leave,
//           elType,
//           year,
//           month,
//           transaction,
//         });
//         if (result) {
//           postingResults.push(result);
//         }
//         continue;
//       }
//     }
//     // ========================================================
//     // STEP 3
//     // SHORT LEAVE MONTHLY RESET
//     // ========================================================

//     /*
//      * Short Leave:
//      *
//      * Every month:
//      *
//      *     1 hour available
//      *
//      * It should NOT accumulate.
//      *
//      * Therefore this is handled separately from
//      * CL / EL day-based balances.
//      */
//     /*
//      * We will create the hour-based balance
//      * after adding the hour columns to
//      * employee_leave_balances.
//      */

//     // ========================================================
//     // STEP 4
//     // COMMIT
//     // ========================================================
//     await transaction.commit();
//     return postingResults;
//   } catch (error) {
//     await transaction.rollback();
//     throw error;
//   }
// }

// // ============================================================
// // DAY BASED LEAVE
// // ============================================================
// // async function postDayBasedLeave({
// //   employeeId,
// //   leaveType,
// //   year,
// //   month,
// //   days,
// //   workingDays,
// //   workingHours,
// //   ruleType,
// //   remarks,
// //   transaction,
// // }: {
// //   employeeId: number;
// //   leaveType: LeaveType;
// //   year: number;
// //   month: number;
// //   days: number;
// //   workingDays: number;
// //   workingHours: number;
// //   ruleType: string;
// //   remarks: string;
// //   transaction: any;
// // }): Promise<PostingResult> {

// //   console.log('');
// //   console.log(
// //     `[POSTING] Posting ${leaveType.code}`
// //   );
// //   console.log(
// //     '[POSTING] Employee:',
// //     employeeId
// //   );
// //   console.log(
// //     '[POSTING] Leave Type ID:',
// //     leaveType.id
// //   );
// //   console.log(
// //     '[POSTING] Days:',
// //     days
// //   );
// //   // ==========================================================
// //   // FIND OR CREATE YEARLY BALANCE
// //   // =========================================================
// //   const [balance, created] =
// //     await EmployeeLeaveBalance.findOrCreate({
// //       where: {
// //         employee_id: employeeId,
// //         leave_type_id: leaveType.id,
// //         year,
// //       },
// //       defaults: {
// //         employee_id: employeeId,
// //         leave_type_id: leaveType.id,
// //         year,
// //         allocated: 0,
// //         used: 0,
// //         pending: 0,
// //         carried_forward: 0,
// //       },
// //       transaction,
// //     });
// //   console.log(
// //     '[POSTING] Balance created:',
// //     created
// //   );
// //   // ==========================================================
// //   // ADD ALLOCATION
// //   // ==========================================================
// //   const oldAllocated =
// //     Number(balance.allocated || 0);
// //   const newAllocated =
// //     oldAllocated + days;
// //   balance.allocated = newAllocated;
// //   await balance.save({
// //     transaction,
// //   });
// //   console.log(
// //     '[POSTING] Previous allocated:',
// //     oldAllocated
// //   );
// //   console.log(
// //     '[POSTING] New allocated:',
// //     newAllocated
// //   );
// //   // ==========================================================
// //   // ACCRUAL
// //   // ==========================================================
// //   let accrualCreated = false;
// //   try {
// //     const [, createdAccrual] =
// //       await EmployeeLeaveAccrual.findOrCreate({
// //         where: {
// //           employee_id: employeeId,
// //           leave_type_id: leaveType.id,
// //           year,
// //           month,
// //           rule_type: ruleType,
// //         },
// //         defaults: {
// //           employee_id: employeeId,
// //           leave_type_id: leaveType.id,
// //           year,
// //           month,
// //           rule_type: ruleType,
// //           days_earned: days,
// //           working_days: workingDays,
// //           working_hours: workingHours,
// //           remarks,
// //         },
// //         transaction,
// //       });
// //     accrualCreated = createdAccrual;
// //     console.log(
// //       '[POSTING] Accrual created:',
// //       createdAccrual
// //     );
// //   } catch (error) {
// //     console.error(
// //       '[POSTING ERROR] Accrual creation failed'
// //     );
// //     throw error;
// //   }

// //   return {
// //     leave_type_code: leaveType.code,
// //     leave_type_name: leaveType.name,
// //     leave_type_id: leaveType.id,
// //     days_added: days,
// //     balance_updated: true,
// //     accrual_created: accrualCreated,
// //     remarks,
// //   };
// // }

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


//   // ==========================================================
//   // STEP 1 - DUPLICATE ACCRUAL CHECK
//   // ==========================================================

//   const existingAccrual =
//     await EmployeeLeaveAccrual.findOne({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveType.id,
//         year,
//         month,
//         rule_type: ruleType,
//       },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//   if (existingAccrual) {
//     return {
//       leave_type_code: leaveType.code,
//       leave_type_name: leaveType.name,
//       leave_type_id: leaveType.id,
//       days_added: 0,
//       balance_updated: false,
//       accrual_created: false,
//       remarks: `Monthly posting already exists for ${year}-${month}.`,
//     };
//   }

//   // ==========================================================
//   // STEP 2 - FIND OR CREATE YEARLY BALANCE
//   // ==========================================================

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

//   // ==========================================================
//   // STEP 3 - UPDATE BALANCE
//   // ==========================================================

//   const oldAllocated =
//     Number(balance.allocated || 0);

//   const newAllocated =
//     oldAllocated + days;

//   balance.allocated = newAllocated;

//   await balance.save({
//     transaction,
//   });

//   // ==========================================================
//   // STEP 4 - CREATE ACCRUAL
//   // ==========================================================

//   const [accrual, createdAccrual] =
//     await EmployeeLeaveAccrual.findOrCreate({
//       where: {
//         employee_id: employeeId,
//         leave_type_id: leaveType.id,
//         year,
//         month,
//         rule_type: ruleType,
//       },

//       defaults: {
//         employee_id: employeeId,
//         leave_type_id: leaveType.id,
//         year,
//         month,
//         rule_type: ruleType,
//         days_earned: days,
//         working_days: workingDays,
//         working_hours: workingHours,
//         remarks,
//       },

//       transaction,
//     });
//   // ==========================================================
//   // SAFETY CHECK
//   // ==========================================================

//   if (!createdAccrual) {

//     console.error(
//       '[POSTING ERROR] Accrual already existed unexpectedly.'
//     );

//     throw new Error(
//       `Duplicate accrual detected for employee ${employeeId}, ` +
//       `leave type ${leaveType.id}, ${year}-${month}, rule ${ruleType}`
//     );
//   }

//   // ==========================================================
//   // RESULT
//   // ==========================================================

//   return {
//     leave_type_code: leaveType.code,
//     leave_type_name: leaveType.name,
//     leave_type_id: leaveType.id,
//     days_added: days,
//     balance_updated: true,
//     accrual_created: true,
//     remarks,
//   };
// }

// // ============================================================
// // EARNED LEAVE
// // ============================================================
// // async function postEarnedLeave({
// //   employeeId,
// //   employee,
// //   attendance,
// //   leave,
// //   elType,
// //   year,
// //   month,
// //   transaction,
// // }: {
// //   employeeId: number;
// //   employee: MonthlyLeaveCalculation['employee'];
// //   attendance: MonthlyLeaveCalculation['attendance'];
// //   leave: MonthlyLeaveCalculation['leaves'][number];
// //   elType: LeaveType;
// //   year: number;
// //   month: number;
// //   transaction: any;
// // }): Promise<PostingResult | null> {
// //   console.log('');
// //   console.log('==================================================');
// //   console.log('[EL POSTING] EARNED LEAVE');
// //   console.log('==================================================');
// //   console.log(
// //     '[EL POSTING] Employee:',
// //     employeeId
// //   );
// //   console.log(
// //     '[EL POSTING] Month:',
// //     `${year}-${month}`
// //   );
// //   console.log(
// //     '[EL POSTING] Earned:',
// //     leave.earned_days
// //   );
// //   const earnedDays =
// //     Number(leave.earned_days || 0);
// //   if (earnedDays <= 0) {
// //     console.log(
// //       '[EL POSTING] No EL to post'
// //     );
// //     return null;
// //   }
// //   // ==========================================================
// //   // DETERMINE PROBATION STATUS
// //   // ==========================================================
// //   const probation =
// //     await EmployeeCommitmentProbation.findOne({
// //       where: {
// //         employee_id: employeeId,
// //       },
// //       transaction,
// //     });

// //   if (!probation) {
// //     console.log(
// //       '[EL POSTING] No probation record found.'
// //     );
// //     return await postDayBasedLeave({
// //       employeeId,
// //       leaveType: elType,
// //       year,
// //       month,
// //       days: earnedDays,
// //       workingDays: attendance.workingDays,
// //       workingHours: attendance.totalWorkingHours,
// //       ruleType: 'REGULAR_EL',
// //       remarks: leave.reason,
// //       transaction,
// //     });
// //   }
// //   console.log(
// //     '[EL POSTING] Probation record:',
// //     probation.toJSON()
// //   );
// //   // ==========================================================
// //   // CURRENT PROBATION STATUS
// //   // ==========================================================
// //   const isCurrentlyOnProbation =
// //     Boolean(probation.on_probation) &&
// //     probation.confirmation_status !== 'Confirmed';
// //   // ==========================================================
// //   // PROBATION EL
// //   // ==========================================================
// //   if (isCurrentlyOnProbation) {
// //     console.log(
// //       '[EL POSTING] Employee is currently on probation'
// //     );
// //     console.log(
// //       '[EL POSTING] Adding EL to probation_el_credit'
// //     );
// //     const currentCredit =
// //       Number(probation.probation_el_credit || 0);
// //     const newCredit =
// //       currentCredit + earnedDays;

// //     probation.probation_el_credit =
// //       newCredit;
// //     await probation.save({
// //       transaction,
// //     });
// //     console.log(
// //       '[EL POSTING] Previous probation EL:',
// //       currentCredit
// //     );
// //     console.log(
// //       '[EL POSTING] New probation EL:',
// //       newCredit
// //     );
// //     // --------------------------------------------------------
// //     // ACCRUAL
// //     // --------------------------------------------------------
// //     let accrualCreated = false;
// //     const [, createdAccrual] =
// //       await EmployeeLeaveAccrual.findOrCreate({
// //         where: {
// //           employee_id: employeeId,
// //           leave_type_id: elType.id,
// //           year,
// //           month,
// //           rule_type: 'PROBATION_EL',
// //         },
// //         defaults: {
// //           employee_id: employeeId,
// //           leave_type_id: elType.id,
// //           year,
// //           month,
// //           rule_type: 'PROBATION_EL',
// //           days_earned: earnedDays,
// //           working_days: attendance.workingDays,
// //           working_hours: attendance.totalWorkingHours,
// //           remarks:
// //             `Probation EL credited to probation balance. ${leave.reason}`,
// //         },
// //         transaction,
// //       });
// //     accrualCreated = createdAccrual;
// //     console.log(
// //       '[EL POSTING] Probation accrual created:',
// //       createdAccrual
// //     );
// //     return {
// //       leave_type_code: 'EL',
// //       leave_type_name: 'Earned Leave',
// //       leave_type_id: elType.id,
// //       days_added: earnedDays,
// //       balance_updated: false,
// //       accrual_created: accrualCreated,
// //       remarks:
// //         `Added ${earnedDays} EL to probation_el_credit.`,
// //     };
// //   }
// //   // ==========================================================
// //   // REGULAR EL
// //   // ==========================================================
// //   console.log(
// //     '[EL POSTING] Employee is not on probation'
// //   );
// //   console.log(
// //     '[EL POSTING] Posting EL to regular leave balance'
// //   );
// //   return await postDayBasedLeave({
// //     employeeId,
// //     leaveType: elType,
// //     year,
// //     month,
// //     days: earnedDays,
// //     workingDays: attendance.workingDays,
// //     workingHours: attendance.totalWorkingHours,
// //     ruleType: 'REGULAR_EL',
// //     remarks: leave.reason,
// //     transaction,
// //   });
// // }

// // ============================================================
// // EARNED LEAVE
// // ============================================================

// async function postEarnedLeave({
//   employeeId,
//   employee,
//   attendance,
//   leave,
//   elType,
//   year,
//   month,
//   transaction,
// }: {
//   employeeId: number;
//   employee: MonthlyLeaveCalculation['employee'];
//   attendance: MonthlyLeaveCalculation['attendance'];
//   leave: MonthlyLeaveCalculation['leaves'][number];
//   elType: LeaveType;
//   year: number;
//   month: number;
//   transaction: any;
// }): Promise<PostingResult | null> {

//   const earnedDays = Number(leave.earned_days || 0);

//   if (earnedDays <= 0) {
//     return null;
//   }

//   // ==========================================================
//   // STEP 1 - FIND PROBATION RECORD
//   // ==========================================================

//   const probation =
//     await EmployeeCommitmentProbation.findOne({
//       where: {
//         employee_id: employeeId,
//       },
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//   // ==========================================================
//   // STEP 2 - NO PROBATION RECORD
//   // ==========================================================

//   if (!probation) {


//     return await postDayBasedLeave({
//       employeeId,
//       leaveType: elType,
//       year,
//       month,
//       days: earnedDays,
//       workingDays: attendance.workingDays,
//       workingHours: attendance.totalWorkingHours,
//       ruleType: 'REGULAR_EL',
//       remarks: leave.reason,
//       transaction,
//     });
//   }

//   // ==========================================================
//   // STEP 3 - DETERMINE CURRENT PROBATION STATUS
//   // ==========================================================

//   const isCurrentlyOnProbation =
//     Boolean(probation.on_probation) &&
//     probation.probation_status !== 'Confirmed';

//   // ==========================================================
//   // STEP 4 - PROBATION EL
//   // ==========================================================

//   if (isCurrentlyOnProbation) {


//     const currentCredit =
//       Number(probation.probation_el_credit || 0);

//     const newCredit =
//       currentCredit + earnedDays;

//     probation.probation_el_credit =
//       newCredit;

//     await probation.save({
//       transaction,
//     });
//     // ========================================================
//     // PROBATION EL ACCRUAL
//     // ========================================================

//     const [, createdAccrual] =
//       await EmployeeLeaveAccrual.findOrCreate({
//         where: {
//           employee_id: employeeId,
//           leave_type_id: elType.id,
//           year,
//           month,
//           rule_type: 'PROBATION_EL',
//         },

//         defaults: {
//           employee_id: employeeId,
//           leave_type_id: elType.id,
//           year,
//           month,
//           rule_type: 'PROBATION_EL',
//           days_earned: earnedDays,
//           working_days: attendance.workingDays,
//           working_hours: attendance.totalWorkingHours,
//           remarks:
//             `Probation EL credited to probation balance. ${leave.reason}`,
//         },

//         transaction,
//       });

//     return {
//       leave_type_code: 'EL',
//       leave_type_name: 'Earned Leave',
//       leave_type_id: elType.id,
//       days_added: earnedDays,
//       balance_updated: false,
//       accrual_created: createdAccrual,
//       remarks:
//         `Added ${earnedDays} EL to probation_el_credit.`,
//     };
//   }
//   // ==========================================================
//   // STEP 5 - REGULAR EL
//   // ==========================================================
//   return await postDayBasedLeave({
//     employeeId,
//     leaveType: elType,
//     year,
//     month,
//     days: earnedDays,
//     workingDays: attendance.workingDays,
//     workingHours: attendance.totalWorkingHours,
//     ruleType: 'REGULAR_EL',
//     remarks: leave.reason,
//     transaction,
//   });
// }



import { Op, Transaction } from 'sequelize';

import { sequelize } from '../../config/database';
import {
  EmployeeCommitmentProbation,
  LeaveType,
} from '../../database/models';

import {
  EmployeeLeaveBalance,
  EmployeeLeaveMinutesBalance,
} from '../../database/models/LeaveModels';

import { EmployeeLeaveAccrual } from '../../database/models/EmployeeLeaveAccrual';
import { MonthlyLeaveCalculation } from './leaveRuleEngine.service';

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface PostingResult {
  leave_type_code: string;
  leave_type_name: string;
  leave_type_id: number;

  days_added: number;

  balance_updated: boolean;
  accrual_created: boolean;

  remarks: string;
}

/* ============================================================================
 * MAIN MONTHLY POSTING
 * ========================================================================== */

export async function postMonthlyLeaveCalculation(
  calculation: MonthlyLeaveCalculation,
): Promise<PostingResult[]> {
  const {
    employee_id,
    year,
    month,
    employee,
    attendance,
    leaves,
  } = calculation;

  /* ------------------------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------------------- */

  if (!employee_id || employee_id <= 0) {
    throw new Error(
      `[POSTING ERROR] Invalid employee ID: ${employee_id}`,
    );
  }

  if (!year || year < 2000) {
    throw new Error(
      `[POSTING ERROR] Invalid year: ${year}`,
    );
  }

  if (!month || month < 1 || month > 12) {
    throw new Error(
      `[POSTING ERROR] Invalid month: ${month}`,
    );
  }

  const companyId = employee.employee.company_id;

  if (!companyId) {
    throw new Error(
      `[POSTING ERROR] Employee ${employee_id} does not have a company_id`,
    );
  }

  /* ------------------------------------------------------------------------
   * TRANSACTION
   * ---------------------------------------------------------------------- */

  const transaction = await sequelize.transaction();

  try {
    /* ======================================================================
     * STEP 1
     * LOAD LEAVE TYPES
     *
     * Seeded codes:
     *
     * EL
     * CL
     * SHORT
     * SPECIAL
     * ==================================================================== */

    const leaveTypes = await LeaveType.findAll({
      where: {
        company_id: companyId,
        code: {
          [Op.in]: ['EL', 'CL', 'SHORT', 'SPECIAL'],
        },
        is_active: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const clType = leaveTypes.find(
      (type) => type.code === 'CL',
    );

    const elType = leaveTypes.find(
      (type) => type.code === 'EL',
    );

    const shortLeaveType = leaveTypes.find(
      (type) => type.code === 'SHORT',
    );

    const specialLeaveType = leaveTypes.find(
      (type) => type.code === 'SPECIAL',
    );

    /* ----------------------------------------------------------------------
     * CL
     * -------------------------------------------------------------------- */

    if (!clType) {
      throw new Error(
        `[POSTING ERROR] CL leave type not found for company ${companyId}`,
      );
    }

    /* ----------------------------------------------------------------------
     * EL
     * -------------------------------------------------------------------- */

    if (!elType) {
      throw new Error(
        `[POSTING ERROR] EL leave type not found for company ${companyId}`,
      );
    }

    /* ----------------------------------------------------------------------
     * SHORT
     *
     * SHORT is optional from a posting perspective.
     * If the company doesn't configure SHORT, monthly posting continues.
     * -------------------------------------------------------------------- */

    if (!shortLeaveType) {
      console.warn(
        `[POSTING WARNING] SHORT leave type not found for company ${companyId}`,
      );
    }

    /* ----------------------------------------------------------------------
     * SPECIAL
     *
     * SPECIAL is handled through LeaveCredit / special-leave logic,
     * not normal monthly EL/CL accrual.
     *
     * Therefore it is intentionally optional here.
     * -------------------------------------------------------------------- */

    if (!specialLeaveType) {
      console.warn(
        `[POSTING WARNING] SPECIAL leave type not found for company ${companyId}`,
      );
    }

    const postingResults: PostingResult[] = [];

    /* ======================================================================
     * STEP 2
     * PROCESS CALCULATED LEAVES
     * ==================================================================== */

    for (const leave of leaves) {
      const earnedDays = Number(leave.earned_days || 0);

      /*
       * Nothing to post.
       */
      if (!leave.eligible || earnedDays <= 0) {
        continue;
      }

      /* ====================================================================
       * CL
       * ================================================================== */

      if (leave.leave_type_code === 'CL') {
        const result = await postDayBasedLeave({
          employeeId: employee_id,
          leaveType: clType,

          year,
          month,

          days: earnedDays,

          workingDays: attendance.workingDays,
          workingHours: attendance.totalWorkingHours,

          /*
           * IMPORTANT:
           * EmployeeLeaveAccrual.rule_type is ENUM:
           *
           * monthly | yearly | custom
           *
           * Therefore DO NOT use MONTHLY_CL.
           */
          ruleType: 'monthly',

          remarks: leave.reason ?? null,

          transaction,
        });

        postingResults.push(result);

        continue;
      }

      /* ====================================================================
       * EL
       * ================================================================== */

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

      /* ====================================================================
       * SHORT LEAVE
       *
       * SHORT is minute based.
       *
       * Seed:
       *
       * monthly_quota_minutes = 60
       * split_chunk_minutes   = 30
       * unit                  = minutes
       *
       * Therefore it MUST NOT be stored in EmployeeLeaveBalance.
       * ================================================================== */

      if (leave.leave_type_code === 'SHORT') {
        if (!shortLeaveType) {
          throw new Error(
            `[POSTING ERROR] SHORT leave type is not configured for company ${companyId}`,
          );
        }

        const result = await postShortLeaveMinutes({
          employeeId: employee_id,

          leaveType: shortLeaveType,

          year,
          month,

          transaction,
        });

        if (result) {
          postingResults.push(result);
        }

        continue;
      }

      /* ====================================================================
       * SPECIAL
       *
       * SPECIAL is not monthly allocated like CL/EL.
       *
       * It is represented by LeaveCredit when earned, e.g. working on
       * a holiday.
       *
       * Therefore do not add SPECIAL to EmployeeLeaveBalance here.
       * ================================================================== */

      if (leave.leave_type_code === 'SPECIAL') {
        console.log(
          `[POSTING] SPECIAL leave is handled through LeaveCredit; skipping monthly balance posting for employee ${employee_id}`,
        );

        continue;
      }

      console.warn(
        `[POSTING WARNING] Unknown leave type ${leave.leave_type_code} for employee ${employee_id}`,
      );
    }

    /* ======================================================================
     * COMMIT
     * ==================================================================== */

    await transaction.commit();

    return postingResults;
  } catch (error) {
    await transaction.rollback();

    throw error;
  }
}

/* ============================================================================
 * DAY BASED LEAVE
 *
 * Used for:
 * - CL
 * - Regular EL
 *
 * EmployeeLeaveBalance:
 *
 * employee_id
 * leave_type_id
 * year
 * allocated
 * used
 * pending
 * carried_forward
 * ========================================================================== */

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

  ruleType: 'monthly' | 'yearly' | 'custom';

  remarks?: string | null;

  transaction: Transaction;
}): Promise<PostingResult> {
  /* ------------------------------------------------------------------------
   * DUPLICATE ACCRUAL CHECK
   * ---------------------------------------------------------------------- */

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
    return {
      leave_type_code: leaveType.code,
      leave_type_name: leaveType.name,
      leave_type_id: leaveType.id,

      days_added: 0,

      balance_updated: false,
      accrual_created: false,

      remarks:
        `Monthly posting already exists for ${year}-${month}.`,
    };
  }

  /* ------------------------------------------------------------------------
   * FIND / CREATE YEARLY BALANCE
   * ---------------------------------------------------------------------- */

  const [balance] =
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

  /* ------------------------------------------------------------------------
   * UPDATE ALLOCATION
   * ---------------------------------------------------------------------- */

  const oldAllocated =
    Number(balance.allocated || 0);

  const newAllocated =
    oldAllocated + days;

  balance.allocated = newAllocated;

  await balance.save({
    transaction,
  });

  /* ------------------------------------------------------------------------
   * CREATE ACCRUAL
   *
   * IMPORTANT:
   *
   * rule_type MUST be one of:
   *
   * monthly
   * yearly
   * custom
   * ---------------------------------------------------------------------- */

  const [, createdAccrual] =
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

        remarks: remarks ?? null,
      },

      transaction,
    });

  if (!createdAccrual) {
    throw new Error(
      `[POSTING ERROR] Duplicate accrual detected for employee ${employeeId}, ` +
        `leave type ${leaveType.id}, ${year}-${month}, rule ${ruleType}`,
    );
  }

  return {
    leave_type_code: leaveType.code,
    leave_type_name: leaveType.name,
    leave_type_id: leaveType.id,

    days_added: days,

    balance_updated: true,
    accrual_created: true,

    remarks:
      remarks ??
      `Added ${days} ${leaveType.code} for ${year}-${month}.`,
  };
}

/* ============================================================================
 * SHORT LEAVE
 *
 * SHORT is minute based.
 *
 * EmployeeLeaveMinutesBalance:
 *
 * employee_id
 * leave_type_id
 * year
 * month
 * allocated_minutes
 * used_minutes
 * pending_minutes
 *
 * Seed:
 *
 * monthly_quota_minutes = 60
 *
 * Therefore every month gets a fresh 60-minute allocation.
 * ========================================================================== */

async function postShortLeaveMinutes({
  employeeId,
  leaveType,

  year,
  month,

  transaction,
}: {
  employeeId: number;
  leaveType: LeaveType;

  year: number;
  month: number;

  transaction: Transaction;
}): Promise<PostingResult | null> {
  /* ------------------------------------------------------------------------
   * VALIDATE LEAVE TYPE
   * ---------------------------------------------------------------------- */

  if (leaveType.unit !== 'minutes') {
    throw new Error(
      `[POSTING ERROR] SHORT leave type ${leaveType.code} must use unit "minutes".`,
    );
  }

  const quotaMinutes =
    Number(leaveType.monthly_quota_minutes || 0);

  if (quotaMinutes <= 0) {
    return null;
  }

  /* ------------------------------------------------------------------------
   * FIND / CREATE MONTHLY MINUTES BALANCE
   * ---------------------------------------------------------------------- */

  const [balance, created] =
    await EmployeeLeaveMinutesBalance.findOrCreate({
      where: {
        employee_id: employeeId,

        leave_type_id: leaveType.id,

        year,
        month,
      },

      defaults: {
        employee_id: employeeId,

        leave_type_id: leaveType.id,

        year,
        month,

        allocated_minutes: quotaMinutes,

        used_minutes: 0,

        pending_minutes: 0,
      },

      transaction,
    });

  /* ------------------------------------------------------------------------
   * IMPORTANT
   *
   * If the balance already exists, DO NOT add another 60 minutes.
   *
   * This prevents:
   *
   * 60 -> 120 -> 180 -> ...
   *
   * when the cron is executed more than once.
   * ---------------------------------------------------------------------- */

  if (!created) {
    return {
      leave_type_code: leaveType.code,
      leave_type_name: leaveType.name,
      leave_type_id: leaveType.id,

      days_added: 0,

      balance_updated: false,
      accrual_created: false,

      remarks:
        `SHORT leave minutes balance already exists for ${year}-${month}.`,
    };
  }

  return {
    leave_type_code: leaveType.code,
    leave_type_name: leaveType.name,
    leave_type_id: leaveType.id,

    /*
     * PostingResult is day-oriented.
     * SHORT is minute-oriented, so days_added remains 0.
     */
    days_added: 0,

    balance_updated: true,

    /*
     * No EmployeeLeaveAccrual row is required for SHORT because
     * the actual monthly balance is maintained in
     * EmployeeLeaveMinutesBalance.
     */
    accrual_created: false,

    remarks:
      `Allocated ${quotaMinutes} minutes of SHORT leave for ${year}-${month}.`,
  };
}

/* ============================================================================
 * EARNED LEAVE
 *
 * EL has special probation behaviour.
 *
 * If employee is on probation:
 *
 *     earned EL -> probation_el_credit
 *
 * Otherwise:
 *
 *     earned EL -> EmployeeLeaveBalance
 *
 * ========================================================================== */

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

  transaction: Transaction;
}): Promise<PostingResult | null> {
  const earnedDays =
    Number(leave.earned_days || 0);

  if (earnedDays <= 0) {
    return null;
  }

  /* ------------------------------------------------------------------------
   * FIND PROBATION RECORD
   * ---------------------------------------------------------------------- */

  const probation =
    await EmployeeCommitmentProbation.findOne({
      where: {
        employee_id: employeeId,
      },

      transaction,

      lock: transaction.LOCK.UPDATE,
    });

  /* ------------------------------------------------------------------------
   * NO PROBATION RECORD
   *
   * Regular EL.
   * ---------------------------------------------------------------------- */

  if (!probation) {
    return await postDayBasedLeave({
      employeeId,

      leaveType: elType,

      year,
      month,

      days: earnedDays,

      workingDays: attendance.workingDays,
      workingHours: attendance.totalWorkingHours,

      /*
       * MUST match EmployeeLeaveAccrual ENUM.
       */
      ruleType: 'monthly',

      remarks: leave.reason ?? null,

      transaction,
    });
  }

  /* ------------------------------------------------------------------------
   * CURRENT PROBATION STATUS
   *
   * Your active service uses probation_status.
   * ---------------------------------------------------------------------- */

  const isCurrentlyOnProbation =
    Boolean(probation.on_probation) &&
    probation.probation_status !== 'Confirmed';

  /* ------------------------------------------------------------------------
   * PROBATION EL
   * ---------------------------------------------------------------------- */

  if (isCurrentlyOnProbation) {
    const currentCredit =
      Number(probation.probation_el_credit || 0);

    const newCredit =
      currentCredit + earnedDays;

    probation.probation_el_credit =
      newCredit;

    await probation.save({
      transaction,
    });

    /* ----------------------------------------------------------------------
     * PROBATION EL ACCRUAL
     *
     * "custom" is used because this is a custom probation rule.
     *
     * Do NOT use PROBATION_EL because that value is not part of
     * EmployeeLeaveAccrual.rule_type ENUM.
     * -------------------------------------------------------------------- */

    const [, createdAccrual] =
      await EmployeeLeaveAccrual.findOrCreate({
        where: {
          employee_id: employeeId,

          leave_type_id: elType.id,

          year,
          month,

          rule_type: 'custom',
        },

        defaults: {
          employee_id: employeeId,

          leave_type_id: elType.id,

          year,
          month,

          rule_type: 'custom',

          days_earned: earnedDays,

          working_days: attendance.workingDays,
          working_hours: attendance.totalWorkingHours,

          remarks:
            `Probation EL credited to probation balance. ` +
            `${leave.reason ?? ''}`.trim(),
        },

        transaction,
      });

    return {
      leave_type_code: elType.code,
      leave_type_name: elType.name,
      leave_type_id: elType.id,

      days_added: earnedDays,

      /*
       * It went to probation_el_credit,
       * not EmployeeLeaveBalance.
       */
      balance_updated: false,

      accrual_created: createdAccrual,

      remarks:
        `Added ${earnedDays} EL to probation_el_credit.`,
    };
  }

  /* ------------------------------------------------------------------------
   * REGULAR EL
   * ---------------------------------------------------------------------- */

  return await postDayBasedLeave({
    employeeId,
    leaveType: elType,
    year,
    month,
    days: earnedDays,
    workingDays: attendance.workingDays,
    workingHours: attendance.totalWorkingHours,
    /*
     * Correct ENUM value.
     */
    ruleType: 'monthly',
    remarks: leave.reason ?? null,
    transaction,
  });
}
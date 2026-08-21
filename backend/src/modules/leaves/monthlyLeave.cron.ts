import { Employee } from '@/database/models';
import cron from 'node-cron';
import { processMonthlyLeave } from './monthlyLeave.service';
// import { Employee } from '@/database/models';
// import { processMonthlyLeave } from './monthlyLeaveProcess.service';

export function startMonthlyLeaveCron() {

  // Runs at 1:00 AM on the 1st day of every month
  cron.schedule(
    '0 1 1 * *',
    async () => {

      console.log('');
      console.log('==================================================');
      console.log('       MONTHLY LEAVE CRON STARTED');
      console.log('==================================================');
      try {
        const now = new Date();
        /*
         * We need to process the PREVIOUS month.
         *
         * Example:
         *
         * Cron runs:
         * 1 September 2026
         *
         * It processes:
         * August 2026
         */
        const processingDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        const year =
          processingDate.getFullYear();

        const month =
          processingDate.getMonth() + 1;

        console.log(
          '[CRON] Processing:',
          `${year}-${month}`
        );

        // ==================================================
        // GET ACTIVE EMPLOYEES
        // ==================================================

        const employees = await Employee.findAll({
          where: {
            // Put your actual active employee condition here
            // is_active: true,
          },
        });

        console.log(
          '[CRON] Employees found:',
          employees.length
        );

        // ==================================================
        // PROCESS EACH EMPLOYEE
        // ==================================================

        for (const employee of employees) {

          try {

            console.log('');
            console.log(
              `[CRON] Processing employee ${employee.id}`
            );

            const result =
              await processMonthlyLeave(
                employee.id,
                year,
                month
              );

            console.log(
              `[CRON] Employee ${employee.id} completed`
            );

            console.log(
              '[CRON] Posting results:',
              result.postingResults.length
            );

          } catch (error) {

            /*
             * IMPORTANT:
             * One employee failure should NOT stop
             * the entire monthly process.
             */

            console.error(
              `[CRON ERROR] Employee ${employee.id} failed`
            );

            console.error(error);
          }
        }

        console.log('');
        console.log('==================================================');
        console.log('       MONTHLY LEAVE CRON COMPLETED');
        console.log('==================================================');

      } catch (error) {

        console.error('');
        console.error('==================================================');
        console.error('       MONTHLY LEAVE CRON FAILED');
        console.error('==================================================');

        console.error(error);

      }
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  console.log(
    '[CRON] Monthly leave cron registered successfully'
  );
}
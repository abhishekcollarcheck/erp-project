import { z } from 'zod';

export const applyLeaveSchema = z.object({
  submission_type: z.enum(['self', 'admin']),
  target_employee_id: z.number().int().positive().optional().nullable(),

  leave_type_id: z.number({ invalid_type_error: 'Leave type is required' }).int().positive(),
  leave_application_type: z.enum(
    ['arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'],
    { errorMap: () => ({ message: 'Leave Application Type is required' }) },
  ),
  // Transient — drives the from_time/to_time requirement, stripped before submit.
  is_short_leave: z.boolean(),

  from_date: z.string().min(1, 'From date is required'),
  to_date: z.string().min(1, 'To date is required'),
  from_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
  to_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),

  days: z.number({ invalid_type_error: 'Total days is required' }).min(0.5, 'Minimum 0.5 days'),
  reason: z.string().trim().min(1, 'Reason is required').max(500),

  hod_name: z.string().min(1, 'Please select Management/HOD'),
  coordinator_name: z.string().min(1, 'Please select coordinator'),

  undertaking_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the undertaking' }),
  }),
})
  .superRefine((data, ctx) => {
    if (data.is_short_leave) {
      if (!data.from_time) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['from_time'], message: 'From time is required for Arrival Late / Leaving Early' });
      }
      if (!data.to_time) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to_time'], message: 'To time is required for Arrival Late / Leaving Early' });
      }
    }
    if (data.submission_type === 'admin' && !data.target_employee_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['target_employee_id'], message: 'Select an employee to apply for' });
    }
  });

export type ApplyLeaveFormData = z.infer<typeof applyLeaveSchema>;

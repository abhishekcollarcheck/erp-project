// import { z } from 'zod';

// export const applyLeaveSchema = z.object({
//   submission_type: z.enum(['self', 'admin']),
//   target_employee_id: z.number().int().positive().optional().nullable(),

//   leave_type_id: z.number({ invalid_type_error: 'Leave type is required' }).int().positive(),
//   leave_application_type: z.enum(
//     ['arrival_late', 'leaving_early', 'first_half', 'second_half', 'full_day'],
//     { errorMap: () => ({ message: 'Leave Application Type is required' }) },
//   ),
//   // Transient — drives the from_time/to_time requirement, stripped before submit.
//   is_short_leave: z.boolean(),

//   from_date: z.string().min(1, 'From date is required'),
//   to_date: z.string().min(1, 'To date is required'),
//   from_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),
//   to_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal('')),

//   days: z.number({ invalid_type_error: 'Total days is required' }).min(0.5, 'Minimum 0.5 days'),
//   reason: z.string().trim().min(1, 'Reason is required').max(500),

//   hod_name: z.string().min(1, 'Please select Management/HOD'),
//   coordinator_name: z.string().min(1, 'Please select coordinator'),

//   undertaking_accepted: z.literal(true, {
//     errorMap: () => ({ message: 'You must accept the undertaking' }),
//   }),
// })
//   .superRefine((data, ctx) => {
//     if (data.is_short_leave) {
//       if (!data.from_time) {
//         ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['from_time'], message: 'From time is required for Arrival Late / Leaving Early' });
//       }
//       if (!data.to_time) {
//         ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to_time'], message: 'To time is required for Arrival Late / Leaving Early' });
//       }
//     }
//     if (data.submission_type === 'admin' && !data.target_employee_id) {
//       ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['target_employee_id'], message: 'Select an employee to apply for' });
//     }
//   });

// export type ApplyLeaveFormData = z.infer<typeof applyLeaveSchema>;



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

  // CORRECTED — was `.min(0.5, 'Minimum 0.5 days')` unconditionally. Short
  // Leave is minutes-based, not days-based: the form now sets `days` to 0
  // for it, and that static minimum would have rejected every Short Leave
  // submission with "Minimum 0.5 days" even though 0 is correct there.
  // The 0.5-day floor now only applies to non-Short-Leave types, enforced
  // below in superRefine where is_short_leave is known.
  days: z.number({ invalid_type_error: 'Total days is required' }).min(0, 'Days cannot be negative'),

  // ADDED — Short Leave (arrival_late / leaving_early) needs how many
  // minutes are being used; nothing here validated that before, matching
  // the gap on the backend and in ApplyLeaveForm.tsx. Required only for
  // Short Leave, enforced below in superRefine — optional here so non-Short
  // Leave submissions (which never set it) still pass.
  minutes: z.number().int().positive().optional(),

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
      if (!data.minutes || data.minutes <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['minutes'], message: 'Minutes is required for Arrival Late / Leaving Early' });
      }
    } else if (data.days < 0.5) {
      // The 0.5-day floor this file used to enforce unconditionally — now
      // scoped to exactly the types it was meant for.
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['days'], message: 'Minimum 0.5 days' });
    }
    if (data.submission_type === 'admin' && !data.target_employee_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['target_employee_id'], message: 'Select an employee to apply for' });
    }
  });

export type ApplyLeaveFormData = z.infer<typeof applyLeaveSchema>;
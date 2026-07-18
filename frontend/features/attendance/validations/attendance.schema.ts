import { z } from 'zod';

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM format')
  .optional()
  .or(z.literal(''));

// ─── Mark / correct attendance manually (HR/admin/manager use) ─────────────
export const markAttendanceSchema = z.object({
  employee_id: z.number().int().positive('Select an employee'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave'], {
    errorMap: () => ({ message: 'Select a status' }),
  }),
  check_in: timeString,
  check_out: timeString,
  remarks: z.string().max(500).trim().optional().or(z.literal('')),
});

export type MarkAttendanceFormData = z.infer<typeof markAttendanceSchema>;

// ─── Regularization request (employee self-service) ────────────────────────
export const createRegularizationSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    requested_check_in: timeString,
    requested_check_out: timeString,
    reason: z
      .string()
      .min(3, 'Please explain what needs correcting')
      .max(500, 'Reason max 500 characters')
      .trim(),
  })
  .refine((data) => !!data.requested_check_in || !!data.requested_check_out, {
    message: 'Provide a corrected check-in or check-out time',
    path: ['requested_check_in'],
  });

export type CreateRegularizationFormData = z.infer<typeof createRegularizationSchema>;

// ─── Approve/reject a regularization request (manager/HR use) ──────────────
export const reviewRegularizationSchema = z.object({
  decision: z.enum(['Approved', 'Rejected'], { errorMap: () => ({ message: 'Select a decision' }) }),
  remarks: z.string().max(500).trim().optional().or(z.literal('')),
});

export type ReviewRegularizationFormData = z.infer<typeof reviewRegularizationSchema>;

// ─── Attendance list filters ────────────────────────────────────────────────
export const attendanceFiltersSchema = z.object({
  search: z.string().max(100).trim().optional().or(z.literal('')),
  status: z.enum(['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave']).optional(),
  source: z.enum(['Biometric', 'Manual', 'Mobile', 'System']).optional(),
  date_from: z.string().optional().or(z.literal('')),
  date_to: z.string().optional().or(z.literal('')),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).optional(),
});

export type AttendanceFiltersFormData = z.infer<typeof attendanceFiltersSchema>;
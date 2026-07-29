import { z } from 'zod';

export const createSubDepartmentSchema = z.object({
  department_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, 'Sub-department name is required')
    .max(200)
    .trim(),
  description: z
    .string()
    .max(500, 'Description max 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

export const updateSubDepartmentSchema = createSubDepartmentSchema
  .extend({
    is_active: z.boolean().optional(),
  })
  .partial();

export type CreateSubDepartmentFormData = z.infer<typeof createSubDepartmentSchema>;
export type UpdateSubDepartmentFormData = z.infer<typeof updateSubDepartmentSchema>;
import { z } from 'zod';

export const createDepartmentSchema = z.object({
  department_name: z
    .string().min(1, 'Department name is required').max(200).trim(),
  department_code: z
    .string().max(20, 'Code max 20 characters').trim().optional().or(z.literal('')),
  head_id:   z.number().int().positive().optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema
  .extend({ is_active: z.boolean().optional() })
  .partial();

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>;

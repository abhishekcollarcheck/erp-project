import { z } from 'zod';

export const createSubDesignationSchema = z.object({
  name: z
    .string()
    .min(1, 'Sub-Designation name is required')
    .max(200, 'Name must be 200 characters or less')
    .trim(),
});

export const updateSubDesignationSchema = createSubDesignationSchema.extend({
  is_active: z.boolean().optional(),
}).partial();

export type CreateSubDesignationFormData = z.infer<typeof createSubDesignationSchema>;
export type UpdateSubDesignationFormData = z.infer<typeof updateSubDesignationSchema>;
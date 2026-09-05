import { z } from 'zod';

const SOURCES  = ['Naukri','LinkedIn','CollarCheck','Referral','Walk-in','Indeed','Direct','Other'] as const;
const GENDERS  = ['Male','Female','Other','Prefer not to say'] as const;
const EDU_MODES = ['Regular','Non Regular','Not Applicable'] as const;
const VEHICLE_TYPES = ['Car','Bike','Scooty'] as const;

const employmentSchema = z.object({
  company: z.string().min(1, 'Company is required').max(200),
  designation: z.string().max(200).optional().or(z.literal('')),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  leaving_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  currently_working: z.boolean().optional(),
});

export const candidateSchema = z.object({
  // ── Required ──────────────────────────────────────────────────────────────
  first_name: z.string().min(1, 'First name is required').max(100).trim(),
  middle_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').max(100).trim(),

  // ── Personal ──────────────────────────────────────────────────────────────
  email: z
    .string().email('Enter a valid email').optional().or(z.literal('')),
  phone_number: z
    .string().regex(/^[+\d\s\-()]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
  gender: z
    .enum([...GENDERS, '']).optional(),
  date_of_birth: z
    .string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format').optional().or(z.literal('')),

  // ── Location ──────────────────────────────────────────────────────────────
  current_state_id: z.number().int().positive().optional().nullable(),
  current_city_id:  z.number().int().positive().optional().nullable(),
  ready_to_relocate: z.boolean().optional().nullable(),
  perm_address_same_as_present: z.boolean().optional(),
  perm_state_id: z.number().int().positive().optional().nullable(),
  perm_city_id:  z.number().int().positive().optional().nullable(),

  // ── Education ─────────────────────────────────────────────────────────────
  qualification:           z.string().max(200).optional().or(z.literal('')),
  course:                  z.string().max(200).optional().or(z.literal('')),
  institute:                z.string().max(200).optional().or(z.literal('')),
  edu_mode:                z.enum([...EDU_MODES, '']).optional(),
  edu_start_date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  edu_end_date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  edu_currently_pursuing:  z.boolean().optional(),

  // ── Professional ──────────────────────────────────────────────────────────
  current_company_name:    z.string().max(200).optional().or(z.literal('')),
  current_company_designation: z.string().max(200).optional().or(z.literal('')),
  location:                z.string().max(200).optional().or(z.literal('')),
  fresher: z.boolean().optional(),
  total_experience: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Min 0').max(60, 'Max 60')
    .optional().nullable(),
  relevant_experience: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0).max(60)
    .optional().nullable(),
  employments: z.array(employmentSchema).max(20).optional(),

  apply_department: z.string().max(200).optional().or(z.literal('')),
  apply_designation: z.string().max(200).optional().or(z.literal('')),

  // ── Compensation ──────────────────────────────────────────────────────────
  current_salary: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0).optional().nullable(),
  expected_salary: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0).optional().nullable(),

  // ── Availability ──────────────────────────────────────────────────────────
  currently_working: z.boolean().optional().nullable(),
  notice_period: z
    .number({ invalid_type_error: 'Enter a number' })
    .int().min(0).optional().nullable(),
  serving_notice_period: z.boolean().optional().nullable(),
  last_working_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  immediate_joiner:      z.boolean().optional(),
  expected_joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  own_vehicle:           z.boolean().optional(),
  vehicle_types:         z.array(z.enum(VEHICLE_TYPES)).optional().nullable(),

  // ── Sourcing ──────────────────────────────────────────────────────────────
  source:           z.enum([...SOURCES, '']).optional(),
  is_internal_referral: z.boolean().optional().nullable(),
  referred_by_employee_id: z.number().int().positive().optional().nullable(),
  reference_source: z.string().max(300).optional().or(z.literal('')),
  remarks:          z.string().max(1000).optional().or(z.literal('')),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;
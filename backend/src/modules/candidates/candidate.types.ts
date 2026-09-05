import type { CandidateStatus, CandidateSource, CandidateGender } from '../../database/models/Candidate';

export interface CandidateEmploymentDto {
  id?: number;
  company: string;
  designation?: string | null;
  joining_date?: Date | null;
  leaving_date?: Date | null;
  currently_working?: boolean;
}

export interface CreateCandidateDto {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email?: string | null;
  phone_number?: string | null;
  gender?: CandidateGender | null;
  date_of_birth?: Date | null;

  current_state_id?: number | null;
  current_city_id?: number | null;
  ready_to_relocate?: boolean | null;
  perm_address_same_as_present?: boolean;
  perm_state_id?: number | null;
  perm_city_id?: number | null;

  current_company_name?: string | null;
  current_company_designation?: string | null;
  qualification?: string | null;
  course?: string | null;
  institute?: string | null;
  edu_mode?: 'Regular' | 'Non Regular' | 'Not Applicable' | null;
  edu_start_date?: Date | null;
  edu_end_date?: Date | null;
  edu_currently_pursuing?: boolean;
  fresher?: boolean;
  location?: string | null;
  total_experience?: number | null;
  relevant_experience?: number | null;
  employments?: CandidateEmploymentDto[];

  apply_department?: string | null;
  apply_designation?: string | null;
  current_salary?: number | null;
  expected_salary?: number | null;
  currently_working?: boolean | null;
  notice_period?: number | null;
  serving_notice_period?: boolean | null;
  last_working_day?: Date | null;
  immediate_joiner?: boolean;
  expected_joining_date?: Date | null;

  own_vehicle?: boolean;
  vehicle_types?: string[] | null;
  source?: CandidateSource | null;
  is_internal_referral?: boolean | null;
  referred_by_employee_id?: number | null;
  reference_source?: string | null;
  remarks?: string | null;
  job_id?: number | null;
}

export type UpdateCandidateDto = Partial<CreateCandidateDto> & { status?: CandidateStatus };

export interface CandidateQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  source?: string;
  min_experience?: number | string;
  max_experience?: number | string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface BulkCandidateRow {
  candidate_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: Date;

  current_state_id?: string | number;
  current_city_id?: string | number;
  ready_to_relocate?: string | boolean;
  perm_address_same_as_present?: string | boolean;
  perm_state_id?: string | number;
  perm_city_id?: string | number;

  current_company_name?: string;
  current_company_designation?: string;
  qualification?: string;
  course?: string;
  institute?: string;
  edu_mode?: string;
  edu_start_date?: Date;
  edu_end_date?: Date;
  edu_currently_pursuing?: string | boolean;
  fresher?: string | boolean;
  location?: string;
  total_experience?: string | number;
  relevant_experience?: string | number;

  // Repeatable employment rows as fixed, numbered flat columns (cap: 3 per candidate row)
  employment_1_company?: string;
  employment_1_designation?: string;
  employment_1_joining_date?: Date;
  employment_1_leaving_date?: Date;
  employment_1_currently_working?: string | boolean;
  employment_2_company?: string;
  employment_2_designation?: string;
  employment_2_joining_date?: Date;
  employment_2_leaving_date?: Date;
  employment_2_currently_working?: string | boolean;
  employment_3_company?: string;
  employment_3_designation?: string;
  employment_3_joining_date?: Date;
  employment_3_leaving_date?: Date;
  employment_3_currently_working?: string | boolean;

  apply_department?: string;
  apply_designation?: string;
  current_salary?: string | number;
  expected_salary?: string | number;
  currently_working?: string | boolean;
  notice_period?: string | number;
  serving_notice_period?: string | boolean;
  last_working_day?: Date;
  immediate_joiner?: string | boolean;
  expected_joining_date?: Date;

  own_vehicle?: string | boolean;
  vehicle_types?: string;
  source?: string;
  is_internal_referral?: string | boolean;
  referred_by_employee_id?: string | number;
  reference_source?: string;
  remarks?: string;
}

export interface BulkUploadResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; name: string; reason: string }[];
  inserted: number[];
}
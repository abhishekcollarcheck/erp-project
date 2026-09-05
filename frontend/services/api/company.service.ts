import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────────
// Mirrors backend/database/models/Company.ts CompanyAttributes, minus fields
// the client never sets directly (id/timestamps handled by the DB;
// employee_count/onboarding_step/setup_completed_at are server-derived).

export interface Company {
  id: number;
  name: string;
  slug: string | null;
  code: string | null;
  logo_url: string | null;
  gstin: string | null;
  pan: string | null;
  cin: string | null;
  phone: string | null;
  email: string | null;
  hr_email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  industry: string | null;
  legal_name: string | null;
  tagline: string | null;
  since_year: number | null;
  google_maps_link: string | null;
  about: string | null;
  theme_color: string | null;
  is_active: boolean;
  notes: string | null;
  employee_code_start: string | null;
  employee_code_end: string | null;
  employee_code_skip: string; // JSON-stringified number[]
  fiscal_year: string;
  timezone: string;
  currency: string;
  date_format: string;
  employee_count?: number; // joined in on list/get endpoints
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Every client-editable Company model field — matches the backend's
// `updateCompany` whitelist (company.controller.ts) exactly, so nothing on
// the model is left unreachable from this form. employee_count/onboarding_step/
// setup_completed_at/created_by are server-derived, never sent by the client.
export interface CompanyFormDto {
  name: string;
  slug?: string;
  legal_name?: string;
  tagline?: string;
  code?: string;
  since_year?: number | null;
  gstin: string;
  pan?: string;
  cin?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  industry?: string;
  google_maps_link?: string;
  phone?: string;
  email?: string;
  hr_email?: string;
  website?: string;
  about?: string;
  logo_url?: string;
  notes?: string;
  fiscal_year?: string;
  timezone?: string;
  currency?: string;
  date_format?: string;
  employee_code_start?: string | null;
  employee_code_end?: string | null;
  employee_code_skip?: string; // JSON-stringified number[] — see the create-company wizard for the comma-separated -> JSON conversion
}

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const companyService = {
  getAll: (params?: CompanyQueryParams) =>
    apiClient.get<unknown, ApiResponse<Company[]>>('/companies', { params }),

  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<Company>>(`/companies/${id}`),

  create: (data: CompanyFormDto) =>
    apiClient.post<unknown, ApiResponse<Company>>('/companies', data),

  update: (id: number, data: Partial<CompanyFormDto>) =>
    apiClient.put<unknown, ApiResponse<Company>>(`/companies/${id}`, data),

  suspend: (id: number) =>
    apiClient.post<unknown, ApiResponse<{ suspended: boolean }>>(`/companies/${id}/suspend`),

  activate: (id: number) =>
    apiClient.post<unknown, ApiResponse<{ activated: boolean }>>(`/companies/${id}/activate`),

  // POST /companies/:id/logo (multer, same in-memory pattern as Employee's
  // profile-photo upload) — persists to /uploads/company-logos/:id/ and
  // updates the company's logo_url.
  uploadLogo: (id: number, file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return apiClient.post<unknown, ApiResponse<{ logo_url: string }>>(
      `/companies/${id}/logo`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
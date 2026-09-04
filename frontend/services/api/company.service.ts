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
  employee_count?: number; // joined in on list/get endpoints
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// Fields the "New company" / "Edit company" form actually sends.
// (Company model has more columns — employee_code_start/end/skip,
// fiscal_year, timezone, currency, date_format — that this screen doesn't
// expose; add them here + to the form if/when you need them.)
export interface CompanyFormDto {
  name: string;
  legal_name?: string;
  tagline?: string;
  code?: string;
  since_year?: number | null;
  gstin: string;
  pan?: string;
  cin?: string;
  address: string;
  google_maps_link?: string;
  phone?: string;
  email?: string;
  hr_email?: string;
  website?: string;
  about?: string;
  logo_url?: string;
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

  // NOT wired up on the backend yet — companyRouter has no logo route.
  // Add something like:
  //   companyRouter.post('/:id/logo', requireCompanyAccess, upload.single('logo'), uploadLogo)
  // using multer (or your existing avatar-upload pattern from Employee), then
  // point this at it. Left here so the frontend call site doesn't need to
  // change later — it's just unused for now.
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
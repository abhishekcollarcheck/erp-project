import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

// ─── Common Query Params ──────────────────────────────────────────────────────
export interface BaseQueryParams {
  search?: string;
  is_active?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

// ─── Entities & DTOs ─────────────────────────────────────────────────────────

// 1. Country
export interface Country {
  id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
export interface CreateCountryDto { name: string; code?: string; }
export interface UpdateCountryDto { name?: string; code?: string; is_active?: boolean; }

// 2. State
export interface State {
  id: number;
  country_id: number;
  name: string;
  code?: string | null;
  is_active: boolean;
  country?: Country;
}
export interface CreateStateDto { country_id: number; name: string; code?: string; }
export interface UpdateStateDto { country_id?: number; name?: string; code?: string; is_active?: boolean; }
export interface StateQueryParams extends BaseQueryParams { country_id?: number; }

// 3. City
export interface City {
  id: number;
  state_id: number;
  name: string;
  is_active: boolean;
  state?: State;
}
export interface CreateCityDto { state_id: number; name: string; }
export interface UpdateCityDto { state_id?: number; name?: string; is_active?: boolean; }
export interface CityQueryParams extends BaseQueryParams { state_id?: number; }

// 4. Site
export interface Site {
  id: number;
  company_id: number;
  city_id?: number | null;
  name: string;
  weekly_off_rule?: string | null;
  is_active: boolean;
  city?: City;
}
export interface CreateSiteDto { company_id: number; city_id?: number; name: string; weekly_off_rule?: string; }
export interface UpdateSiteDto { company_id?: number; city_id?: number; name?: string; weekly_off_rule?: string; is_active?: boolean; }
export interface SiteQueryParams extends BaseQueryParams { company_id?: number; city_id?: number; }

// 5. PayRegister
export interface PayRegister {
  id: number;
  company_id: number;
  state_id?: number | null;
  name: string;
  is_active: boolean;
  state?: State;
}
export interface CreatePayRegisterDto { company_id: number; state_id?: number; name: string; }
export interface UpdatePayRegisterDto { company_id?: number; state_id?: number; name?: string; is_active?: boolean; }
export interface PayRegisterQueryParams extends BaseQueryParams { company_id?: number; state_id?: number; }

// ─── API Services ─────────────────────────────────────────────────────────────

export const countryService = {
  getAll: (params?: BaseQueryParams) => apiClient.get<unknown, ApiResponse<Country[]>>('/countries', { params }),
  getById: (id: number) => apiClient.get<unknown, ApiResponse<Country>>(`/countries/${id}`),
  create: (data: CreateCountryDto) => apiClient.post<unknown, ApiResponse<Country>>('/countries', data),
  update: (id: number, data: UpdateCountryDto) => apiClient.put<unknown, ApiResponse<Country>>(`/countries/${id}`, data),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<null>>(`/countries/${id}`),
};

export const stateService = {
  getAll: (params?: StateQueryParams) => apiClient.get<unknown, ApiResponse<State[]>>('/states', { params }),
  getById: (id: number) => apiClient.get<unknown, ApiResponse<State>>(`/states/${id}`),
  create: (data: CreateStateDto) => apiClient.post<unknown, ApiResponse<State>>('/states', data),
  update: (id: number, data: UpdateStateDto) => apiClient.put<unknown, ApiResponse<State>>(`/states/${id}`, data),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<null>>(`/states/${id}`),
};

export const cityService = {
  getAll: (params?: CityQueryParams) => apiClient.get<unknown, ApiResponse<City[]>>('/cities', { params }),
  getById: (id: number) => apiClient.get<unknown, ApiResponse<City>>(`/cities/${id}`),
  create: (data: CreateCityDto) => apiClient.post<unknown, ApiResponse<City>>('/cities', data),
  update: (id: number, data: UpdateCityDto) => apiClient.put<unknown, ApiResponse<City>>(`/cities/${id}`, data),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<null>>(`/cities/${id}`),
};

export const siteService = {
  getAll: (params?: SiteQueryParams) => apiClient.get<unknown, ApiResponse<Site[]>>('/sites', { params }),
  getById: (id: number) => apiClient.get<unknown, ApiResponse<Site>>(`/sites/${id}`),
  create: (data: CreateSiteDto) => apiClient.post<unknown, ApiResponse<Site>>('/sites', data),
  update: (id: number, data: UpdateSiteDto) => apiClient.put<unknown, ApiResponse<Site>>(`/sites/${id}`, data),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<null>>(`/sites/${id}`),
};

export const payRegisterService = {
  getAll: (params?: PayRegisterQueryParams) => apiClient.get<unknown, ApiResponse<PayRegister[]>>('/pay-registers', { params }),
  getById: (id: number) => apiClient.get<unknown, ApiResponse<PayRegister>>(`/pay-registers/${id}`),
  create: (data: CreatePayRegisterDto) => apiClient.post<unknown, ApiResponse<PayRegister>>('/pay-registers', data),
  update: (id: number, data: UpdatePayRegisterDto) => apiClient.put<unknown, ApiResponse<PayRegister>>(`/pay-registers/${id}`, data),
  delete: (id: number) => apiClient.delete<unknown, ApiResponse<null>>(`/pay-registers/${id}`),
};
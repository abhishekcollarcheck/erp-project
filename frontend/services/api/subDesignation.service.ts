import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';
import type {
  SubDesignation, SubDesignationStats,
  CreateSubDesignationDto, UpdateSubDesignationDto, SubDesignationQueryParams,
} from '../../features/sub-designations/types/subdesignation.types';

export const subDesignationService = {
  // GET /api/sub-designations?is_active=true|false|all&search=eng
  getAll: (params?: SubDesignationQueryParams) =>
    apiClient.get<unknown, ApiResponse<SubDesignation[]>>('/sub-designation', { params }),

  // GET /api/sub-designations/stats
  getStats: () =>
    apiClient.get<unknown, ApiResponse<SubDesignationStats>>('/sub-designation/stats'),

  // GET /api/sub-designations/:id  (includes employees list)
  getById: (id: number) =>
    apiClient.get<unknown, ApiResponse<SubDesignation>>(`/sub-designation/${id}`),

  // POST /api/sub-designations
  create: (data: CreateSubDesignationDto) =>
    apiClient.post<unknown, ApiResponse<SubDesignation>>('/sub-designation', data),

  // PUT /api/sub-designations/:id
  update: (id: number, data: UpdateSubDesignationDto) =>
    apiClient.put<unknown, ApiResponse<SubDesignation>>(`/sub-designation/${id}`, data),

  // PATCH /api/sub-designations/:id/toggle
  toggle: (id: number) =>
    apiClient.patch<unknown, ApiResponse<SubDesignation>>(`/sub-designation/${id}/toggle`),

  // DELETE /api/sub-designations/:id
  delete: (id: number) =>
    apiClient.delete<unknown, ApiResponse<null>>(`/sub-designation/${id}`),
};
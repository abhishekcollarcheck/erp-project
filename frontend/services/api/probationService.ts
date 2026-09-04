import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type ProbationType = 'periods' | 'statuses';

export interface ProbationItem {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const probationService = {
  getAll: async (type: ProbationType): Promise<ProbationItem[]> => {
    const response = await axios.get<ApiResponse<ProbationItem[]>>(`${API_BASE_URL}/probation/${type}`);
    return response.data.data || [];
  },

  getById: async (type: ProbationType, id: number): Promise<ProbationItem> => {
    const response = await axios.get<ApiResponse<ProbationItem>>(`${API_BASE_URL}/probation/${type}/${id}`);
    return response.data.data!;
  },

  create: async (type: ProbationType, name: string, code?: string): Promise<ProbationItem> => {
    const response = await axios.post<ApiResponse<ProbationItem>>(`${API_BASE_URL}/probation/${type}`, {
      name,
      code,
    });
    return response.data.data!;
  },

  update: async (
    type: ProbationType,
    id: number,
    payload: { name?: string; code?: string; is_active?: boolean }
  ): Promise<ProbationItem> => {
    const response = await axios.put<ApiResponse<ProbationItem>>(
      `${API_BASE_URL}/probation/${type}/${id}`,
      payload
    );
    return response.data.data!;
  },

  updateOrder: async (type: ProbationType, ordered_ids: number[]): Promise<void> => {
    await axios.put(`${API_BASE_URL}/probation/${type}/reorder`, { ordered_ids });
  },

  delete: async (type: ProbationType, id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/probation/${type}/${id}`);
  },
};
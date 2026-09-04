import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Bond {
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

export const bondService = {
  getAll: async (): Promise<Bond[]> => {
    const response = await axios.get<ApiResponse<Bond[]>>(`${API_BASE_URL}/bonds`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Bond> => {
    const response = await axios.get<ApiResponse<Bond>>(`${API_BASE_URL}/bonds/${id}`);
    return response.data.data!;
  },

  create: async (name: string, code?: string): Promise<Bond> => {
    const response = await axios.post<ApiResponse<Bond>>(`${API_BASE_URL}/bonds`, {
      name,
      code,
    });
    return response.data.data!;
  },

  update: async (
    id: number,
    payload: { name?: string; code?: string; is_active?: boolean }
  ): Promise<Bond> => {
    const response = await axios.put<ApiResponse<Bond>>(
      `${API_BASE_URL}/bonds/${id}`,
      payload
    );
    return response.data.data!;
  },

  updateOrder: async (ordered_ids: number[]): Promise<void> => {
    await axios.put(`${API_BASE_URL}/bonds/reorder`, { ordered_ids });
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/bonds/${id}`);
  },
};
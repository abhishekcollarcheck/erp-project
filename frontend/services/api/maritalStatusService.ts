import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface MaritalStatus {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const maritalStatusService = {
  getAll: async (): Promise<MaritalStatus[]> => {
    const res = await axios.get<{ data: MaritalStatus[] }>(`${API_BASE_URL}/marital-statuses`);
    return res.data.data;
  },

  createMaritalStatus: async (name: string): Promise<MaritalStatus> => {
    const res = await axios.post<{ data: MaritalStatus }>(`${API_BASE_URL}/marital-statuses`, { name });
    return res.data.data;
  },

  updateMaritalStatus: async (id: number, name: string): Promise<MaritalStatus> => {
    const res = await axios.put<{ data: MaritalStatus }>(`${API_BASE_URL}/marital-statuses/${id}`, { name });
    return res.data.data;
  },

  deleteMaritalStatus: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/marital-statuses/${id}`);
  },
};
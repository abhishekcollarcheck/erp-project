import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Nationality {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const nationalityService = {
  getAll: async (): Promise<Nationality[]> => {
    const res = await axios.get<{ data: Nationality[] }>(`${API_BASE_URL}/nationalities`);
    return res.data.data;
  },

  createNationality: async (name: string): Promise<Nationality> => {
    const res = await axios.post<{ data: Nationality }>(`${API_BASE_URL}/nationalities`, { name });
    return res.data.data;
  },

  updateNationality: async (id: number, name: string): Promise<Nationality> => {
    const res = await axios.put<{ data: Nationality }>(`${API_BASE_URL}/nationalities/${id}`, { name });
    return res.data.data;
  },

  deleteNationality: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/nationalities/${id}`);
  },
};
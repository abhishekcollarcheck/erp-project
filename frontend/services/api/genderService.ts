import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Gender {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const genderService = {
  getAll: async (): Promise<Gender[]> => {
    const res = await axios.get<{ data: Gender[] }>(`${API_BASE_URL}/genders`);
    return res.data.data;
  },

  createGender: async (name: string): Promise<Gender> => {
    const res = await axios.post<{ data: Gender }>(`${API_BASE_URL}/genders`, { name });
    return res.data.data;
  },

  updateGender: async (id: number, name: string): Promise<Gender> => {
    const res = await axios.put<{ data: Gender }>(`${API_BASE_URL}/genders/${id}`, { name });
    return res.data.data;
  },

  deleteGender: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/genders/${id}`);
  },
};
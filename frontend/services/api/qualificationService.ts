import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Qualification {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const qualificationService = {
  getAll: async (): Promise<Qualification[]> => {
    const res = await axios.get<{ data: Qualification[] }>(`${API_BASE_URL}/qualifications`);
    return res.data.data;
  },

  createQualification: async (name: string): Promise<Qualification> => {
    const res = await axios.post<{ data: Qualification }>(`${API_BASE_URL}/qualifications`, { name });
    return res.data.data;
  },

  updateQualification: async (id: number, name: string): Promise<Qualification> => {
    const res = await axios.put<{ data: Qualification }>(`${API_BASE_URL}/qualifications/${id}`, { name });
    return res.data.data;
  },

  deleteQualification: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/qualifications/${id}`);
  },
};
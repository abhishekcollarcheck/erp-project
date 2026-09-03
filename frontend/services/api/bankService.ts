import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Bank {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const bankService = {
  getAll: async (): Promise<Bank[]> => {
    const res = await axios.get<{ data: Bank[] }>(`${API_BASE_URL}/banks`);
    return res.data.data;
  },

  createBank: async (name: string): Promise<Bank> => {
    const res = await axios.post<{ data: Bank }>(`${API_BASE_URL}/banks`, { name });
    return res.data.data;
  },

  updateBank: async (id: number, name: string): Promise<Bank> => {
    const res = await axios.put<{ data: Bank }>(`${API_BASE_URL}/banks/${id}`, { name });
    return res.data.data;
  },

  deleteBank: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/banks/${id}`);
  },
};
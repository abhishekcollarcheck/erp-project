import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Salutation {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const salutationService = {
  getAll: async (): Promise<Salutation[]> => {
    const res = await axios.get<{ data: Salutation[] }>(`${API_BASE_URL}/salutations`);
    return res.data.data;
  },

  createSalutation: async (name: string): Promise<Salutation> => {
    const res = await axios.post<{ data: Salutation }>(`${API_BASE_URL}/salutations`, { name });
    return res.data.data;
  },

  updateSalutation: async (id: number, name: string): Promise<Salutation> => {
    const res = await axios.put<{ data: Salutation }>(`${API_BASE_URL}/salutations/${id}`, { name });
    return res.data.data;
  },

  deleteSalutation: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/salutations/${id}`);
  },
};
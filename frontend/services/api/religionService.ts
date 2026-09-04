import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Religion {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const religionService = {
  getAll: async (): Promise<Religion[]> => {
    const res = await axios.get<{ data: Religion[] }>(`${API_BASE_URL}/religions`);
    return res.data.data;
  },

  createReligion: async (name: string): Promise<Religion> => {
    const res = await axios.post<{ data: Religion }>(`${API_BASE_URL}/religions`, { name });
    return res.data.data;
  },

  updateReligion: async (id: number, name: string): Promise<Religion> => {
    const res = await axios.put<{ data: Religion }>(`${API_BASE_URL}/religions/${id}`, { name });
    return res.data.data;
  },

  deleteReligion: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/religions/${id}`);
  },
};
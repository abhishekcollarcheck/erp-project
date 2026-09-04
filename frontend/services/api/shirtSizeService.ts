import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ShirtSize {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const shirtSizeService = {
  getAll: async (): Promise<ShirtSize[]> => {
    const res = await axios.get<{ data: ShirtSize[] }>(`${API_BASE_URL}/shirt-sizes`);
    return res.data.data;
  },

  createShirtSize: async (name: string): Promise<ShirtSize> => {
    const res = await axios.post<{ data: ShirtSize }>(`${API_BASE_URL}/shirt-sizes`, { name });
    return res.data.data;
  },

  updateShirtSize: async (id: number, name: string): Promise<ShirtSize> => {
    const res = await axios.put<{ data: ShirtSize }>(`${API_BASE_URL}/shirt-sizes/${id}`, { name });
    return res.data.data;
  },

  deleteShirtSize: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/shirt-sizes/${id}`);
  },
};
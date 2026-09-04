import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface BloodGroup {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const bloodGroupService = {
  getAll: async (): Promise<BloodGroup[]> => {
    const res = await axios.get<{ data: BloodGroup[] }>(`${API_BASE_URL}/blood-groups`);
    return res.data.data;
  },

  createBloodGroup: async (name: string): Promise<BloodGroup> => {
    const res = await axios.post<{ data: BloodGroup }>(`${API_BASE_URL}/blood-groups`, { name });
    return res.data.data;
  },

  updateBloodGroup: async (id: number, name: string): Promise<BloodGroup> => {
    const res = await axios.put<{ data: BloodGroup }>(`${API_BASE_URL}/blood-groups/${id}`, { name });
    return res.data.data;
  },

  deleteBloodGroup: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/blood-groups/${id}`);
  },
};
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface HouseType {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const houseTypeService = {
  getAll: async (): Promise<HouseType[]> => {
    const res = await axios.get<{ data: HouseType[] }>(`${API_BASE_URL}/house-types`);
    return res.data.data;
  },

  createHouseType: async (name: string): Promise<HouseType> => {
    const res = await axios.post<{ data: HouseType }>(`${API_BASE_URL}/house-types`, { name });
    return res.data.data;
  },

  updateHouseType: async (id: number, name: string): Promise<HouseType> => {
    const res = await axios.put<{ data: HouseType }>(`${API_BASE_URL}/house-types/${id}`, { name });
    return res.data.data;
  },

  deleteHouseType: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/house-types/${id}`);
  },
};
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface EducationMode {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const educationModeService = {
  getAll: async (): Promise<EducationMode[]> => {
    const res = await axios.get<{ data: EducationMode[] }>(`${API_BASE_URL}/education-modes`);
    return res.data.data;
  },

  createEducationMode: async (name: string): Promise<EducationMode> => {
    const res = await axios.post<{ data: EducationMode }>(`${API_BASE_URL}/education-modes`, { name });
    return res.data.data;
  },

  updateEducationMode: async (id: number, name: string): Promise<EducationMode> => {
    const res = await axios.put<{ data: EducationMode }>(`${API_BASE_URL}/education-modes/${id}`, { name });
    return res.data.data;
  },

  deleteEducationMode: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/education-modes/${id}`);
  },
};
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type WeekDay = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface NthRule {
  weeks: number[]; // e.g., [2, 4]
  day: WeekDay;
}

export interface WeeklyOffPreset {
  id: number;
  name: string;
  always_off: WeekDay[];
  nth_off_rules: NthRule[];
  is_active: boolean;
}

export interface CreateWeeklyOffPayload {
  name: string;
  always_off: WeekDay[];
  nth_off_rules: NthRule[];
}

export interface UpdateWeeklyOffPayload {
  name?: string;
  always_off?: WeekDay[];
  nth_off_rules?: NthRule[];
  is_active?: boolean;
}

export const weeklyOffService = {
  getAll: async (): Promise<WeeklyOffPreset[]> => {
    const res = await axios.get(`${API_BASE_URL}/weekly-off-preset`);
    return res.data.data;
  },

  getById: async (id: number): Promise<WeeklyOffPreset> => {
    const res = await axios.get(`${API_BASE_URL}/weekly-off-preset/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateWeeklyOffPayload): Promise<WeeklyOffPreset> => {
    const res = await axios.post(`${API_BASE_URL}/weekly-off-preset`, payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateWeeklyOffPayload): Promise<WeeklyOffPreset> => {
    const res = await axios.put(`${API_BASE_URL}/weekly-off-preset/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/weekly-off-preset/${id}`);
  },
};
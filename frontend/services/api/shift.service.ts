import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Shift {
  id: number;
  label: string;
  start_time: string | null;
  end_time: string | null;
  half_day_time: string | null;
  day_span: '1 day' | '2 days';
  is_active: boolean;
}

export interface CreateShiftPayload {
  label: string;
  start_time?: string | null;
  end_time?: string | null;
  half_day_time?: string | null;
  day_span?: '1 day' | '2 days';
}

export interface UpdateShiftPayload {
  label?: string;
  start_time?: string | null;
  end_time?: string | null;
  half_day_time?: string | null;
  day_span?: '1 day' | '2 days';
  is_active?: boolean;
}

export const shiftService = {
  getAll: async (): Promise<Shift[]> => {
    const res = await axios.get(`${API_BASE_URL}/shifts`);
    return res.data.data;
  },

  getById: async (id: number): Promise<Shift> => {
    const res = await axios.get(`${API_BASE_URL}/shifts/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateShiftPayload): Promise<Shift> => {
    const res = await axios.post(`${API_BASE_URL}/shifts`, payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateShiftPayload): Promise<Shift> => {
    const res = await axios.put(`${API_BASE_URL}/shifts/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/shifts/${id}`);
  },
};
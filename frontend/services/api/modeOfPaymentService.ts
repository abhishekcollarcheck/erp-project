import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ModeOfPayment {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const modeOfPaymentService = {
  getAll: async (): Promise<ModeOfPayment[]> => {
    const res = await axios.get<{ data: ModeOfPayment[] }>(`${API_BASE_URL}/modes-of-payment`);
    return res.data.data;
  },

  createModeOfPayment: async (name: string): Promise<ModeOfPayment> => {
    const res = await axios.post<{ data: ModeOfPayment }>(`${API_BASE_URL}/modes-of-payment`, { name });
    return res.data.data;
  },

  updateModeOfPayment: async (id: number, name: string): Promise<ModeOfPayment> => {
    const res = await axios.put<{ data: ModeOfPayment }>(`${API_BASE_URL}/modes-of-payment/${id}`, { name });
    return res.data.data;
  },

  deleteModeOfPayment: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/modes-of-payment/${id}`);
  },
};
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface InsuredAmount {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

export interface InsuredAmountBracket {
  id: number;
  min_salary: number;
  max_salary: number | null;
  insured_amount_id: number;
  insuredAmount?: InsuredAmount;
}

export interface InsuredDataResponse {
  masters: InsuredAmount[];
  brackets: InsuredAmountBracket[];
}

export const insuredAmountService = {
  getAll: async (): Promise<InsuredDataResponse> => {
    const res = await axios.get<{ data: InsuredDataResponse }>(`${API_BASE_URL}/insured-amounts`);
    return res.data.data;
  },

  createMaster: async (name: string): Promise<InsuredAmount> => {
    const res = await axios.post<{ data: InsuredAmount }>(`${API_BASE_URL}/insured-amounts`, { name });
    return res.data.data;
  },

  updateMaster: async (id: number, name: string): Promise<InsuredAmount> => {
    const res = await axios.put<{ data: InsuredAmount }>(`${API_BASE_URL}/insured-amounts/${id}`, { name });
    return res.data.data;
  },

  deleteMaster: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/insured-amounts/${id}`);
  },

  createBracket: async (min_salary: number, max_salary: number | null, insured_amount_id: number) => {
    const res = await axios.post(`${API_BASE_URL}/insured-amounts/brackets`, { min_salary, max_salary, insured_amount_id });
    return res.data.data;
  },

  updateBracket: async (id: number, payload: Partial<InsuredAmountBracket>) => {
    const res = await axios.put(`${API_BASE_URL}/insured-amounts/brackets/${id}`, payload);
    return res.data.data;
  },

  deleteBracket: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/insured-amounts/brackets/${id}`);
  },
};
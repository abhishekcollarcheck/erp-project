import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface EmployeeStatus {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CreateEmployeeStatusPayload {
  name: string;
  code?: string;
}

export interface UpdateEmployeeStatusPayload {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export const employeeStatusService = {
  getAll: async (): Promise<EmployeeStatus[]> => {
    const response = await axios.get(`${API_BASE_URL}/employee-statuses`);
    return response.data.data;
  },

  getById: async (id: number): Promise<EmployeeStatus> => {
    const response = await axios.get(`${API_BASE_URL}/employee-statuses/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateEmployeeStatusPayload): Promise<EmployeeStatus> => {
    const response = await axios.post(`${API_BASE_URL}/employee-statuses`, payload);
    return response.data.data;
  },

  update: async (id: number, payload: UpdateEmployeeStatusPayload): Promise<EmployeeStatus> => {
    const response = await axios.put(`${API_BASE_URL}/employee-statuses/${id}`, payload);
    return response.data.data;
  },

  updateOrder: async (orderedIds: number[]): Promise<void> => {
    await axios.put(`${API_BASE_URL}/employee-statuses/reorder`, { ordered_ids: orderedIds });
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/employee-statuses/${id}`);
  },
};
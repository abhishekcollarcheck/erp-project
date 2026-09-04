// import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// export interface EmployeeType {
//   id: number;
//   name: string;
//   code: string | null;
//   display_order: number;
//   is_active: boolean;
// }

// export interface CreateEmployeeTypePayload {
//   name: string;
//   code?: string;
// }

// export interface UpdateEmployeeTypePayload {
//   name?: string;
//   code?: string;
//   is_active?: boolean;
// }

// export const employeeTypeService = {
//   getAll: async (): Promise<EmployeeType[]> => {
//     const response = await axios.get(`${API_BASE_URL}/employee-types`);
//     return response.data.data;
//   },

//   getById: async (id: number): Promise<EmployeeType> => {
//     const response = await axios.get(`${API_BASE_URL}/employee-types/${id}`);
//     return response.data.data;
//   },

//   create: async (payload: CreateEmployeeTypePayload): Promise<EmployeeType> => {
//     const response = await axios.post(`${API_BASE_URL}/employee-types`, payload);
//     return response.data.data;
//   },

//   update: async (id: number, payload: UpdateEmployeeTypePayload): Promise<EmployeeType> => {
//     const response = await axios.put(`${API_BASE_URL}/employee-types/${id}`, payload);
//     return response.data.data;
//   },

//   updateOrder: async (orderedIds: number[]): Promise<void> => {
//     await axios.put(`${API_BASE_URL}/employee-types/reorder`, { ordered_ids: orderedIds });
//   },

//   delete: async (id: number): Promise<void> => {
//     await axios.delete(`${API_BASE_URL}/employee-types/${id}`);
//   },
// };

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface EmployeeType {
  id: number;
  name: string;
  code: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CreateEmployeeTypePayload {
  name: string;
  code?: string;
}

export interface UpdateEmployeeTypePayload {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export const employeeTypeService = {
  getAll: async (): Promise<EmployeeType[]> => {
    const response = await axios.get(`${API_BASE_URL}/employee-types`);
    return response.data.data;
  },

  getById: async (id: number): Promise<EmployeeType> => {
    const response = await axios.get(`${API_BASE_URL}/employee-types/${id}`);
    return response.data.data;
  },

  create: async (payload: CreateEmployeeTypePayload): Promise<EmployeeType> => {
    const response = await axios.post(`${API_BASE_URL}/employee-types`, payload);
    return response.data.data;
  },

  update: async (id: number, payload: UpdateEmployeeTypePayload): Promise<EmployeeType> => {
    const response = await axios.put(`${API_BASE_URL}/employee-types/${id}`, payload);
    return response.data.data;
  },

  updateOrder: async (orderedIds: number[]): Promise<void> => {
    await axios.put(`${API_BASE_URL}/employee-types/reorder`, { ordered_ids: orderedIds });
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/employee-types/${id}`);
  },
};
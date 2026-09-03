import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface EmergencyRelationship {
  id: number;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
}

export const emergencyRelationshipService = {
  getAll: async (): Promise<EmergencyRelationship[]> => {
    const res = await axios.get<{ data: EmergencyRelationship[] }>(
      `${API_BASE_URL}/emergency-relationships`
    );
    return res.data.data;
  },

  createEmergencyRelationship: async (name: string): Promise<EmergencyRelationship> => {
    const res = await axios.post<{ data: EmergencyRelationship }>(
      `${API_BASE_URL}/emergency-relationships`,
      { name }
    );
    return res.data.data;
  },

  updateEmergencyRelationship: async (id: number, name: string): Promise<EmergencyRelationship> => {
    const res = await axios.put<{ data: EmergencyRelationship }>(
      `${API_BASE_URL}/emergency-relationships/${id}`,
      { name }
    );
    return res.data.data;
  },

  deleteEmergencyRelationship: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/emergency-relationships/${id}`);
  },
};
import apiClient from './client';
import type { ApiResponse } from '../../types/api.types';

export type ShiftCategory = 'STANDARD' | 'NAT';

export interface Shift {
  id: number;
  label: string;
  category: ShiftCategory;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  crosses_midnight: boolean;
}

export const shiftService = {
  getAll: () => apiClient.get<unknown, ApiResponse<Shift[]>>('/shifts'),
};
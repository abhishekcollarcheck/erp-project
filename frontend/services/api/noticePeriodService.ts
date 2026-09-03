    import axios from 'axios';

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    export interface NoticePeriod {
    id: number;
    name: string;
    code: string | null;
    display_order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    }

    export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    }

    export const noticePeriodService = {
    getAll: async (): Promise<NoticePeriod[]> => {
        const response = await axios.get<ApiResponse<NoticePeriod[]>>(`${API_BASE_URL}/notice-periods`);
        return response.data.data || [];
    },

    getById: async (id: number): Promise<NoticePeriod> => {
        const response = await axios.get<ApiResponse<NoticePeriod>>(`${API_BASE_URL}/notice-periods/${id}`);
        return response.data.data!;
    },

    create: async (name: string, code?: string): Promise<NoticePeriod> => {
        const response = await axios.post<ApiResponse<NoticePeriod>>(`${API_BASE_URL}/notice-periods`, {
        name,
        code,
        });
        return response.data.data!;
    },

    update: async (
        id: number,
        payload: { name?: string; code?: string; is_active?: boolean }
    ): Promise<NoticePeriod> => {
        const response = await axios.put<ApiResponse<NoticePeriod>>(
        `${API_BASE_URL}/notice-periods/${id}`,
        payload
        );
        return response.data.data!;
    },

    updateOrder: async (ordered_ids: number[]): Promise<void> => {
        await axios.put(`${API_BASE_URL}/notice-periods/reorder`, { ordered_ids });
    },

    delete: async (id: number): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/notice-periods/${id}`);
    },
    };
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api/client';
import type { ApiResponse } from '../types/api.types';

export interface FieldPermission {
  can_view: boolean;
  can_edit: boolean;
  can_copy: boolean;
  can_download: boolean;
  is_masked: boolean;
}

export function useFieldPermissions(formId: number) {
  return useQuery({
    queryKey: ['my-field-permissions', formId],
    queryFn: () =>
      apiClient.get<unknown, ApiResponse<Record<string, FieldPermission>>>(
        `/field-permissions/forms/${formId}/resolve`
      ),
    enabled: formId > 0,
    select: r => r.data ?? {},
    staleTime: 5 * 60_000,
  });
}
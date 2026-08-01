import apiClient from '../../../services/api/client';
import { getStaticOptions, FieldOption } from '../constants/staticOptions';
import { useQuery } from '@tanstack/react-query';

export function useDynamicOptions({
  source,
  mergeStatic = false, // NEW parameter
}: {
  source: string | null | undefined;
  mergeStatic?: boolean;
}) {
  const staticOpts = getStaticOptions(source || '');
  return useQuery({
    queryKey: ['dyn-source', source, mergeStatic],
    queryFn: async (): Promise<FieldOption[]> => {
      if (!source || source === 'custom') return staticOpts;

      try {
        const res = await apiClient.get(`/rbac/dynamic-source/${source}`);
        // Merge: dynamic first, then static
        return [...(res.data || []), ...staticOpts];
      } catch {
        // Fallback to static if API fails
        return staticOpts;
      }
    },
    enabled: !!source && source !== 'custom',
    staleTime: 5 * 60 * 1000,
  });
}
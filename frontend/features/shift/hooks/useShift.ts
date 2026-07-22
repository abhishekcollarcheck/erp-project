import { useQuery } from '@tanstack/react-query';
import { shiftService } from '../../../services/api/shift.service';

export function useShifts() {
  return useQuery({
    queryKey: ['shifts', 'list'],
    queryFn: () => shiftService.getAll(),
    staleTime: 5 * 60_000, // shift definitions change rarely — safe to cache longer
    select: (res) => res.data.map((s) => ({ label: s.label, value: s.id })),
  });
}
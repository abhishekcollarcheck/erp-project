// import { shiftService } from '@';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService, CreateShiftPayload, UpdateShiftPayload } from '../../../services/api/shift.service';

export const SHIFTS_QUERY_KEY = ['shifts'];

export const useShifts = () => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEY,
    queryFn: shiftService.getAll,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => shiftService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_QUERY_KEY });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftPayload }) =>
      shiftService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_QUERY_KEY });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => shiftService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFTS_QUERY_KEY });
    },
  });
};


export const useShiftOptions = () => {
  return useQuery({
    queryKey: SHIFTS_QUERY_KEY,
    queryFn: shiftService.getAll,
    select: (shifts) =>
      shifts.map((shift) => ({
        value: shift.id,
        label: shift.label,
      })),
  });
};
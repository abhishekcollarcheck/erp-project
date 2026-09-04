import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  attendanceRulesApi,
  CreateSaturdayRuleDto,
  UpdateSaturdayRuleDto,
  CreateGraceMinuteDto,
  UpdateGraceMinuteDto,
  CreateAttendanceTypeDto,
  UpdateAttendanceTypeDto,
} from '@/services/api/attendance-rule.service';


// ─── Query Keys ────────────────────────────────────────────────────────────
export const ATTENDANCE_RULES_KEYS = {
  saturdayRules: ['saturday-rules-list'] as const,
  graceMinutes: ['grace-minutes-list'] as const,
  attendanceTypes: ['attendance-types-list'] as const,
};

// ─── SATURDAY RULES HOOKS ──────────────────────────────────────────────────
export const useSaturdayRulesData = () => {
  return useQuery({
    queryKey: ATTENDANCE_RULES_KEYS.saturdayRules,
    queryFn: () => attendanceRulesApi.getAllSaturdayRules(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSaturdayRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSaturdayRuleDto) => attendanceRulesApi.createSaturdayRule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.saturdayRules }),
  });
};

export const useUpdateSaturdayRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSaturdayRuleDto }) =>
      attendanceRulesApi.updateSaturdayRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.saturdayRules }),
  });
};

export const useDeleteSaturdayRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceRulesApi.deleteSaturdayRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.saturdayRules }),
  });
};

export const useDeleteAllSaturdayRules = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceRulesApi.deleteAllSaturdayRules(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.saturdayRules }),
  });
};

// ─── GRACE MINUTES HOOKS ───────────────────────────────────────────────────
export const useGraceMinutesData = () => {
  return useQuery({
    queryKey: ATTENDANCE_RULES_KEYS.graceMinutes,
    queryFn: () => attendanceRulesApi.getAllGraceMinutes(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateGraceMinute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGraceMinuteDto) => attendanceRulesApi.createGraceMinute(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.graceMinutes }),
  });
};

export const useUpdateGraceMinute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGraceMinuteDto }) =>
      attendanceRulesApi.updateGraceMinute(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.graceMinutes }),
  });
};

export const useDeleteGraceMinute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceRulesApi.deleteGraceMinute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.graceMinutes }),
  });
};

export const useDeleteAllGraceMinutes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceRulesApi.deleteAllGraceMinutes(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.graceMinutes }),
  });
};

// ─── ATTENDANCE TYPES HOOKS ────────────────────────────────────────────────
export const useAttendanceTypesData = () => {
  return useQuery({
    queryKey: ATTENDANCE_RULES_KEYS.attendanceTypes,
    queryFn: () => attendanceRulesApi.getAllAttendanceTypes(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

export const useCreateAttendanceType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAttendanceTypeDto) => attendanceRulesApi.createAttendanceType(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.attendanceTypes }),
  });
};

export const useUpdateAttendanceType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAttendanceTypeDto }) =>
      attendanceRulesApi.updateAttendanceType(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.attendanceTypes }),
  });
};

export const useDeleteAttendanceType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceRulesApi.deleteAttendanceType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.attendanceTypes }),
  });
};

export const useDeleteAllAttendanceTypes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceRulesApi.deleteAllAttendanceTypes(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ATTENDANCE_RULES_KEYS.attendanceTypes }),
  });
};
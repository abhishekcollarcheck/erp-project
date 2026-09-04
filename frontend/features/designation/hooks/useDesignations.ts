// 'use client';

// import {
//   useQuery,
//   useMutation,
//   useQueryClient,
// } from '@tanstack/react-query';

// import {
//   designationService,
//   type DesignationQueryParams,
//   type SubDesignationQueryParams,
//   type CreateDesignationDto,
//   type UpdateDesignationDto,
//   type CreateSubDesignationDto,
//   type UpdateSubDesignationDto,
// } from '../../../services/api/designation.service';
// import { showToast } from '../../../utils/toast';

// // ─────────────────────────────────────────────────────────────────────────────
// // QUERY KEYS FACTORY
// // ─────────────────────────────────────────────────────────────────────────────

// const KEYS = {
//   designations: {
//     all: ['designations'] as const,
//     lists: () => ['designations', 'list'] as const,
//     list: (params?: DesignationQueryParams) => ['designations', 'list', params] as const,
//     detail: (id: number) => ['designations', 'detail', id] as const,
//   },
//   subDesignations: {
//     all: ['sub-designations'] as const,
//     lists: () => ['sub-designations', 'list'] as const,
//     list: (params?: SubDesignationQueryParams) => ['sub-designations', 'list', params] as const,
//   },
// };

// function getErrorMessage(err: unknown, fallback: string): string {
//   if (typeof err === 'object' && err !== null && 'response' in err) {
//     const res = (err as any).response;
//     if (res?.data?.message) return res.data.message;
//   }
//   if (err instanceof Error) return err.message;
//   return fallback;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // DESIGNATION HOOKS
// // ─────────────────────────────────────────────────────────────────────────────

// export function useDesignations(params?: DesignationQueryParams) {
//   return useQuery({
//     queryKey: KEYS.designations.list(params),
//     queryFn: async () => {
//       const res = await designationService.getAll(params);
//       return res.data;
//     },
//     staleTime: 2 * 60_000,
//   });
// }

// export function useDesignation(id: number | null) {
//   return useQuery({
//     queryKey: KEYS.designations.detail(id ?? 0),
//     queryFn: async () => {
//       const res = await designationService.getById(id as number);
//       return res.data;
//     },
//     enabled: Boolean(id && id > 0),
//     staleTime: 60_000,
//   });
// }

// export function useCreateDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateDesignationDto) => designationService.create(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.designations.all });
//       qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
//       const name = res.data?.name || 'Designation';
//       showToast(`✓ "${name}" created successfully`);
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Failed to create designation')),
//   });
// }

// export function useUpdateDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: UpdateDesignationDto }) =>
//       designationService.update(id, data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.designations.all });
      
//       if (res.data?.id) {
//         qc.setQueryData(KEYS.designations.detail(res.data.id), res.data);
//       }
      
//       const name = res.data?.name || 'Designation';
//       showToast(`✓ "${name}" updated successfully`);
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
//   });
// }

// export function useDeleteDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => designationService.delete(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.designations.all });
//       qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
//       showToast('Designation deleted');
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SUB-DESIGNATION HOOKS
// // ─────────────────────────────────────────────────────────────────────────────

// export function useSubDesignations(params?: SubDesignationQueryParams) {
//   return useQuery({
//     queryKey: KEYS.subDesignations.list(params),
//     queryFn: async () => {
//       const res = await designationService.getAllSubDesignations(params);
//       return res.data;
//     },
//     staleTime: 2 * 60_000,
//   });
// }

// export function useCreateSubDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateSubDesignationDto) => designationService.createSubDesignation(data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
//       qc.invalidateQueries({ queryKey: KEYS.designations.all }); // Invalidates parent list to refresh nested counts/arrays
//       const name = res.data?.name || 'Sub-Designation';
//       showToast(`✓ "${name}" created successfully`);
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Failed to create sub-designation')),
//   });
// }

// export function useUpdateSubDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: UpdateSubDesignationDto }) =>
//       designationService.updateSubDesignation(id, data),
//     onSuccess: (res) => {
//       qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
//       qc.invalidateQueries({ queryKey: KEYS.designations.all });
//       const name = res.data?.name || 'Sub-Designation';
//       showToast(`✓ "${name}" updated successfully`);
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
//   });
// }

// export function useDeleteSubDesignation() {
//   const qc = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => designationService.deleteSubDesignation(id),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
//       qc.invalidateQueries({ queryKey: KEYS.designations.all });
//       showToast('Sub-designation deleted');
//     },
//     onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
//   });
// }



'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import {
  designationService,
  type DesignationQueryParams,
  type SubDesignationQueryParams,
  type CreateDesignationDto,
  type UpdateDesignationDto,
  type CreateSubDesignationDto,
  type UpdateSubDesignationDto,
} from '../../../services/api/designation.service';
import { showToast } from '../../../utils/toast';

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS FACTORY
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  designations: {
    all: ['designations'] as const,
    lists: () => ['designations', 'list'] as const,
    list: (params?: DesignationQueryParams) => ['designations', 'list', params] as const,
    detail: (id: number) => ['designations', 'detail', id] as const,
  },
  subDesignations: {
    all: ['sub-designations'] as const,
    lists: () => ['sub-designations', 'list'] as const,
    list: (params?: SubDesignationQueryParams) => ['sub-designations', 'list', params] as const,
    detail: (id: number) => ['sub-designations', 'detail', id] as const,
  },
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const res = (err as any).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGNATION HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useDesignations(params?: DesignationQueryParams) {
  return useQuery({
    queryKey: KEYS.designations.list(params),
    queryFn: async () => {
      const res = await designationService.getAll(params);
      return res.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useDesignation(id: number | null) {
  return useQuery({
    queryKey: KEYS.designations.detail(id ?? 0),
    queryFn: async () => {
      const res = await designationService.getById(id as number);
      return res.data;
    },
    enabled: Boolean(id && id > 0),
    staleTime: 60_000,
  });
}

export function useCreateDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDesignationDto) => designationService.create(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.designations.all });
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      const name = res.data?.name || 'Designation';
      showToast(`✓ "${name}" created successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Failed to create designation')),
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDesignationDto }) =>
      designationService.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.designations.all });
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      
      if (res.data?.id) {
        qc.setQueryData(KEYS.designations.detail(res.data.id), res.data);
      }
      
      const name = res.data?.name || 'Designation';
      showToast(`✓ "${name}" updated successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
  });
}

export function useDeleteDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => designationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.designations.all });
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      showToast('Designation deleted');
    },
    onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-DESIGNATION HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useSubDesignations(params?: SubDesignationQueryParams) {
  return useQuery({
    queryKey: KEYS.subDesignations.list(params),
    queryFn: async () => {
      const res = await designationService.getAllSubDesignations(params);
      return res.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useSubDesignation(id: number | null) {
  return useQuery({
    queryKey: KEYS.subDesignations.detail(id ?? 0),
    queryFn: async () => {
      const res = await designationService.getSubDesignationById(id as number);
      return res.data;
    },
    enabled: Boolean(id && id > 0),
    staleTime: 60_000,
  });
}

export function useCreateSubDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubDesignationDto) => designationService.createSubDesignation(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      qc.invalidateQueries({ queryKey: KEYS.designations.all });
      const name = res.data?.name || 'Sub-Designation';
      showToast(`✓ "${name}" created successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Failed to create sub-designation')),
  });
}

export function useUpdateSubDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubDesignationDto }) =>
      designationService.updateSubDesignation(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      qc.invalidateQueries({ queryKey: KEYS.designations.all });

      if (res.data?.id) {
        qc.setQueryData(KEYS.subDesignations.detail(res.data.id), res.data);
      }

      const name = res.data?.name || 'Sub-Designation';
      showToast(`✓ "${name}" updated successfully`);
    },
    onError: (err) => showToast(getErrorMessage(err, 'Update failed')),
  });
}

export function useDeleteSubDesignation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => designationService.deleteSubDesignation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.subDesignations.all });
      qc.invalidateQueries({ queryKey: KEYS.designations.all });
      showToast('Sub-designation deleted');
    },
    onError: (err) => showToast(getErrorMessage(err, 'Delete failed')),
  });
}
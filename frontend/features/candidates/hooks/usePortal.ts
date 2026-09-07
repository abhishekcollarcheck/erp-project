'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalService } from '../../../services/api/candidate.service';
import { showToast } from '../../../utils/toast';
import type { Candidate, CandidateDocument } from '../types/candidate.types';

// ─── Query keys ──────────────────────────────────────────────────────────────
const K = {
  profile:   ['portal-profile'] as const,
  documents: ['portal-documents'] as const,
  company:   ['portal-company'] as const,
};

// ─── Reads ───────────────────────────────────────────────────────────────────
export function usePortalProfile(enabled = true) {
  return useQuery({
    queryKey: K.profile,
    queryFn:  () => portalService.getProfile(),
    enabled,
    select:   r => r.data as Candidate,
    retry:    1,
  });
}

export function usePortalDocuments(enabled = true) {
  return useQuery({
    queryKey: K.documents,
    queryFn:  () => portalService.listDocuments(),
    enabled,
    select:   r => (r.data ?? []) as CandidateDocument[],
    retry:    1,
  });
}

export function usePortalCompany(enabled = true) {
  return useQuery({
    queryKey: K.company,
    queryFn:  () => portalService.getCompanyInfo(),
    enabled,
    select:   r => r.data,
    retry:    1,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function usePortalRespondInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accepted: boolean) => portalService.respondInterview(accepted),
    onSuccess:  () => qc.invalidateQueries({ queryKey: K.profile }),
    onError:    (e: any) => showToast(e?.message || 'Could not submit your response'),
  });
}

export function usePortalReschedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { reason: string; date?: string; time?: string }) =>
      portalService.requestReschedule(v.reason, v.date || undefined, v.time || undefined),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: K.profile });
      showToast('Reschedule request submitted — HR will review it');
    },
    onError:    (e: any) => showToast(e?.message || 'Could not submit reschedule request'),
  });
}

export function usePortalMarkDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { docId: number; action: 'read' | 'complete' }) =>
      portalService.markDocument(v.docId, v.action),
    onSuccess:  () => qc.invalidateQueries({ queryKey: K.documents }),
    onError:    (e: any) => showToast(e?.message || 'Action failed'),
  });
}

export function usePortalSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { docId: number; file: File }) => portalService.submitAssignment(v.docId, v.file),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: K.documents });
      showToast('✓ Submission uploaded');
    },
    onError:    (e: any) => showToast(e?.message || 'Upload failed'),
  });
}

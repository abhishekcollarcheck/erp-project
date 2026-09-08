'use client';
import { useEffect, useState } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }         from 'zod';
import { Modal }     from '../../../components/ui/Modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candidateService } from '../../../services/api/candidate.service';
import { showToast }        from '../../../utils/toast';
import type { Candidate }   from '../types/candidate.types';

const schema = z.object({
  interview_date: z.string().min(1, 'Date required').refine(d => {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(d) >= today;
  }, 'Interview date cannot be in the past'),
  interview_time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  interview_type: z.enum(['Online','Offline','Phone']),
  interview_link: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  interview_instructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// Screenshot "Mode" labels ↔ stored interview_type enum.
const MODE_OPTIONS: { label: string; value: FormData['interview_type'] }[] = [
  { label: 'Video',     value: 'Online'  },
  { label: 'Phone call', value: 'Phone'   },
  { label: 'In-person', value: 'Offline' },
];

interface Props {
  open:      boolean;
  onClose:   () => void;
  candidate: Candidate | null;
}

export function InterviewSchedulerModal({ open, onClose, candidate }: Props) {
  const qc = useQueryClient();
  const [sendPortalEmail, setSendPortalEmail] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { interview_type: 'Online' },
  });

  useEffect(() => {
    if (open && candidate) {
      reset({
        interview_date:         candidate.interview_date?.slice(0,10) || '',
        interview_time:         candidate.interview_time || '',
        interview_type:         candidate.interview_type || 'Online',
        interview_link:         candidate.interview_link || '',
        interview_instructions: candidate.interview_instructions || '',
      });
      setSendPortalEmail(!candidate.is_portal_user);
    } else if (open) {
      reset({ interview_type: 'Online' });
      setSendPortalEmail(true);
    }
  }, [open, candidate, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await candidateService.scheduleInterview(candidate!.id, data as any);
      // Optionally grant / refresh Candidate Portal access so the candidate can
      // open the interview details and respond.
      if (sendPortalEmail) {
        try { await candidateService.grantPortalAccess(candidate!.id, { send_email: true }); }
        catch { /* non-blocking — interview is already scheduled */ }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      showToast('✓ Interview scheduled — details shared with the candidate');
      onClose();
    },
    onError: (err: any) => showToast(err?.message || 'Schedule failed'),
  });

  const interviewType = watch('interview_type');
  const isReschedule = !!candidate?.interview_date;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReschedule ? 'Reschedule interview' : 'Schedule interview'}
      subtitle="Interview details are shared with the candidate via their portal."
      width={500}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose}>Close</button>
          <button
            className="btn btn-pri"
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {mutation.isPending && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
            {mutation.isPending ? 'Scheduling…' : isReschedule ? 'Reschedule interview' : 'Schedule interview'}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        {/* Candidate (locked — modal is candidate-scoped) */}
        <div className="fg">
          <label>Candidate *</label>
          <select value={candidate?.id ?? ''} disabled style={{ background: 'var(--surface2)' }}>
            <option value={candidate?.id ?? ''}>{candidate?.candidate_name || '—'}</option>
          </select>
        </div>
        {/* Role */}
        <div className="fg">
          <label>Role</label>
          <input value={candidate?.apply_designation || '—'} readOnly disabled style={{ background: 'var(--surface2)' }} />
        </div>

        {/* Date */}
        <div className="fg">
          <label>Date</label>
          <input type="date" {...register('interview_date')} min={new Date().toISOString().slice(0,10)} />
          {errors.interview_date && <span className="err">{errors.interview_date.message}</span>}
        </div>
        {/* Time */}
        <div className="fg">
          <label>Time</label>
          <input type="time" {...register('interview_time')} />
          {errors.interview_time && <span className="err">{errors.interview_time.message}</span>}
        </div>

        {/* Round (single-round backend — Round 2 stays locked) */}
        <div className="fg">
          <label>Round</label>
          <select defaultValue="1" style={{ background: 'var(--surface2)' }}>
            <option value="1">Round 1</option>
            <option value="2" disabled>Round 2 — locked</option>
          </select>
        </div>
        {/* Mode */}
        <div className="fg">
          <label>Mode</label>
          <select {...register('interview_type')}>
            {MODE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Meeting link — only relevant for a video interview */}
        {interviewType === 'Online' && (
          <div className="fg" style={{ gridColumn: '1 / -1' }}>
            <label>Meeting link</label>
            <input type="url" placeholder="https://meet.google.com/xxx or https://zoom.us/j/xxx" {...register('interview_link')} />
            {errors.interview_link && <span className="err">{errors.interview_link.message}</span>}
          </div>
        )}

        {/* Instructions */}
        <div className="fg" style={{ gridColumn: '1 / -1' }}>
          <label>Notes for candidate <span style={{ color: 'var(--ink4)', fontWeight: 400 }}>(optional)</span></label>
          <textarea rows={2} placeholder="What to bring, dress code, topics to prepare…" {...register('interview_instructions')} style={{ resize: 'vertical' }} />
        </div>
      </div>

      {/* Round-lock note */}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 12px', fontSize: 11, color: 'var(--ink4)' }}>
        Round 2 stays locked until Round 1 is conducted (mark arrived / mark conducted).
      </div>

      {/* Portal email toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--ink3)', cursor: 'pointer' }}>
        <input type="checkbox" checked={sendPortalEmail} onChange={e => setSendPortalEmail(e.target.checked)} />
        Send Candidate Portal login email immediately
      </label>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}

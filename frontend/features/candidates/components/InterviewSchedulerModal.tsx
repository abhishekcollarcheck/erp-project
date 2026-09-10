'use client';
import { useEffect } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z }         from 'zod';
import { Modal }     from '../../../components/ui/Modal';
import { Select }    from '../../../components/ui/Select';
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

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
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
    } else if (open) {
      reset({ interview_type: 'Online' });
    }
  }, [open, candidate, reset]);

  const mutation = useMutation({
    // The interview email itself now carries Candidate Portal access (URL,
    // login email and — for candidates who haven't logged in yet — a temporary
    // password), so no separate portal-access call is needed here.
    mutationFn: (data: FormData) => candidateService.scheduleInterview(candidate!.id, data as any),
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
          <Select
            value={candidate?.id ?? ''}
            onChange={() => {}}
            disabled
            options={[{ value: candidate?.id ?? '', label: candidate?.candidate_name || '—' }]}
          />
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
          <Select
            value="1"
            onChange={() => {}}
            options={[
              { value: '1', label: 'Round 1' },
              { value: '2', label: 'Round 2 — locked', disabled: true },
            ]}
          />
        </div>
        {/* Mode */}
        <div className="fg">
          <label>Mode</label>
          <Select
            value={(watch('interview_type') as any) ?? ''}
            onChange={(v) => setValue('interview_type', v as any, { shouldValidate: true, shouldDirty: true })}
            options={MODE_OPTIONS.map(m => ({ value: m.value, label: m.label }))}
          />
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

      {/* Portal access is bundled into the interview email */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--ink3)' }}>
        <span aria-hidden>✉</span>
        <span>
          The interview email sent to <strong>{candidate?.email || 'the candidate'}</strong> includes Candidate
          Portal login details{candidate?.is_portal_user ? '' : ' (URL, email and a temporary password)'} so they can
          confirm attendance and view the details.
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}

'use client';
import { useEffect } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { useCreateRegularization } from '../hooks/useAttendance';
import { createRegularizationSchema, type CreateRegularizationFormData } from '../validations/attendance.schema';

interface Props {
  open:    boolean;
  onClose: () => void;
}

export function RegularizationFormModal({ open, onClose }: Props) {
  const createMutation = useCreateRegularization();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRegularizationFormData>({
    resolver: zodResolver(createRegularizationSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        date: new Date().toISOString().split('T')[0],
        requested_check_in: '',
        requested_check_out: '',
        reason: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateRegularizationFormData) => {
    await createMutation.mutateAsync({
      date: data.date,
      requested_check_in: data.requested_check_in || null,
      requested_check_out: data.requested_check_out || null,
      reason: data.reason,
    });
    onClose();
  };

  const isSaving = createMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Attendance Correction"
      subtitle="Submit a corrected check-in/out time for review"
      width={460}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button
            className="btn btn-pri"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isSaving && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
            {isSaving ? 'Submitting…' : '✓ Submit Request'}
          </button>
        </>
      }
    >
      <div className="fg">
        <label>Date *</label>
        <input type="date" {...register('date')} autoFocus />
        {errors.date && <span className="err">{errors.date.message}</span>}
      </div>

      <div className="fg">
        <label>Corrected Check-In</label>
        <input type="time" {...register('requested_check_in')} />
        {errors.requested_check_in && <span className="err">{errors.requested_check_in.message}</span>}
      </div>

      <div className="fg">
        <label>Corrected Check-Out</label>
        <input type="time" {...register('requested_check_out')} />
        {errors.requested_check_out && <span className="err">{errors.requested_check_out.message}</span>}
        <span style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>Provide at least one of check-in or check-out</span>
      </div>

      <div className="fg">
        <label>Reason *</label>
        <textarea
          placeholder="e.g. forgot to punch out, device was offline"
          rows={3}
          {...register('reason')}
        />
        {errors.reason && <span className="err">{errors.reason.message}</span>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}
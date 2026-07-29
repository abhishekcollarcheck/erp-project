'use client';
import { useEffect } from 'react';
import { useForm }   from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal }     from '../../../components/ui/Modal';
import { useCreateSubDesignation, useUpdateSubDesignation } from '../hooks/useSubDesignations';
import {
  createSubDesignationSchema,
  type CreateSubDesignationFormData,
} from '../validations/subdesignation.schema';
import type { SubDesignation } from '../types/subdesignation.types';

interface Props {
  open:          boolean;
  onClose:       () => void;
  subDesignation?: SubDesignation | null;
}

export function SubDesignationFormModal({ open, onClose, subDesignation }: Props) {
  const isEdit         = !!subDesignation;
  const createMutation = useCreateSubDesignation();
  const updateMutation = useUpdateSubDesignation(subDesignation?.id ?? 0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSubDesignationFormData>({
    resolver: zodResolver(createSubDesignationSchema),
  });

  useEffect(() => {
    if (open) {
      reset(subDesignation
        ? { name: subDesignation.name }
        : { name: '' },
      );
    }
  }, [open, subDesignation, reset]);

  const onSubmit = async (data: CreateSubDesignationFormData) => {
    const payload = {
      name: data.name,
    };
    if (isEdit) await updateMutation.mutateAsync(payload as any);
    else        await createMutation.mutateAsync(payload as any);
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${subDesignation?.name}` : 'Add Sub-Designation'}
      subtitle={isEdit
        ? 'Update the sub-designation details below'
        : 'Create a new sub-designation for your organisation'}
      width={440}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button
            className="btn btn-pri"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isSaving && (
              <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
            )}
            {isSaving ? 'Saving…' : isEdit ? '✓ Save Changes' : '✓ Create Sub-Designation'}
          </button>
        </>
      }
    >
      {/* Name */}
      <div className="fg">
        <label>Sub-Designation Name *</label>
        <input
          placeholder="e.g. Backend Engineer, Frontend Developer, QA Engineer"
          {...register('name')}
          autoFocus
        />
        {errors.name && <span className="err">{errors.name.message}</span>}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}
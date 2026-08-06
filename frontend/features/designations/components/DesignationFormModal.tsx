'use client';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal }     from '../../../components/ui/Modal';
import { useCreateDesignation, useUpdateDesignation } from '../hooks/useDesignations';
import {
  createDesignationSchema,
  type CreateDesignationFormData,
} from '../validations/designation.schema';
import type { Designation } from '../types/designation.types';
import { FormInput } from '../../../components/form/FormInput';
import { FormSelect } from '../../../components/form/FormSelect';
import { FormSection } from '../../../components/form/FormSection';
import { useFieldPermissions, resolveFieldPerm } from '../../employees/hooks/useEmployees';

interface Props {
  open:         boolean;
  onClose:      () => void;
  designation?: Designation | null;
  departments:  { value: number; label: string }[];
}

type Perm = ReturnType<typeof resolveFieldPerm>;

const canView = (p: Perm) => p?.can_view !== false;
const canEdit = (p: Perm) => p?.can_edit !== false;

export function DesignationFormModal({ open, onClose, designation }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const isEdit         = !!designation;
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation(designation?.id ?? 0);

  // FormInput / FormSelect read from context, so useForm must be exposed via FormProvider.
  const methods = useForm<CreateDesignationFormData>({
    resolver: zodResolver(createDesignationSchema),
  });
  const { handleSubmit, reset, setValue } = methods;

  // ── Field permissions ──────────────────────────────────────────────────────
  const perm = {
    designation_name: f('designation_name'),
  };
  console.log("perm", f('first_name'))
  const anyVisible  = Object.values(perm).some(canView);
  const anyEditable = Object.values(perm).some(canEdit);

  useEffect(() => {
    if (open) {
      reset(designation
        ? { name: designation.designation_name }
        : { name: '' },
      );
    }
  }, [open, designation, reset]);

  const onSubmit = async (data: CreateDesignationFormData) => {
    const payload = {
      designation_name: data.name,
    };
    if (isEdit) await updateMutation.mutateAsync(payload as any);
    else        await createMutation.mutateAsync(payload as any);
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // FormSelect emits the raw option value (or '' on clear) as a string.
  // department_id is numeric, so coerce before the resolver sees it.
  const setDepartmentId = (v: string) => {
    setValue('department_id', (v ? Number(v) : null) as any, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${designation?.designation_name}` : 'Add Designation'}
      subtitle={isEdit
        ? 'Update the designation details below'
        : 'Create a new role or position for your organisation'}
      width={440}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isSaving}>Cancel</button>
          {anyVisible && anyEditable && (
            <button
              className="btn btn-pri"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isSaving && (
                <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              )}
              {isSaving ? 'Saving…' : isEdit ? '✓ Save Changes' : '✓ Create Designation'}
            </button>
          )}
        </>
      }
    >
      <FormSection fields={[perm.designation_name]}>
        <FormProvider {...methods}>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormInput
              name="designation_name"
              label="Designation Name"
              required
              placeholder="e.g. Software Engineer, Product Manager, Analyst"
              fieldPerm={perm.designation_name}
            />
          </div>
        </FormProvider>
      </FormSection>
    </Modal>
  );
}
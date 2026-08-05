'use client';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/Modal';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartments';
import { createDepartmentSchema, type CreateDepartmentFormData } from '../validations/department.schema';
import type { Department } from '../../../services/api/department.service';
import { FormInput } from '../../../components/form/FormInput';
import { FormSelect } from '../../../components/form/FormSelect';
import { useFieldPermissions, resolveFieldPerm } from '../../employees/hooks/useEmployees';
import { FormSection } from '../../../components/form/FormSection';

interface Props {
  open: boolean;
  onClose: () => void;
  department?: Department | null;
  departments: { value: number; label: string }[];
  managers: { value: number; label: string }[];
}

type Perm = ReturnType<typeof resolveFieldPerm>;
const canView = (p: Perm) => p?.can_view !== false;
const canEdit = (p: Perm) => p?.can_edit !== false;

export function DepartmentFormModal({ open, onClose, department, departments, managers }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const isEdit = !!department;
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(department?.id ?? 0);

  const methods = useForm<CreateDepartmentFormData>({
    resolver: zodResolver(createDepartmentSchema),
  });
  const { handleSubmit, reset, setValue } = methods;

  // ── Field permissions ──────────────────────────────────────────────────────
  const perm = {
    dpname: f('dpname'),
    code: f('code'),
    head_id: f('head_id'),
    parent_id: f('parent_id'),
  };
useEffect(() => {
  if (!fp) return;
  console.table(perm);
}, [fp]);
  const anyEditable = Object.values(perm).some(canEdit);

  useEffect(() => {
    if (open && department) {
      reset({
        dpname: department.dpname,
        code: department.code ?? '',
        head_id: department.head_id ?? undefined,
        parent_id: department.parent_id ?? undefined,
      });
    } else if (open) {
      reset({ dpname: '', code: '', head_id: undefined, parent_id: undefined });
    }
  }, [open, department, reset]);

  const onSubmit = async (data: CreateDepartmentFormData) => {
    const payload = {
      dpname: data.dpname,
      code: data.code || "",
      head_id: data.head_id || null,
      parent_id: data.parent_id || null,
    };
    if (isEdit) await updateMutation.mutateAsync(payload);
    else await createMutation.mutateAsync(payload as any);
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // FormSelect emits the raw option value (or '' on clear) as a string.
  // These id columns are numeric, so coerce before the resolver sees it.
  const setNumericId = (field: 'head_id' | 'parent_id') => (v: string) => {
    setValue(field, (v ? Number(v) : null) as any, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${department?.dpname}` : 'Add Department'}
      subtitle={isEdit ? 'Update department details' : 'Create a new department for your organisation'}
      width={460}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isSaving}>Cancel</button>
          {anyEditable && (
            <button
              className="btn btn-pri"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isSaving && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
              {isSaving ? 'Saving…' : isEdit ? '✓ Save Changes' : '✓ Create Department'}
            </button>
          )}
        </>
      }
    >
      {/* <FormSection fields={[(perm.dpname), (perm.code), (perm.head_id), (perm.parent_id)]}> */}
        <FormProvider {...methods}>
          <div style={{ display: 'grid', gap: 12 }}>
            <FormInput
              name="dpname"
              label="Department Name"
              required
              placeholder="e.g. Engineering, Finance, Product"
              fieldPerm={perm.dpname}
            />
            <FormInput
              name="code"
              label="Department Code"
              placeholder="e.g. ENG, FIN, OPS"
              hint="Short code for reports and exports (optional)"
              fieldPerm={perm.code}
              onChange={v => setValue('code', v.toUpperCase(), { shouldDirty: true })}
            />

            <FormSelect
              name="head_id"
              label="Department Head"
              placeholder="— Assign a head later —"
              hint="The employee responsible for this department"
              options={managers}
              fieldPerm={perm.head_id}
              onChange={setNumericId('head_id')}
            />

            <FormSelect
              name="parent_id"
              label="Parent Department"
              placeholder="— Top-level department (no parent) —"
              hint="For sub-departments within a larger team"
              options={departments.filter(d => d.value !== department?.id)}
              fieldPerm={perm.parent_id}
              onChange={setNumericId('parent_id')}
            />
          </div>
        </FormProvider>
      {/* </FormSection> */}
    </Modal>
  );
}

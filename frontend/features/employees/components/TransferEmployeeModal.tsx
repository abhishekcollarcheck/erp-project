'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Modal } from '../../../components/ui/Modal';
import { useTransferEmployee } from '../hooks/useEmployees';
import { useCompany } from '../../company/hooks/useCompany';
import { showToast } from '../../../utils/toast';
import type { Employee } from '../types/employee.types';
import { useDepartments } from '../../departments/hooks/useDepartments';
import { useSubDepartments } from '../../sub-departments/hooks/useSubDepartments';
import { useDesignations } from '../../designation/hooks/useDesignations';
import { useSites } from '../../locations/hooks/uselocation';

const today = new Date().toISOString().slice(0, 10);

const optId = z.preprocess(
  (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? undefined : Number(v)),
  z.number().int().positive().optional(),
);

const schema = z.object({
  new_employee_code: z.string().trim().min(1, 'New employee code is required').max(30, 'Max 30 characters'),
  new_company_id: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: 'Select the destination company', invalid_type_error: 'Select the destination company' })
      .int().positive('Select the destination company'),
  ),
  transfer_date: z.string().min(1, 'Transfer date is required'),
  new_department_id: optId,
  new_sub_department_id: optId,
  new_designation_id: optId,
  new_working_site: optId,
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function TransferEmployeeModal({ open, onClose, employee }: Props) {
  const router = useRouter();
  const { companies } = useCompany();
  const transferMutation = useTransferEmployee(Number(employee?.id ?? 0));

  const { data: departments = [] } = useDepartments({ is_active: 'true' } as any);
  const { data: subDepartments = [] } = useSubDepartments({ is_active: 'true' } as any);
  const { data: designations = [] } = useDesignations({ is_active: 'true' } as any);
  const { data: sites = [] } = useSites();

  const departmentOpts = (departments ?? []).map((d: any) => ({ value: d.id, label: d.department_name }));
  const subDepartmentOpts = (subDepartments ?? []).map((d: any) => ({ value: d.id, label: d.name }));
  const designationOpts = (designations ?? []).map((d: any) => ({ value: d.id, label: d.name }));
  const siteOpts = (sites ?? []).map((s: any) => ({ value: s.id, label: s.name }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { transfer_date: today },
  });

  useEffect(() => {
    if (open) reset({ transfer_date: today, new_employee_code: '' });
  }, [open, employee, reset]);

  const destCompanies = (companies ?? []).filter((c: any) => c.id !== employee?.company_id);

  const onSubmit = async (data: FormData) => {
    if (!employee) return;
    try {
      const res: any = await transferMutation.mutateAsync({
        new_employee_code: data.new_employee_code.trim(),
        new_company_id: data.new_company_id,
        transfer_date: data.transfer_date,
        new_department_id: data.new_department_id ?? null,
        new_sub_department_id: data.new_sub_department_id ?? null,
        new_designation_id: data.new_designation_id ?? null,
        new_working_site: data.new_working_site ?? null,
      });
      showToast('Employee transferred');
      onClose();
      const newId = res?.data?.newEmployeeId;
      if (newId) setTimeout(() => router.push(`/employees/${newId}`), 250);
    } catch {
      /* toast handled in the hook */
    }
  };

  const isBusy = transferMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Employee"
      subtitle="Closes employment in the current company and creates a new employee code in the destination company. Personal / KYC details are copied."
      width={560}
      footer={
        <>
          <button className="btn btn-sec" onClick={onClose} disabled={isBusy}>Cancel</button>
          <button className="btn btn-pri" onClick={handleSubmit(onSubmit)} disabled={isBusy}>
            {isBusy ? 'Transferring…' : 'Confirm Transfer'}
          </button>
        </>
      }
    >
      <div className="info" style={{ marginBottom: 14 }}>
        {[
          employee?.employee_code ?? 'No code',
          `${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`.trim(),
          employee?.company?.name,
          employee?.department?.name,
        ].filter(Boolean).join(' · ')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>

        <div className="fg">
          <label>Current Emp Code</label>
          <div style={{ fontWeight: 700, padding: '8px 0', color: 'var(--ink)' }}>
            {employee?.employee_code ?? '—'}
          </div>
        </div>

        <div className="fg">
          <label>New Emp Code *</label>
          <input type="text" placeholder="EMP-0002" {...register('new_employee_code')} />
          {errors.new_employee_code && <span className="err">{errors.new_employee_code.message}</span>}
        </div>

        <div className="fg">
          <label>New Company *</label>
          <select {...register('new_company_id')}>
            <option value="">Select company</option>
            {destCompanies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.new_company_id && <span className="err">{errors.new_company_id.message as string}</span>}
        </div>

        <div className="fg">
          <label>Transfer / New DOJ *</label>
          <input type="date" {...register('transfer_date')} />
          {errors.transfer_date && <span className="err">{errors.transfer_date.message}</span>}
        </div>

        <div className="fg">
          <label>New Department</label>
          <select {...register('new_department_id')}>
            <option value="">Select department</option>
            {departmentOpts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        <div className="fg">
          <label>New Sub Department</label>
          <select {...register('new_sub_department_id')}>
            <option value="">Select sub department</option>
            {subDepartmentOpts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        <div className="fg">
          <label>New Designation</label>
          <select {...register('new_designation_id')}>
            <option value="">Select designation</option>
            {designationOpts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        <div className="fg">
          <label>New Working Site</label>
          <select {...register('new_working_site')}>
            <option value="">Select site</option>
            {siteOpts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

      </div>
    </Modal>
  );
}

'use client';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormInput } from '../../../../components/form/FormInput';
import { useFieldPermissions, useEmployees, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepManagersWorkContact({ employeeId }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  // Load all active employees — used as manager options for both L1 and L2
  const { data: empData, isLoading } = useEmployees({ status: 'Active', limit: 100 });
  const employees = (empData?.rows ?? []).map((e: any) => ({
    id:            e.id as number,
    employee_code: e.employee_code as string | null,
    first_name:    e.first_name as string,
    last_name:     e.last_name as string,
    designation:   e.designation?.name as string | undefined,
  }));

  // Build option list once — excludeId filters out the employee being edited
  const managerOptions = employees
    .filter(e => !employeeId || e.id !== employeeId)
    .map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.employee_code ?? 'code pending'})${e.designation ? ' · ' + e.designation : ''}` }));

  return (
    <FormSection fields={[f('l1_manager_id'), f('l2_manager_id'), f('official_email'), f('official_mobile')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Reporting Managers</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="l1_manager_id" label="L-1 Manager"
          placeholder={isLoading ? 'Loading employees…' : 'Select manager'}
          disabled={isLoading}
          options={managerOptions}
          hint="Select from directory"
          fieldPerm={f('l1_manager_id')}
        />
        <FormSelect name="l2_manager_id" label="L-2 Manager"
          placeholder={isLoading ? 'Loading employees…' : 'Select manager'}
          disabled={isLoading}
          options={managerOptions}
          hint="Select from directory"
          fieldPerm={f('l2_manager_id')}
        />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Work Contact</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="official_email" label="Work Email" type="email" placeholder="name@company.com" fieldPerm={f('official_email')} />
        <FormInput name="official_mobile" label="Work Mobile" type="tel" placeholder="+91-9876543210" fieldPerm={f('official_mobile')} />
      </div>
    </div>
    </FormSection>
  );
}

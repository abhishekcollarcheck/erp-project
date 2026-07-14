'use client';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { useFieldPermissions, useEmployees, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepReporting({ employeeId }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  // Load all active employees — used as manager options for both L1 and L2
  const { data: empData, isLoading } = useEmployees({ status: 'Active', limit: 100 });
  const employees = (empData?.rows ?? []).map((e: any) => ({
    id:            e.id as number,
    employee_code: e.employee_code as string,
    first_name:    e.first_name as string,
    last_name:     e.last_name as string,
  }));

  // Build option list once — excludeId filters out the employee being edited
  const managerOptions = employees
    .filter(e => !employeeId || e.id !== employeeId)
    .map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.employee_code})` }));

  return (
    <FormSection fields={[f('l1_manager_id'), f('l2_manager_id'), f('actual_doj'), f('current_doj')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="l1_manager_id" label="L1 Manager (Direct)"
          placeholder={isLoading ? 'Loading employees…' : 'Select manager'}
          disabled={isLoading}
          options={managerOptions} 
          fieldPerm={f('l1_manager_id')} 
        />
        <FormSelect name="l2_manager_id" label="L2 Manager (Skip-level)"
          placeholder={isLoading ? 'Loading employees…' : 'Select manager'}
          disabled={isLoading}
          options={managerOptions} 
          fieldPerm={f('l2_manager_id')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormDatePicker name="actual_doj"  label="Actual DOJ" required max={new Date().toISOString().split('T')[0]} fieldPerm={f('actual_doj')} />
        <FormDatePicker name="current_doj" label="Current DOJ" hint="Leave blank to use Actual DOJ" fieldPerm={f('current_doj')} />
      </div>
    </div>
    </FormSection>
  );
}
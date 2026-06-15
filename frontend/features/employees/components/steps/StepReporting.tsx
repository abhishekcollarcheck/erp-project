'use client';
/**
 * StepReporting — manager selection via dropdown.
 * Loads all active managers once on mount.
 * Stores manager's employee_id (integer FK) in the form.
 */
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { useFieldPermissions } from '../../hooks/useEmployees';
import { searchManagers } from '../../../../services/api/employee.service';

interface Props { isEdit: boolean; employeeId: number | null }
interface ManagerResult { id: number; employee_code: string; first_name: string; last_name: string; }

function ManagerSelect({ fieldName, label, required, excludeId, managers, loading }: {
  fieldName:  string;
  label:      string;
  required?:  boolean;
  excludeId?: number | null;
  managers:   ManagerResult[];
  loading:    boolean;
}) {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const currentId = watch(fieldName);
  const error = (errors as any)[fieldName]?.message as string | undefined;

  const options = managers.filter(m => !excludeId || m.id !== excludeId);

  return (
    <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
      <label htmlFor={fieldName} className="field-label">
        {label}
        {required && <span className="req-mark">*</span>}
      </label>
      <select
        id={fieldName}
        className="form-select"
        value={currentId ?? ''}
        disabled={loading}
        onChange={e => setValue(fieldName, e.target.value ? Number(e.target.value) : null, { shouldDirty: true, shouldValidate: true })}
      >
        <option value="">{loading ? 'Loading managers…' : 'Select manager'}</option>
        {options.map(m => (
          <option key={m.id} value={m.id}>
            {m.first_name} {m.last_name} ({m.employee_code})
          </option>
        ))}
      </select>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function StepReporting({ employeeId }: Props) {
  const { data: fp } = useFieldPermissions();
  const [managers, setManagers] = useState<ManagerResult[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Load all active managers once on mount
  useEffect(() => {
    searchManagers('')
      .then((res: any) => setManagers(res.data || []))
      .catch(() => setManagers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ManagerSelect fieldName="l1_manager_id" label="L1 Manager (Direct)" required
          excludeId={employeeId} managers={managers} loading={loading} />
        <ManagerSelect fieldName="l2_manager_id" label="L2 Manager (Skip-level)"
          excludeId={employeeId} managers={managers} loading={loading} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormDatePicker name="actual_doj"  label="Actual DOJ" required max={new Date().toISOString().split('T')[0]} />
        <FormDatePicker name="current_doj" label="Current DOJ" hint="Leave blank to use Actual DOJ" />
      </div>
    </div>
  );
}
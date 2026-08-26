'use client';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { toOpts, EMPLOYMENT_TYPE, DEPARTMENT_OPTIONS, SUB_DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS, SUB_DESIGNATION_OPTIONS } from '../../constants/employee.constants';
import { useCompany } from '../../../company/hooks/useCompany';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null; avatarUrl?: string | null; onPhotoSelected?: (file: File) => void }

export function StepRoleIdentity({ isEdit, avatarUrl, onPhotoSelected }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { setValue, watch } = useFormContext();
  const { company } = useCompany();

  // employee_code stays null/pending until both the HR and Candidate parts
  // reach 100% completion — shown here read-only.
  const employeeCode = watch('employee_code');

  useEffect(() => {
    if (company?.id) {
      setValue('company_id', company?.id);
    }
  }, [company]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '')) {
      alert('Only JPG, PNG, or WebP files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2 MB');
      e.target.value = '';
      return;
    }
    onPhotoSelected?.(file);
    e.target.value = ''; // allow re-selecting the same file later
  };

  return (
    <FormSection fields={[f('employee_code'), f('company_id'), f('status'), f('first_name'), f('middle_name'), f('last_name'), f('employment_type'), f('email'), f('phone'), f('department_id'), f('sub_department_id'), f('designation_id'), f('sub_designation_id')]}>
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: avatarUrl ? undefined : 'var(--surface3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: 'var(--ink4)', border: '1px solid var(--border)',
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>?</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Profile photo</div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 6 }}>Optional · JPG, PNG or WebP · shown on directory &amp; profile</div>
          <label className="btn btn-sec btn-sm" style={{ display: 'inline-block', cursor: 'pointer' }}>
            {avatarUrl ? 'Change photo' : 'Add photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput
          name="employee_code"
          label="Employee Code"
          displayValue={employeeCode ?? ''}
          placeholder="Issued when all steps are complete"
          readOnly
          fieldPerm={f('employee_code')}
        />
        <FormInput name="company_id" label="Company" displayValue={company?.name} readOnly fieldPerm={f('company_id')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <FormInput name="first_name" label="First Name" required placeholder="Rahul" fieldPerm={f('first_name')} />
        <FormInput name="middle_name" label="Middle Name" placeholder="Kumar" fieldPerm={f('middle_name')} />
        <FormInput name="last_name" label="Last Name" required placeholder="Sharma" fieldPerm={f('last_name')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput name="status" label="Status" required displayValue="Active" readOnly hint="New employees start as Active" fieldPerm={f('status')} />
        <FormSelect
          name="employment_type"
          label="Employment Type"
          required
          options={toOpts(EMPLOYMENT_TYPE)}
          fieldPerm={f('employment_type')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormSelect
          name="department_id"
          label="Department"
          required
          placeholder='Select'
          options={[...DEPARTMENT_OPTIONS]}
          fieldPerm={f('department_id')}
        />
        <FormSelect
          name="sub_department_id"
          label="Sub Department"
          placeholder='Select'
          options={[...SUB_DEPARTMENT_OPTIONS]}
          fieldPerm={f('sub_department_id')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormSelect
          name="designation_id"
          label="Designation"
          required
          placeholder='Select'
          options={[...DESIGNATION_OPTIONS]}
          fieldPerm={f('designation_id')}
        />
        <FormSelect
          name="sub_designation_id"
          label="Sub Designation"
          placeholder='Select'
          options={[...SUB_DESIGNATION_OPTIONS]}
          fieldPerm={f('sub_designation_id')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput name="email" label="Personal Email" type="email" required
          placeholder="name@email.com" fieldPerm={f('email')} />
        <FormInput name="phone" label="Personal Mobile Number" type="tel" required
          placeholder="+91-9876543210" fieldPerm={f('phone')} />
      </div>
    </div>
    </FormSection>
  );
}
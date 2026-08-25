'use client';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { toOpts, EMPLOYMENT_TYPE, DEPARTMENT_OPTIONS, SUB_DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS, SUB_DESIGNATION_OPTIONS } from '../../constants/employee.constants';
import { useCompany } from '../../../company/hooks/useCompany';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepRoleIdentity({ isEdit }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { setValue } = useFormContext();
  const { company } = useCompany();

  // Reference Code still auto-generates immediately at creation (unchanged).
  // Employee Code no longer appears anywhere on this step — it's generated
  // automatically once both the HR and Candidate parts reach 100% completion.

  useEffect(() => {
    if (company?.id) {
      setValue('company_id', company?.id);
    }
  }, [company]);

  return (
    <FormSection fields={[f('reference_code'), f('company_id'), f('status'), f('first_name'), f('middle_name'), f('last_name'), f('employment_type'), f('email'), f('phone'), f('department_id'), f('sub_department_id'), f('designation_id'), f('sub_designation_id')]}>
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput
          name="reference_code"
          label="Reference Code"
          placeholder="Issued when mandatory fields are complete"
          readOnly
          fieldPerm={f('reference_code')}
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

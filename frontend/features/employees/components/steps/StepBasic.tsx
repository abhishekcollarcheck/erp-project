'use client';
import { useEffect } from 'react';
import { useFormContext} from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { useFieldPermissions, useNextCode, resolveFieldPerm } from '../../hooks/useEmployees';
import { toOpts, EMPLOYEE_STATUS, EMPLOYMENT_TYPE, DEPARTMENT_OPTIONS, SUB_DEPARTMENT_OPTIONS, DESIGNATION_OPTIONS } from '../../constants/employee.constants';
import { useCompany } from '../../../company/hooks/useCompany';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepBasic({ isEdit }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { data: codes } = useNextCode();
  const { setValue, watch } = useFormContext();
  const { company } = useCompany();
  console.log("DEPARTMENT_OPTIONS", DEPARTMENT_OPTIONS)
  // // ── Auto-fill employee code on create ─────────────────────────────────────
  // useEffect(() => {
  //   if (!isEdit && codes?.code && !watch('employee_code')) {
  //     setValue('employee_code', codes.code, { shouldDirty: false });
  //   }
  // }, [codes, isEdit]); // eslint-disable-line

  // ── Auto-fill reference code on create ───────────────────────────────────
  useEffect(() => {
    if (!isEdit && codes?.ref && !watch('reference_code')) {
      setValue('reference_code', codes.ref, { shouldDirty: false });
    }
  }, [codes, isEdit]); // eslint-disable-line

useEffect(() => {
 if(company?.id){
  setValue('company_id', company?.id)
 }
}, [company])

  return (
    <FormSection fields={[f('reference_code'), f('company_id'), f('status'), f('first_name'), f('middle_name'), f('last_name'), f('employment_type'), f('email'), f('phone')]}>
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput
          name="reference_code"
          label="Reference Code"
          placeholder={codes?.ref ?? 'Auto-generated'}
          hint="Auto-generated, can be changed"
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
        <FormInput name="status" label="Status" required fieldPerm={f('status')} displayValue={EMPLOYEE_STATUS[0]} readOnly />
        <FormSelect
          name="employment_type"
          label="Employment Type"
          required
          options={toOpts(EMPLOYMENT_TYPE)}
          fieldPerm={f('employment_type')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormInput name="email" label="Work Email" type="email"
          placeholder="rahul.sharma@company.com" fieldPerm={f('email')} />
        <FormInput name="phone" label="Phone Number" type="tel" required
          placeholder="+91-9876543210" fieldPerm={f('phone')} />
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
        <FormInput
          name="sub_designation"
          label="Sub Designation"
          placeholder="e.g. Senior, Lead"
          hint="Optional — free text"
          fieldPerm={f('sub_designation')}
        />
      </div>
    </div>
    </FormSection>
  );
}
'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { toOpts, GENDER, BLOOD_GROUP, MARITAL_STATUS } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepPersonal(_: Props) {
  const marital = useWatch({ name: 'marital_status' });
  const maxDob  = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  return (
    <FormSection fields={[f('personal_email'), f('personal_mobile'), f('date_of_birth'), f('gender'), f('blood_group'), f('shirt_size'), f('tshirt_size'), f('nationality'), f('religion'), f('marital_status'), f('marriage_date'), f('spouse_name'), f('spouse_dob'), f('child1_name'), f('child1_dob'), f('child2_name'), f('child2_dob'), f('child3_name'), f('child3_dob')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_email"  label="Personal Email"  type="email" required placeholder="rahul@gmail.com" fieldPerm={f('personal_email')} />
        <FormInput name="personal_mobile" label="Personal Mobile" required placeholder="+91-9876543210" fieldPerm={f('personal_mobile')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormDatePicker name="date_of_birth" label="Date of Birth" required max={maxDob} hint="Must be 18+" fieldPerm={f('date_of_birth')} />
        <FormSelect name="gender"      label="Gender"      required options={toOpts(GENDER)} placeholder="Select" fieldPerm={f('gender')} />
        <FormSelect name="blood_group" label="Blood Group" required options={toOpts(BLOOD_GROUP)} placeholder="Select" fieldPerm={f('blood_group')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="shirt_size"  label="Shirt Size"  required placeholder="M" hint="For uniform" fieldPerm={f('shirt_size')} />
        <FormInput name="tshirt_size" label="T-Shirt Size" required placeholder="L" fieldPerm={f('tshirt_size')} />
        <FormInput name="nationality" label="Nationality" required placeholder="Indian" fieldPerm={f('nationality')} />
      </div>
      <FormInput name="religion" label="Religion" required placeholder="e.g. Hindu" fieldPerm={f('religion')} />

      <FormSelect name="marital_status" label="Marital Status" required options={toOpts(MARITAL_STATUS)} placeholder="Select" fieldPerm={f('marital_status')} />
      {marital === 'Married' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormDatePicker name="marriage_date" label="Marriage Date" fieldPerm={f('marriage_date')} />
          <FormInput name="spouse_name" label="Spouse Name" fieldPerm={f('spouse_name')} />
          <FormDatePicker name="spouse_dob" label="Spouse DOB" fieldPerm={f('spouse_dob')} />
          <FormInput name="child1_name" label="1st Child Name" fieldPerm={f('child1_name')} />
          <FormDatePicker name="child1_dob" label="1st Child DOB" fieldPerm={f('child1_dob')} />
          <FormInput name="child2_name" label="2nd Child Name" fieldPerm={f('child2_name')} />
          <FormDatePicker name="child2_dob" label="2nd Child DOB" fieldPerm={f('child2_dob')} />
          <FormInput name="child3_name" label="3rd Child Name" fieldPerm={f('child3_name')} />
          <FormDatePicker name="child3_dob" label="3rd Child DOB" fieldPerm={f('child3_dob')} />
        </div>
      )}
    </div>
    </FormSection>
  );
}

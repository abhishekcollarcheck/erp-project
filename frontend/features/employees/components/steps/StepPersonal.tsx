'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { toOpts, GENDER, BLOOD_GROUP, MARITAL_STATUS } from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepPersonal(_: Props) {
  const marital = useWatch({ name: 'marital_status' });
  const maxDob  = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_email"  label="Personal Email"  type="email" required placeholder="rahul@gmail.com" />
        <FormInput name="personal_mobile" label="Personal Mobile" required placeholder="+91-9876543210" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormDatePicker name="date_of_birth" label="Date of Birth" required max={maxDob} hint="Must be 18+" />
        <FormSelect name="gender"      label="Gender"      required options={toOpts(GENDER)} placeholder="Select" />
        <FormSelect name="blood_group" label="Blood Group" required options={toOpts(BLOOD_GROUP)} placeholder="Select" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="shirt_size"  label="Shirt Size"  required placeholder="M" hint="For uniform" />
        <FormInput name="tshirt_size" label="T-Shirt Size" required placeholder="L" />
        <FormInput name="nationality" label="Nationality" required placeholder="Indian" />
      </div>
      <FormInput name="religion" label="Religion" required placeholder="e.g. Hindu" />

      <FormSelect name="marital_status" label="Marital Status" required options={toOpts(MARITAL_STATUS)} placeholder="Select" />
      {marital === 'Married' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormDatePicker name="marriage_date" label="Marriage Date" />
          <FormInput name="spouse_name" label="Spouse Name" />
          <FormDatePicker name="spouse_dob" label="Spouse DOB" />
          <FormInput name="child1_name" label="1st Child Name" />
          <FormDatePicker name="child1_dob" label="1st Child DOB" />
          <FormInput name="child2_name" label="2nd Child Name" />
          <FormDatePicker name="child2_dob" label="2nd Child DOB" />
          <FormInput name="child3_name" label="3rd Child Name" />
          <FormDatePicker name="child3_dob" label="3rd Child DOB" />
        </div>
      )}
    </div>
  );
}

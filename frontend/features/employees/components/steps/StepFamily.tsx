'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { toOpts, FATHER_SALUTATION, MOTHER_SALUTATION, PARENT_STATUS, MOTHER_STATUS } from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepFamily(_: Props) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Father's Details" />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12 }}>
        <FormSelect name="father_salutation" label="Salutation" required options={toOpts(FATHER_SALUTATION)} />
        <FormInput  name="father_name"       label="Father's Name" required placeholder="Full name" />
        <FormInput  name="father_age_dob"    label="Age / DOB" placeholder="55 or 01-01-1970" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput  name="father_occupation" label="Occupation" placeholder="e.g. Retired Teacher" />
        <FormSelect name="father_status"     label="Occupation Status" options={toOpts(PARENT_STATUS)} placeholder="Select" />
      </div>

      <SectionTitle title="Mother's Details" />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12 }}>
        <FormSelect name="mother_salutation" label="Salutation" required options={toOpts(MOTHER_SALUTATION)} />
        <FormInput  name="mother_name"       label="Mother's Name" required placeholder="Full name" />
        <FormInput  name="mother_age_dob"    label="Age / DOB" placeholder="50 or 01-01-1975" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <FormSelect name="mother_occupation" label="Occupation Status" options={toOpts(MOTHER_STATUS)} placeholder="Select" />
      </div>
    </div>
  );
}

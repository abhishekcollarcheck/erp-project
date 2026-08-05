'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormToggle } from '../../../../components/form/FormToggle';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions } from '../../hooks/useEmployees';
import { FormSection } from '@/components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepStatutory(_: Props) {
  const { data: fp } = useFieldPermissions();
  const yellowFever  = useWatch({ name: 'yellow_fever' });
  const f = (n: string) => fp?.[n];

  return (
    <FormSection fields={[f('passport_number'), f('passport_expiry'), f('yellow_fever'), f('driving_license_number'), f('driving_license_expiry'), f('aadhaar_number'), f('pan_number'), f('aadhaar_address'), f('pan_full_name'), f('pan_dob'), f('pan_parent_spouse_name')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Travel Documents" fields={[f('passport_number'), f('passport_expiry')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput      name="passport_number" label="Passport Number" placeholder="A1234567" fieldPerm={f('passport_number')} />
        <FormDatePicker name="passport_expiry" label="Passport Expiry" fieldPerm={f('passport_expiry')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormToggle name="yellow_fever" label="Yellow Fever Vaccination" fieldPerm={f('yellow_fever')} />
        {yellowFever && <FormDatePicker name="yellow_fever_date" label="Date of Injection" fieldPerm={f('yellow_fever_date')} />}
      </div>

      <SectionTitle title="Driving License" fields={[f('driving_license_number'), f('driving_license_expiry')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput      name="driving_license_number" label="Driving License No." required fieldPerm={f('driving_license_number')} />
        <FormDatePicker name="driving_license_expiry" label="Driving License Expiry" required fieldPerm={f('driving_license_expiry')} />
      </div>

      <SectionTitle title="Government IDs" fields={[f('aadhaar_number'), f('pan_number')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="aadhaar_number" label="Aadhaar Number" required placeholder="XXXX XXXX XXXX" maxLength={12} hint="12 digits" fieldPerm={f('aadhaar_number')} />
        <FormInput name="pan_number"     label="PAN Number"     required placeholder="ABCDE1234F"   maxLength={10} hint="Format: ABCDE1234F" fieldPerm={f('pan_number')} />
      </div>
      <FormInput name="aadhaar_address" label="Address as in Aadhaar Card" required fieldPerm={f('aadhaar_address')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput      name="pan_full_name"          label="Full Name as per PAN" required fieldPerm={f('pan_full_name')} />
        <FormDatePicker name="pan_dob"                label="DOB in PAN Card"     required fieldPerm={f('pan_dob')} />
      </div>
      <FormInput name="pan_parent_spouse_name" label="Parent's / Spouse's Name as per PAN" required fieldPerm={f('pan_parent_spouse_name')} />
    </div>
  </FormSection>
  );
}

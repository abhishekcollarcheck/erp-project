'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { toOpts } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';
import { useGenderData } from '../../../../features/gender/hooks/useGender';
import { useBloodGroupData } from '../../../../features/bloodGroup/hooks/useBloodGroup';
import { useNationalityData } from '../../../../features/nationality/hooks/useNationality';
import { useReligionData } from '../../../../features/religion/hooks/useReligion';
import { useShirtSizeData } from '../../../../features/shirtSize/hooks/useShirtSize';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepPersonalProfile(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  const { data: genders = [] } = useGenderData();
  const { data: bloodGroups = [] } = useBloodGroupData();
  const { data: nationalities = [] } = useNationalityData();
  const { data: religions = [] } = useReligionData();
  const { data: shirtSizes = [] } = useShirtSizeData();

  return (
    <FormSection fields={[f('date_of_birth'), f('gender'), f('blood_group'), f('nationality'), f('religion'), f('shirt_size'), f('tshirt_size')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Identity</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <FormDatePicker name="date_of_birth" label="Date Of Birth" fieldPerm={f('date_of_birth')} />
        <FormSelect name="gender"      label="Gender"      options={toOpts(genders.map(g => g.name))} placeholder="Select" fieldPerm={f('gender')} />
        <FormSelect name="blood_group" label="Blood Group" options={toOpts(bloodGroups.map(b => b.name))} placeholder="Select" fieldPerm={f('blood_group')} />
        <FormSelect name="nationality" label="Nationality"  options={toOpts(nationalities.map(n => n.name))} placeholder="Select" fieldPerm={f('nationality')} />
      </div>
      <FormSelect name="religion" label="Religion" options={toOpts(religions.map(r => r.name))} placeholder="Select" fieldPerm={f('religion')} />

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Sizes (ID / uniform)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="shirt_size"  label="Shirt Size"  options={toOpts(shirtSizes.map(s => s.name))} placeholder="Select" fieldPerm={f('shirt_size')} />
        <FormSelect name="tshirt_size" label="T-Shirt Size" options={toOpts(shirtSizes.map(s => s.name))} placeholder="Select" fieldPerm={f('tshirt_size')} />
      </div>
    </div>
    </FormSection>
  );
}

'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { toOpts, FATHER_SALUTATION, MOTHER_SALUTATION, PARENT_STATUS, MOTHER_STATUS } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepFamily(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  return (
    <FormSection fields={[f('father_salutation'), f('father_name'), f('father_age_dob'), f('father_occupation'), f('father_status'), f('mother_salutation'), f('mother_name'), f('mother_age_dob'), f('mother_occupation')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Father's Details" fields={[f('father_salutation'), f('father_name'), f('father_age_dob')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12 }}>
        <FormSelect name="father_salutation" label="Salutation" required options={toOpts(FATHER_SALUTATION)} fieldPerm={f('father_salutation')} />
        <FormInput  name="father_name"       label="Father's Name" required placeholder="Full name" fieldPerm={f('father_name')} />
        <FormInput  name="father_age_dob"    label="Age / DOB" placeholder="55 or 01-01-1970" fieldPerm={f('father_age_dob')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput  name="father_occupation" label="Occupation" placeholder="e.g. Retired Teacher" fieldPerm={f('father_occupation')} />
        <FormSelect name="father_status"     label="Occupation Status" options={toOpts(PARENT_STATUS)} placeholder="Select" fieldPerm={f('father_status')} />
      </div>

      <SectionTitle title="Mother's Details" fields={[f('mother_salutation'), f('mother_name'), f('mother_age_dob')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 12 }}>
        <FormSelect name="mother_salutation" label="Salutation" required options={toOpts(MOTHER_SALUTATION)} fieldPerm={f('mother_salutation')} />
        <FormInput  name="mother_name"       label="Mother's Name" required placeholder="Full name" fieldPerm={f('mother_name')} />
        <FormInput  name="mother_age_dob"    label="Age / DOB" placeholder="50 or 01-01-1975" fieldPerm={f('mother_age_dob')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        <FormSelect name="mother_occupation" label="Occupation Status" options={toOpts(MOTHER_STATUS)} placeholder="Select" fieldPerm={f('mother_occupation')} />
      </div>
    </div>
    </FormSection>
  );
}

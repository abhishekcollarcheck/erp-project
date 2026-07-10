'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormToggle } from '../../../../components/form/FormToggle';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepExperience(_: Props) {
  const isExp = useWatch({ name: 'is_experienced' });
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Past Experience" fields={[f('is_experienced')]} />
      <FormToggle name="is_experienced" label="Previously Employed" fieldPerm={f('is_experienced')} />
      {isExp && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput name="last_company_name" label="Last Company Name" placeholder="Previous Company Pvt Ltd" fieldPerm={f('last_company_name')} />
            <FormInput name="last_designation"  label="Designation Held"  placeholder="Senior Executive" fieldPerm={f('last_designation')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormDatePicker name="last_working_day"  label="Last Working Day" fieldPerm={f('last_working_day')} />
            <FormInput name="exp_contact_name"  label="Reference Contact Name" fieldPerm={f('exp_contact_name')} />
            <FormInput name="exp_contact_number"label="Reference Contact No." fieldPerm={f('exp_contact_number')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput name="exp_contact_designation" label="Reference Contact Designation" fieldPerm={f('exp_contact_designation')} />
            <FormCurrencyInput name="last_inhand_salary" label="Last In-Hand Salary" fieldPerm={f('last_inhand_salary')} />
          </div>
        </div>
      )}

      <SectionTitle title="Highest Qualification" fields={[f('highest_education'), f('education_stream'), f('education_mode')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="highest_education" label="Highest Education" required placeholder="B.Com / MBA / B.Tech" fieldPerm={f('highest_education')} />
        <FormInput name="education_stream"  label="Education Stream"  placeholder="Commerce / Finance" fieldPerm={f('education_stream')} />
        <FormInput name="education_mode"    label="Mode of Education" placeholder="Regular / Distance / Online" fieldPerm={f('education_mode')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="institute_name" label="Institute / University" placeholder="Mumbai University" fieldPerm={f('institute_name')} />
        <FormInput name="passing_year"   label="Passing Year" type="number" placeholder="2018" fieldPerm={f('passing_year')} />
        <FormInput name="education_marks" label="Marks / Grade"         placeholder="72% or A+" fieldPerm={f('education_marks')} />
      </div>
    </div>
  );
}

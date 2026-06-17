'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormToggle } from '../../../../components/form/FormToggle';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { SectionTitle } from '../../../../components/form/SectionTitle';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepExperience(_: Props) {
  const isExp = useWatch({ name: 'is_experienced' });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Past Experience" />
      <FormToggle name="is_experienced" label="Previously Employed" />
      {isExp && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput name="last_company_name" label="Last Company Name" placeholder="Previous Company Pvt Ltd" />
            <FormInput name="last_designation"  label="Designation Held"  placeholder="Senior Executive" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormDatePicker name="last_working_day"  label="Last Working Day" />
            <FormInput      name="exp_contact_name"  label="Reference Contact Name" />
            <FormInput      name="exp_contact_number"label="Reference Contact No." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput         name="exp_contact_designation" label="Reference Contact Designation" />
            <FormCurrencyInput name="last_inhand_salary"      label="Last In-Hand Salary" />
          </div>
        </div>
      )}

      <SectionTitle title="Highest Qualification" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="highest_education" label="Highest Education" required placeholder="B.Com / MBA / B.Tech" />
        <FormInput name="education_stream"  label="Education Stream"  placeholder="Commerce / Finance" />
        <FormInput name="education_mode"    label="Mode of Education" placeholder="Regular / Distance / Online" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="institute_name" label="Institute / University" placeholder="Mumbai University" />
        <FormInput name="passing_year"   label="Passing Year" type="number" placeholder="2018" />
        <FormInput name="education_marks"label="Marks / Grade"         placeholder="72% or A+" />
      </div>
    </div>
  );
}

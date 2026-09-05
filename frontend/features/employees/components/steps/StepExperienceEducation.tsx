'use client';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormToggle } from '../../../../components/form/FormToggle';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '@/components/form/FormSection';
import { useQualificationData } from '../../../qualification/hoooks/useQualification';
import { useEducationModeData } from '../../../education-mode/hooks/useEducationMode';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepExperienceEducation(_: Props) {
  const isExp = useWatch({ name: 'is_experienced' });
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { control } = useFormContext();
  const { data: qualifications = [] } = useQualificationData();
  const { data: educationModes = [] } = useEducationModeData();

  const experience = useFieldArray({ control, name: 'experience' });
  const education   = useFieldArray({ control, name: 'education' });

  return (
    <FormSection fields={[f('is_experienced'), f('experience'), f('education')]}>
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Work experience ─────────────────────────────────────────────── */}
      <div style={{ fontSize: 13, fontWeight: 600 }}>Work experience</div>
      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: -10 }}>Start with the most recent role, then add earlier ones if needed</div>
      <FormToggle name="is_experienced" label="Has prior work experience?" showValue fieldPerm={f('is_experienced')} />

      {isExp && (
        <div style={{ display: 'grid', gap: 12 }}>
          {experience.fields.map((field, i) => (
            <div key={field.id} style={{ padding: 12, background: 'var(--surface2)', borderRadius: 'var(--r2)', display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput name={`experience.${i}.last_company_name`} label="Last Company Name" placeholder="Previous Company Pvt Ltd" fieldPerm={f('experience')} />
                <FormInput name={`experience.${i}.last_designation`}  label="Designation Held"  placeholder="Senior Executive" fieldPerm={f('experience')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FormDatePicker name={`experience.${i}.last_working_day`}  label="Last Working Day" fieldPerm={f('experience')} />
                <FormInput name={`experience.${i}.exp_contact_name`}  label="Reference Contact Name" fieldPerm={f('experience')} />
                <FormInput name={`experience.${i}.exp_contact_number`} label="Reference Contact No." fieldPerm={f('experience')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormInput name={`experience.${i}.exp_contact_designation`} label="Reference Contact Designation" fieldPerm={f('experience')} />
                <FormCurrencyInput name={`experience.${i}.last_inhand_salary`} label="Last In-Hand Salary" fieldPerm={f('experience')} />
              </div>
              <button type="button" className="btn btn-sec btn-sm" style={{ justifySelf: 'start' }} onClick={() => experience.remove(i)}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-sec btn-sm" style={{ justifySelf: 'start' }} onClick={() => experience.append({ last_company_name: '', last_designation: '', last_working_day: '', exp_contact_name: '', exp_contact_number: '', exp_contact_designation: '', last_inhand_salary: undefined })}>+ Add earlier role</button>
        </div>
      )}

      {/* ── Education ────────────────────────────────────────────────────── */}
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Education</div>
      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: -10 }}>Highest qualification first</div>

      {education.fields.map((field, i) => (
        <div key={field.id} style={{ padding: 12, background: 'var(--surface2)', borderRadius: 'var(--r2)', display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <FormSelect name={`education.${i}.highest_education`} label="Highest qualification" options={qualifications.map((q: any) => ({ value: q.name, label: q.name }))} placeholder="Select" fieldPerm={f('education')} />
            <FormInput name={`education.${i}.education_stream`}  label="Stream / specialization" fieldPerm={f('education')} />
            <FormSelect name={`education.${i}.education_mode`}    label="Mode of education" options={educationModes.map((m: any) => ({ value: m.name, label: m.name }))} placeholder="Select" fieldPerm={f('education')} />
            <FormInput name={`education.${i}.institute_name`}    label="Institute name" fieldPerm={f('education')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormInput name={`education.${i}.education_marks`}   label="Marks / grade" fieldPerm={f('education')} />
            <FormInput name={`education.${i}.education_start_year`} label="Start year" placeholder="YYYY" fieldPerm={f('education')} />
            <FormInput name={`education.${i}.education_end_year`}   label="End year" placeholder="YYYY" fieldPerm={f('education')} />
          </div>
          <button type="button" className="btn btn-sec btn-sm" style={{ justifySelf: 'start' }} onClick={() => education.remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn btn-sec btn-sm" style={{ justifySelf: 'start' }} onClick={() => education.append({ highest_education: '', education_stream: '', education_mode: '', institute_name: '', education_marks: '', education_start_year: undefined, education_end_year: undefined, is_pursuing: false })}>+ Add qualification</button>
    </div>
    </FormSection>
  );
}
'use client';
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormToggle } from '../../../../components/form/FormToggle';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { BANK_NAME_OPTIONS, DOC_TYPE_OPTIONS, VACCINE_OPTIONS } from '../../constants/employee.constants';
import { FormSection } from '@/components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

function KycCard({ title, hint, required, children }: { title: string; hint: string; required?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', marginBottom: 10 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface2)', border: 'none', borderRadius: open ? 'var(--r2) var(--r2) 0 0' : 'var(--r2)', cursor: 'pointer', textAlign: 'left' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{hint}</div>
        </div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: required ? 'var(--amber-lt)' : 'var(--surface3)', color: required ? 'var(--amber)' : 'var(--ink4)', fontWeight: 500 }}>
          {required ? 'Needed' : 'Optional'}
        </span>
      </button>
      {open && <div style={{ padding: 12 }}>{children}</div>}
    </section>
  );
}

export function StepIdsBank(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { control, register } = useFormContext();

  const vaccinations = useFieldArray({ control, name: 'vaccinations' });
  const documents = useFieldArray({ control, name: 'documents' });
  const yellowFever = useWatch({ name: 'yellow_fever' });

  return (
    <FormSection fields={[f('aadhaar_number'), f('aadhaar_name'), f('aadhaar_dob'), f('aadhaar_address'), f('pan_number'), f('passport_number'), f('yellow_fever'), f('yellow_fever_date'), f('driving_license_number'), f('personal_bank_name'), f('personal_bank_account'), f('personal_ifsc'), f('personal_bank_branch')]}>
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--ink4)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
        Aadhaar and personal bank details are required. PAN, Passport, and Driving Licence are all optional.
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Government IDs <span style={{ fontWeight: 400, color: 'var(--ink4)' }}>— Aadhaar required · PAN optional</span></div>

      <KycCard title="Aadhaar" hint="Required · number, name, DOB, address & scan" required>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormInput name="aadhaar_number" label="Aadhaar Number" required placeholder="12 digits" maxLength={12} fieldPerm={f('aadhaar_number')} />
          <FormInput name="aadhaar_name" label="Name as on Aadhaar" required fieldPerm={f('aadhaar_name')} />
          <FormDatePicker name="aadhaar_dob" label="Date of Birth (Aadhaar)" required fieldPerm={f('aadhaar_dob')} />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormInput name="aadhaar_address" label="Address as on Aadhaar" required fieldPerm={f('aadhaar_address')} />
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <label>Upload Aadhaar scan (PDF, JPG or PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" {...register('aadhaar_scan_url')} />
        </div>
      </KycCard>

      <KycCard title="PAN" hint="Optional · number, name, DOB, parent/spouse name & scan">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormInput name="pan_number" label="PAN Number" placeholder="ABCDE1234F" maxLength={10} fieldPerm={f('pan_number')} />
          <FormInput name="pan_full_name" label="Name as on PAN" fieldPerm={f('pan_full_name')} />
          <FormDatePicker name="pan_dob" label="Date of Birth (PAN)" fieldPerm={f('pan_dob')} />
          <FormInput name="pan_parent_spouse_name" label="Father's / Spouse's Name (PAN)" fieldPerm={f('pan_parent_spouse_name')} />
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <label>Upload PAN scan (PDF, JPG or PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" {...register('pan_scan_url')} />
        </div>
      </KycCard>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Travel &amp; licence <span style={{ fontWeight: 400, color: 'var(--ink4)' }}>— optional</span></div>

      <KycCard title="Passport" hint="Optional · number, name, nationality, issue & expiry, place of issue">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormInput name="passport_number" label="Passport Number" fieldPerm={f('passport_number')} />
          <FormInput name="passport_full_name" label="Name as on Passport" fieldPerm={f('passport_full_name')} />
          <FormInput name="passport_nationality" label="Nationality (Passport)" fieldPerm={f('passport_nationality')} />
          <FormDatePicker name="passport_issue_date" label="Date of Issue" fieldPerm={f('passport_issue_date')} />
          <FormDatePicker name="passport_expiry" label="Date of Expiry" fieldPerm={f('passport_expiry')} />
          <FormInput name="passport_place_of_issue" label="Place of Issue" fieldPerm={f('passport_place_of_issue')} />
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <label>Upload Passport scan (PDF, JPG or PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" {...register('passport_scan_url')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <FormToggle name="yellow_fever" label="Yellow Fever Injection" showValue fieldPerm={f('yellow_fever')} />
          {yellowFever && (
            <FormDatePicker name="yellow_fever_date" label="Date of Injection" fieldPerm={f('yellow_fever_date')} />
          )}
        </div>
      </KycCard>

      <KycCard title="Driving licence" hint="Optional · number, name, issue & expiry, issuing RTO">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormInput name="driving_license_number" label="Driving License Number" fieldPerm={f('driving_license_number')} />
          <FormInput name="driving_license_name" label="Name as on Licence" fieldPerm={f('driving_license_name')} />
          <FormDatePicker name="driving_license_issue_date" label="Date of Issue" fieldPerm={f('driving_license_issue_date')} />
          <FormDatePicker name="driving_license_expiry" label="Date of Expiry" fieldPerm={f('driving_license_expiry')} />
          <FormInput name="driving_license_authority" label="Issuing Authority / RTO" fieldPerm={f('driving_license_authority')} />
        </div>
        <div className="fg" style={{ marginTop: 12 }}>
          <label>Upload Driving licence scan (PDF, JPG or PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" {...register('driving_license_scan_url')} />
        </div>
      </KycCard>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Vaccination</div>
      <KycCard title="Vaccinations" hint="Select major vaccines (COVID, booster, yellow fever, and more)">
        {vaccinations.fields.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No vaccinations added yet.</div>}
        {vaccinations.fields.map((field, i) => (
          <div key={field.id} style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--r) var(--r) 0 0', fontSize: 12, fontWeight: 600 }}>
              <span>Vaccination {i + 1}</span>
              <button type="button" onClick={() => vaccinations.remove(i)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink4)', lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12 }}>
              <FormSelect name={`vaccinations.${i}.vaccine_name`} label="Vaccine" options={[...VACCINE_OPTIONS]} placeholder="Select" fieldPerm={f('vaccinations')} />
              <FormDatePicker name={`vaccinations.${i}.date`} label="Date of vaccination" />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sec btn-sm" onClick={() => vaccinations.append({ vaccine_name: '', date: '' })}>+ Add another vaccination</button>
      </KycCard>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Bank account <span style={{ fontWeight: 400, color: 'var(--ink4)' }}>— required</span></div>
      <KycCard title="Personal bank account" hint="Required · for reimbursements (salary bank is set by HR)" required>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect name="personal_bank_name" label="Bank Name" required options={[...BANK_NAME_OPTIONS]} placeholder="Select" fieldPerm={f('personal_bank_name')} />
          <FormInput name="personal_bank_account" label="Bank Account Number" required fieldPerm={f('personal_bank_account')} />
          <FormInput name="personal_ifsc" label="IFSC Code" required placeholder="ABCD0123456" fieldPerm={f('personal_ifsc')} />
          <FormInput name="personal_bank_branch" label="Branch Name" fieldPerm={f('personal_bank_branch')} />
        </div>
      </KycCard>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Other files</div>
      <KycCard title="Additional documents" hint="Certificates, photos, or other papers (optional)">
        {documents.fields.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No extra documents yet. Pick a type, then upload.</div>}
        {documents.fields.map((field, i) => (
          <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end', marginBottom: 8 }}>
            <FormSelect name={`documents.${i}.doc_type`} label="Document type" options={[...DOC_TYPE_OPTIONS]} placeholder="Select" fieldPerm={f('documents')} />
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <button type="button" className="btn btn-sec btn-sm" onClick={() => documents.remove(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-pri btn-sm" onClick={() => documents.append({ doc_type: '', doc_type_other: '', file_url: '' })}>Upload file</button>
      </KycCard>
    </div>
    </FormSection>
  );
}
'use client';
import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { toOpts, FATHER_SALUTATION, MOTHER_SALUTATION, MARITAL_STATUS, RELATIONSHIP_OPTIONS } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepFamilyEmergency(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { control } = useFormContext();

  const familyMembers = useFieldArray({ control, name: 'family_members' });
  const emergencyContacts = useFieldArray({ control, name: 'emergency_contacts' });

  // The primary contact must live inside the tracked field array from the
  // start, not as a hand-written path outside it — otherwise the first
  // "+ Add contact" click appends its blank default at index 0 and silently
  // wipes whatever the user already typed there.
  useEffect(() => {
    if (emergencyContacts.fields.length === 0) {
      emergencyContacts.append({ contact_name: '', contact_number: '', email: '', relationship: '', relationship_other: '' }, { shouldFocus: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormSection fields={[f('marital_status'), f('father_salutation'), f('father_name'), f('father_dob'), f('father_occupation'), f('mother_salutation'), f('mother_name'), f('mother_dob'), f('mother_occupation'), f('family_members'), f('emergency_contacts')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Marital Status</div>
      <FormSelect name="marital_status" label="Marital Status" options={toOpts(MARITAL_STATUS)} placeholder="Select" fieldPerm={f('marital_status')} />

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Parents</div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 12 }}>
        <FormSelect name="father_salutation" label="Salutation" options={toOpts(FATHER_SALUTATION)} placeholder="Select" fieldPerm={f('father_salutation')} />
        <FormInput  name="father_name"       label="Father Name" placeholder="Full name" fieldPerm={f('father_name')} />
        <FormDatePicker name="father_dob"    label="Father's Age/Dob" fieldPerm={f('father_dob')} />
        <FormInput  name="father_occupation" label="Father's Occupation" fieldPerm={f('father_occupation')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 12 }}>
        <FormSelect name="mother_salutation" label="Salutation" options={toOpts(MOTHER_SALUTATION)} placeholder="Select" fieldPerm={f('mother_salutation')} />
        <FormInput  name="mother_name"       label="Mother Name" placeholder="Full name" fieldPerm={f('mother_name')} />
        <FormDatePicker name="mother_dob"    label="Mother's Age/Dob" fieldPerm={f('mother_dob')} />
        <FormInput  name="mother_occupation" label="Mother's Occupation" fieldPerm={f('mother_occupation')} />
      </div>

      {/* ── Other Family Members (repeatable) ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Other Family Members</div>
        <button type="button" className="btn btn-sec btn-sm" onClick={() => familyMembers.append({ name: '', relationship: '', relationship_other: '', salutation: '', dob: '', occupation: '' })}>+ Add member</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: -10 }}>Brother, sister, or other relatives beyond parents / spouse / children above.</div>
      {familyMembers.fields.length === 0 && <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '8px 0' }}>No additional members yet.</div>}
      {familyMembers.fields.map((field, i) => (
        <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end', padding: 12, background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
          <FormInput name={`family_members.${i}.name`} label="Name" fieldPerm={f('family_members')} />
          <FormInput name={`family_members.${i}.relationship`} label="Relationship" fieldPerm={f('family_members')} />
          <FormDatePicker name={`family_members.${i}.dob`} label="DOB" fieldPerm={f('family_members')} />
          <FormInput name={`family_members.${i}.occupation`} label="Occupation" fieldPerm={f('family_members')} />
          <button type="button" className="btn btn-sec btn-sm" onClick={() => familyMembers.remove(i)}>Remove</button>
        </div>
      ))}

      {/* ── Emergency Contacts (repeatable — first is primary, always kept) ── */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Primary Emergency Contact</div>
      {emergencyContacts.fields.map((field, i) => (
        <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end', padding: 12, background: i === 0 ? 'transparent' : 'var(--surface2)', borderRadius: 'var(--r)' }}>
          <FormInput name={`emergency_contacts.${i}.contact_name`} label={i === 0 ? 'Contact person name' : 'Name'} fieldPerm={f('emergency_contacts')} />
          <FormInput name={`emergency_contacts.${i}.contact_number`} label={i === 0 ? 'Contact number' : 'Number'} fieldPerm={f('emergency_contacts')} />
          <FormInput name={`emergency_contacts.${i}.email`} label="Email" type="email" placeholder="name@email.com" fieldPerm={f('emergency_contacts')} />
          <FormSelect name={`emergency_contacts.${i}.relationship`} label="Relationship" options={[...RELATIONSHIP_OPTIONS]} placeholder="Select" fieldPerm={f('emergency_contacts')} />
          {i > 0 && <button type="button" className="btn btn-sec btn-sm" onClick={() => emergencyContacts.remove(i)}>Remove</button>}
        </div>
      ))}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)', marginBottom: 6 }}>More Emergency Contacts</div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 8 }}>Primary contact is above. Add backups if needed.</div>
        <button type="button" className="btn btn-sec btn-sm" onClick={() => emergencyContacts.append({ contact_name: '', contact_number: '', email: '', relationship: '', relationship_other: '' })}>+ Add contact</button>
      </div>
    </div>
    </FormSection>
  );
}
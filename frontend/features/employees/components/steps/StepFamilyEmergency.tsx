'use client';
import { useEffect, useRef } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { toOpts } from '../../constants/employee.constants';
import { useFieldPerm, useStepFieldPerms } from '../../hooks/useFieldPerm';
import { FormSection } from '../../../../components/form/FormSection';
import { useMaritalStatusData } from '../../../../features/maritalStatus/hooks/useMaritalStatus';
import { useSalutationData } from '../../../../features/salutation/hooks/useSalutation';
import { useEmergencyRelationshipData } from '../../../../features/emergency-relationship/useEmergencyRelationship';

// Same subset as the old hardcoded FATHER_SALUTATION / MOTHER_SALUTATION
// constants — the shared `salutations` master has all 5 (Mr./Mrs./Ms./Dr./Late),
// filtered client-side per parent so a father can't be assigned "Mrs.".
const FATHER_SALUTATION_NAMES = ['Mr.', 'Dr.', 'Late'];
const MOTHER_SALUTATION_NAMES = ['Mrs.', 'Ms.', 'Dr.', 'Late'];

interface Props { isEdit: boolean; employeeId: number | null }

export function StepFamilyEmergency(_: Props) {
  const f = useFieldPerm();
  const sp = useStepFieldPerms();
  const { control, getValues } = useFormContext();

  const { data: maritalStatuses = [] } = useMaritalStatusData();
  const { data: salutations = [] } = useSalutationData();
  const { data: relationships = [] } = useEmergencyRelationshipData();
  const fatherSalutations = salutations.filter(s => FATHER_SALUTATION_NAMES.includes(s.name));
  const motherSalutations = salutations.filter(s => MOTHER_SALUTATION_NAMES.includes(s.name));

  const familyMembers = useFieldArray({ control, name: 'family_members' });
  const emergencyContacts = useFieldArray({ control, name: 'emergency_contacts' });

  // Marriage / spouse fields only apply when Married.
  const isMarried = useWatch({ control, name: 'marital_status' }) === 'Married';

  // The primary contact must live inside the tracked field array from the
  // start, not as a hand-written path outside it — otherwise the first
  // "+ Add contact" click appends its blank default at index 0 and silently
  // wipes whatever the user already typed there.
  //
  // The ref guard + getValues() check (rather than the stale `fields` closure)
  // is what stops React 18 StrictMode's double-invoked mount effect from
  // appending TWO blank primary rows.
  const seededPrimary = useRef(false);
  useEffect(() => {
    if (seededPrimary.current) return;
    seededPrimary.current = true;
    const existing = getValues('emergency_contacts');
    if (!existing || existing.length === 0) {
      emergencyContacts.append({ contact_name: '', contact_number: '', email: '', relationship: '', relationship_other: '' }, { shouldFocus: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormSection fields={sp('family_emergency')}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Marital Status</div>
      <FormSelect name="marital_status" label="Marital Status" options={toOpts(maritalStatuses.map(m => m.name))} placeholder="Select" fieldPerm={f('marital_status')} />

      {isMarried && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 12, background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
          <FormInput name="spouse_name" label="Spouse Name" required fieldPerm={f('spouse_name')} />
          <FormDatePicker name="marriage_date" label="Marriage Date" required fieldPerm={f('marriage_date')} />
          <FormDatePicker name="spouse_dob" label="Spouse DOB" fieldPerm={f('spouse_dob')} />
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Parents</div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 12 }}>
        <FormSelect name="father_salutation" label="Salutation" options={toOpts(fatherSalutations.map(s => s.name))} placeholder="Select" fieldPerm={f('father_salutation')} />
        <FormInput  name="father_name"       label="Father Name" placeholder="Full name" fieldPerm={f('father_name')} />
        <FormDatePicker name="father_dob"    label="Father's Age/Dob" fieldPerm={f('father_dob')} />
        <FormInput  name="father_occupation" label="Father's Occupation" fieldPerm={f('father_occupation')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr', gap: 12 }}>
        <FormSelect name="mother_salutation" label="Salutation" options={toOpts(motherSalutations.map(s => s.name))} placeholder="Select" fieldPerm={f('mother_salutation')} />
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
          <FormSelect name={`family_members.${i}.relationship`} label="Relationship" options={toOpts(relationships.map(r => r.name))} placeholder="Select" fieldPerm={f('family_members')} />
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
          <FormSelect name={`emergency_contacts.${i}.relationship`} label="Relationship" options={toOpts(relationships.map(r => r.name))} placeholder="Select" fieldPerm={f('emergency_contacts')} />
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
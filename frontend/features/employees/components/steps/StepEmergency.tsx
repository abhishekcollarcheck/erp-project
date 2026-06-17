'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { SectionTitle } from '../../../../components/form/SectionTitle';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepEmergency(_: Props) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Emergency Contact Details" subtitle="Person to contact in case of emergency — must not be the employee themselves" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="contact_name"   label="Contact Person Name" required placeholder="Full name" />
        <FormInput name="contact_number" label="Contact Number"       required placeholder="+91-9876543210" />
        <FormInput name="relationship"   label="Relationship"          required placeholder="Father / Spouse / Sibling" />
      </div>
    </div>
  );
}

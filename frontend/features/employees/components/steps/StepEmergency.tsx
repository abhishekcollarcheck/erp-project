'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions } from '../../hooks/useEmployees';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepEmergency(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => fp?.[n];

  const anyVisible = f('contact_name')?.can_view || f('contact_number')?.can_view || f('relationship')?.can_view;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Emergency Contact Details" subtitle="Person to contact in case of emergency — must not be the employee themselves" />
      {!anyVisible ? (
        <div style={{ padding: 16, color: 'var(--ink4)', fontSize: 12, fontStyle: 'italic' }}>
          You don't have access to view this section.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormInput name="contact_name" label="Contact Person Name" required placeholder="Full name" fieldPerm={f('contact_name')} />
          <FormInput name="contact_number" label="Contact Number" required placeholder="+91-9876543210" fieldPerm={f('contact_number')} />
          <FormInput name="relationship" label="Relationship" required placeholder="Father / Spouse / Sibling" fieldPerm={f('relationship')} />
        </div>
      )}
    </div>
  );
}
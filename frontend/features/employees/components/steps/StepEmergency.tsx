'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '@/components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepEmergency(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  return (
    <FormSection fields={[f('contact_name'), f('contact_number'), f('relationship') ]}>
      <div style={{ display: 'grid', gap: 16 }}>
        <SectionTitle title="Emergency Contact Details" subtitle="Person to contact in case of emergency — must not be the employee themselves" fields={[f('contact_name'), f('contact_number'), f('relationship')]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormInput name="contact_name" label="Contact Person Name" required placeholder="Full name" fieldPerm={f('contact_name')} />
            <FormInput name="contact_number" label="Contact Number" required placeholder="+91-9876543210" fieldPerm={f('contact_number')} />
            <FormInput name="relationship" label="Relationship" required placeholder="Father / Spouse / Sibling" fieldPerm={f('relationship')} />
          </div>
      </div>
    </FormSection>
  );
}
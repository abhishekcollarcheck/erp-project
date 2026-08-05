'use client';
import { FormSection } from '@/components/form/FormSection';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions } from '../../hooks/useEmployees';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepBank(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => fp?.[n];

  return (
    <FormSection fields={[f('personal_bank_name'), f('personal_bank_account'), f('personal_ifsc'), f('personal_bank_branch'), f('official_bank_name'), f('official_bank_account'), f('official_ifsc'), f('official_bank_branch')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Personal Bank Details" subtitle="Salary will be credited to this account" fields={[f('personal_bank_name'), f('personal_bank_account')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_bank_name"    label="Bank Name"       required placeholder="State Bank of India" fieldPerm={f('personal_bank_name')} />
        <FormInput name="personal_bank_account" label="Account Number"  required placeholder="XXXXXXXXXXXX" fieldPerm={f('personal_bank_account')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_ifsc"         label="IFSC Code"   required placeholder="SBIN0001234" hint="Format: ABCD0123456" fieldPerm={f('personal_ifsc')} />
        <FormInput name="personal_bank_branch"  label="Branch Name" required placeholder="Andheri West" fieldPerm={f('personal_bank_branch')} />
      </div>

      <SectionTitle title="Official Bank Details" subtitle="Optional — used for expense reimbursement" fields={[f('official_bank_name'), f('official_bank_account')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="official_bank_name"    label="Bank Name" fieldPerm={f('official_bank_name')} />
        <FormInput name="official_bank_account" label="Account Number" fieldPerm={f('official_bank_account')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} >
        <FormInput name="official_ifsc"         label="IFSC Code" fieldPerm={f('official_ifsc')} />
        <FormInput name="official_bank_branch"  label="Branch Name" fieldPerm={f('official_bank_branch')} />
      </div>
    </div>
    </FormSection>
  );
}

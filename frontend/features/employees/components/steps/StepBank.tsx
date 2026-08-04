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
    <FormSection fields={[]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Personal Bank Details" subtitle="Salary will be credited to this account" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_bank_name"    label="Bank Name"       required placeholder="State Bank of India" fieldPerm={f('bank_name')} />
        <FormInput name="personal_bank_account" label="Account Number"  required placeholder="XXXXXXXXXXXX" fieldPerm={f('account_number')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="personal_ifsc"         label="IFSC Code"   required placeholder="SBIN0001234" hint="Format: ABCD0123456" fieldPerm={f('ifsc_code')} />
        <FormInput name="personal_bank_branch"  label="Branch Name" required placeholder="Andheri West" />
      </div>

      <SectionTitle title="Official Bank Details" subtitle="Optional — used for expense reimbursement" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="official_bank_name"    label="Bank Name" fieldPerm={f('bank_name')} />
        <FormInput name="official_bank_account" label="Account Number" fieldPerm={f('account_number')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput name="official_ifsc"         label="IFSC Code" fieldPerm={f('ifsc_code')} />
        <FormInput name="official_bank_branch"  label="Branch Name" />
      </div>
    </div>
    </FormSection>
  );
}

'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { toOpts, HOUSE_TYPE, PERM_ADDRESS_TYPE } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepAddress(_: Props) {
  const permType = useWatch({ name: 'perm_address_type' });
  const isOther  = permType === 'Other';

  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);  

  return (
    <FormSection fields={[f('present_house_type'), f('present_house_no'), f('present_area'), f('present_district'), f('present_city'), f('present_state'), f('present_country'), f('present_pincode'), f('perm_address_type'), f('perm_house_type'), f('perm_area'), f('perm_district'), f('perm_city'), f('perm_state'), f('perm_country'), f('perm_pincode')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Present Address" fields={[f('present_house_type'), f('present_house_no')]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="present_house_type" label="House Type" required options={toOpts(HOUSE_TYPE)} placeholder="Own or Rent" fieldPerm={f('present_house_type')} />
        <FormInput  name="present_house_no"   label="House No." required placeholder="Flat 4B, Building XYZ" fieldPerm={f('present_house_no')} />
      </div>
      <FormInput name="present_area" label="Area / Village / Street" placeholder="Andheri West" fieldPerm={f('present_area')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="present_district" label="District" required placeholder="Mumbai" fieldPerm={f('present_district')} />
        <FormInput name="present_city"     label="City"     required placeholder="Mumbai" fieldPerm={f('present_city')} />
        <FormInput name="present_state"    label="State"    required placeholder="Maharashtra" fieldPerm={f('present_state')} />
        <FormInput name="present_country"  label="Country"  required placeholder="India" fieldPerm={f('present_country')} />
      </div>
      <FormInput name="present_pincode" label="Pin Code" required placeholder="400058" maxLength={6} fieldPerm={f('present_pincode')} />

      <SectionTitle title="Permanent Address" fields={[f('perm_address_type')]} />
      <FormSelect name="perm_address_type" label="Permanent Address Type" required options={toOpts(PERM_ADDRESS_TYPE)} fieldPerm={f('perm_address_type')} />

      {isOther && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormSelect name="perm_house_type" label="House Type" options={toOpts(HOUSE_TYPE)} placeholder="Own or Rent" fieldPerm={f('perm_house_type')} />
            <FormInput  name="perm_house_no"   label="House No." placeholder="Flat / Door No." fieldPerm={f('perm_house_no')} />
          </div>
          <FormInput name="perm_area" label="Area / Village" fieldPerm={f('perm_area')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <FormInput name="perm_district" label="District" fieldPerm={f('perm_district')} />
            <FormInput name="perm_city"     label="City" fieldPerm={f('perm_city')} />
            <FormInput name="perm_state"    label="State" fieldPerm={f('perm_state')} />
            <FormInput name="perm_country"  label="Country" fieldPerm={f('perm_country')} />
          </div>
          <FormInput name="perm_pincode" label="Pin Code" maxLength={6} fieldPerm={f('perm_pincode')} />
        </>
      )}
      {!isOther && permType && (
        <div style={{ padding: '10px 14px', background: 'var(--blue-lt)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--blue)' }}>
          ✓ Permanent address is same as present address
        </div>
      )}
    </div>
    </FormSection>
  );
}
